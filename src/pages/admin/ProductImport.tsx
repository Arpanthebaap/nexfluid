import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Globe, Map, Cpu, Database, Loader2, Play, Square, RotateCcw, ChevronDown, Rocket, Trash2, Clock, ImageIcon } from 'lucide-react';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';

const SOURCE_CATEGORY_URLS = [
  'https://www.valves-direct.com/3-air-preparation-equipment',
  'https://www.valves-direct.com/4-manually-operated-valves',
  'https://www.valves-direct.com/5-pinch-valves',
  'https://www.valves-direct.com/6-pneumatic-cylinders',
  'https://www.valves-direct.com/7-proportional-valves',
  'https://www.valves-direct.com/8-seat-valves',
  'https://www.valves-direct.com/9-sensors-switches',
  'https://www.valves-direct.com/10-solenoid-valves',
  'https://www.valves-direct.com/11-vacuum-technologies',
  'https://www.valves-direct.com/12-valve-systems',
  'https://it.rs-online.com/web/b/parker/',
];

type StatusCounts = {
  pending: number;
  scraped: number;
  processed: number;
  imported: number;
  failed: number;
  total: number;
};

type PipelinePhase = 'idle' | 'discovering' | 'running' | 'paused';

export default function ProductImport() {
  const { toast } = useToast();
  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, scraped: 0, processed: 0, imported: 0, failed: 0, total: 0 });
  const [phase, setPhase] = useState<PipelinePhase>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapingImages, setScrapingImages] = useState(false);
  const stopRef = useRef(false);
  const lastImportedRef = useRef(0);
  const speedCheckRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 200));
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_scrape_job_counts');
      if (error) { console.error('Count fetch error:', error); return; }
      const d = data as any;
      const results: StatusCounts = {
        pending: Number(d.pending) || 0,
        scraped: Number(d.scraped) || 0,
        processed: Number(d.processed) || 0,
        imported: Number(d.imported) || 0,
        failed: Number(d.failed) || 0,
        total: 0,
      };
      results.total = results.pending + results.scraped + results.processed + results.imported + results.failed;
      setCounts(results);
      return results;
    } catch (err) {
      console.error('Count fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Speed calculation
  useEffect(() => {
    if (phase === 'running' && startTime) {
      const elapsed = (Date.now() - startTime) / 60000; // minutes
      if (elapsed > 0.5) {
        setSpeed(Math.round(counts.imported / elapsed));
      }
    }
  }, [counts.imported, phase, startTime]);

  const runFullPipeline = async (forceDiscovery = false) => {
    stopRef.current = false;
    setStartTime(Date.now());
    setLogs([]);
    lastImportedRef.current = 0;

    // Check if there's already a backlog — skip discovery unless forced
    const currentCounts = await fetchCounts();
    const backlog = (currentCounts?.pending || 0) + (currentCounts?.scraped || 0) + (currentCounts?.processed || 0);

    if (backlog > 0 && !forceDiscovery) {
      addLog(`⏩ Skipping discovery — ${backlog} jobs already in queue. Use "Force Discovery" to add more.`);
    } else {
      setPhase('discovering');
      addLog('🚀 Starting URL discovery from category pages...');
      let totalNewUrls = 0;
      for (let i = 0; i < SOURCE_CATEGORY_URLS.length; i++) {
        if (stopRef.current) break;
        const catUrl = SOURCE_CATEGORY_URLS[i];
        addLog(`🔍 [${i + 1}/${SOURCE_CATEGORY_URLS.length}] Discovering: ${catUrl}`);
        try {
          const res = await firecrawlApi.discoverCategory(catUrl);
          const data = res as any;
          if (res.success) {
            totalNewUrls += data.totalNew || 0;
            addLog(`✅ Found ${data.totalFound || 0} products, ${data.totalNew || 0} new${data.timedOut ? ' (partial — timed out)' : ''}`);
          } else {
            addLog(`⚠️ ${catUrl}: ${res.error}`);
          }
        } catch (err) {
          addLog(`❌ ${catUrl}: ${err}`);
        }
        await fetchCounts();
      }
      addLog(`📊 Discovery complete: ${totalNewUrls} total new URLs discovered`);
    }

    await fetchCounts();
    if (stopRef.current) { setPhase('paused'); return; }

    // Smart backlog routing: only start loops that have work
    setPhase('running');
    const latest = await fetchCounts();
    const hasPending = (latest?.pending || 0) > 0;
    const hasScraped = (latest?.scraped || 0) > 0;
    const hasProcessed = (latest?.processed || 0) > 0;

    const loops: Promise<void>[] = [];
    if (hasPending) {
      addLog('⚡ Starting scrape loop (pending jobs exist)...');
      loops.push(runScrapeLoop());
    }
    if (hasPending || hasScraped) {
      addLog('🤖 Starting AI process loop...');
      loops.push(runAiLoop());
    }
    if (hasPending || hasScraped || hasProcessed) {
      addLog('📦 Starting import loop...');
      loops.push(runInsertLoop());
    }

    if (loops.length === 0) {
      addLog('✅ No backlog to process.');
      setPhase('idle');
      return;
    }

    await Promise.all(loops);

    if (stopRef.current) {
      setPhase('paused');
      addLog('⏸️ Pipeline paused. Click Start to resume.');
    } else {
      setPhase('idle');
      addLog('🎉 Pipeline complete!');
      toast({ title: 'Pipeline complete', description: 'All products have been processed.' });
    }
    await fetchCounts();
  };

  const runScrapeLoop = async () => {
    let emptyRounds = 0;
    while (!stopRef.current) {
      try {
        const res = await firecrawlApi.scrapeBatch(2);
        const data = res as any;
        if (!res.success) { addLog(`❌ Scrape error: ${res.error}`); break; }
        if (data.scraped === 0) {
          emptyRounds++;
          if (emptyRounds > 5) break; // no more pending
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        emptyRounds = 0;
        addLog(`🔍 Scraped ${data.scraped} products (${data.failed || 0} failed)`);
      } catch (err) {
        addLog(`❌ Scrape error: ${err}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  const runAiLoop = async (skipDelay = false) => {
    if (!skipDelay) await new Promise(r => setTimeout(r, 10000));
    let emptyRounds = 0;
    let transientRetries = 0;
    while (!stopRef.current) {
      try {
        const res = await firecrawlApi.aiProcess(2);
        const data = res as any;
        transientRetries = 0; // reset on successful response
        if (data.rateLimited) {
          addLog('⏳ AI rate limited, waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
        if (!res.success) {
          if (res.error?.includes('402')) { addLog('💳 AI credits exhausted'); break; }
          addLog(`❌ AI error: ${res.error}`);
          // Transient error — retry with backoff instead of breaking
          transientRetries++;
          if (transientRetries >= 3) { addLog('⚠️ Too many consecutive AI errors, stopping.'); break; }
          await new Promise(r => setTimeout(r, 5000 * transientRetries));
          continue;
        }
        if (data.processed === 0) {
          emptyRounds++;
          if (emptyRounds > 10) break;
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        emptyRounds = 0;
        addLog(`🤖 AI processed ${data.processed} products`);
        await fetchCounts();
      } catch (err) {
        transientRetries++;
        addLog(`❌ AI error (attempt ${transientRetries}/3): ${err}`);
        if (transientRetries >= 3) { addLog('⚠️ Too many consecutive AI errors, stopping.'); break; }
        await new Promise(r => setTimeout(r, 5000 * transientRetries));
      }
    }
  };

  const runInsertLoop = async (skipDelay = false) => {
    if (!skipDelay) await new Promise(r => setTimeout(r, 20000));
    let emptyRounds = 0;
    while (!stopRef.current) {
      try {
        const res = await firecrawlApi.bulkInsert(10);
        const data = res as any;
        if (!res.success) { addLog(`❌ Import error: ${res.error}`); break; }
        if (data.imported === 0) {
          emptyRounds++;
          if (emptyRounds > 15) break;
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        emptyRounds = 0;
        addLog(`📦 Imported ${data.imported} products`);
        await fetchCounts();
      } catch (err) {
        addLog(`❌ Import error: ${err}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  const stopPipeline = () => {
    stopRef.current = true;
    addLog('⏸️ Stopping after current batch...');
  };

  const runStandaloneScrape = async () => {
    stopRef.current = false;
    setScraping(true);
    addLog('🔍 Starting standalone scrape loop...');
    await runScrapeLoop();
    setScraping(false);
    addLog(stopRef.current ? '⏸️ Scrape stopped.' : '✅ Scrape loop complete.');
    await fetchCounts();
  };

  const runStandaloneProcess = async () => {
    stopRef.current = false;
    setProcessing(true);
    addLog('🤖 Starting standalone AI process loop...');
    await runAiLoop(true);
    setProcessing(false);
    addLog(stopRef.current ? '⏸️ AI processing stopped.' : '✅ AI processing complete.');
    await fetchCounts();
  };

  const runStandaloneImport = async () => {
    stopRef.current = false;
    setImporting(true);
    addLog('📦 Starting standalone import loop...');
    await runInsertLoop(true);
    setImporting(false);
    addLog(stopRef.current ? '⏸️ Import stopped.' : '✅ Import complete.');
    await fetchCounts();
  };

  const resumePipeline = async () => {
    stopRef.current = false;
    setPhase('running');
    addLog('▶️ Resuming pipeline...');

    await Promise.all([
      runScrapeLoop(),
      runAiLoop(),
      runInsertLoop(),
    ]);

    if (stopRef.current) {
      setPhase('paused');
    } else {
      setPhase('idle');
      addLog('🎉 Pipeline complete!');
    }
    await fetchCounts();
  };

  const retryFailed = async () => {
    const { error } = await supabase
      .from('scrape_jobs')
      .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() } as any)
      .eq('status', 'failed');
    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${counts.failed} failed jobs reset to pending` });
      fetchCounts();
    }
  };

  const clearAllJobs = async () => {
    if (!confirm('This will delete ALL scrape jobs. Are you sure?')) return;
    const { error } = await supabase.from('scrape_jobs').delete().in('status', ['pending', 'scraped', 'processed', 'imported', 'failed']);
    if (error) {
      toast({ title: 'Clear failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'All jobs cleared' });
      fetchCounts();
    }
  };

  const totalProgress = counts.total > 0
    ? Math.round((counts.imported / counts.total) * 100)
    : 0;

  const eta = speed > 0 && counts.total > counts.imported
    ? Math.round((counts.total - counts.imported) / speed)
    : null;

  const isRunning = phase === 'running' || phase === 'discovering';
  const anyRunning = isRunning || scraping || processing || importing || scrapingImages;

  const runImageScrape = async () => {
    stopRef.current = false;
    setScrapingImages(true);
    addLog('🖼️ Starting image scrape for products without images...');
    let totalProcessed = 0;
    let emptyRounds = 0;
    while (!stopRef.current) {
      try {
        const res = await firecrawlApi.scrapeImages(5);
        const data = res as any;
        if (!res.success) { addLog(`❌ Image scrape error: ${res.error}`); break; }
        if (data.processed === 0) {
          emptyRounds++;
          if (emptyRounds > 3) break;
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        emptyRounds = 0;
        totalProcessed += data.processed;
        addLog(`🖼️ Scraped images for ${data.processed} products (${data.failed || 0} failed) — Total: ${totalProcessed}`);
      } catch (err) {
        addLog(`❌ Image scrape error: ${err}`);
        break;
      }
    }
    setScrapingImages(false);
    addLog(stopRef.current ? '⏸️ Image scrape stopped.' : `✅ Image scrape complete: ${totalProcessed} products updated.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Import Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          One-click automation: Discover → Scrape → AI Rewrite → Import
        </p>
      </div>

      {/* Main control card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {phase === 'idle' && 'Ready to start'}
                {phase === 'discovering' && '🔍 Discovering product URLs...'}
                {phase === 'running' && '⚡ Pipeline running...'}
                {phase === 'paused' && '⏸️ Pipeline paused'}
              </span>
              <span className="text-muted-foreground">
                {counts.imported} / {counts.total} imported ({totalProgress}%)
              </span>
            </div>
            <Progress value={totalProgress} className="h-3" />
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="gap-1"><Map className="h-3 w-3" /> Pending: {counts.pending}</Badge>
            <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" /> Scraped: {counts.scraped}</Badge>
            <Badge className="bg-blue-500/20 text-blue-700 border-blue-300 gap-1"><Cpu className="h-3 w-3" /> Processed: {counts.processed}</Badge>
            <Badge className="bg-green-500/20 text-green-700 border-green-300 gap-1"><Database className="h-3 w-3" /> Imported: {counts.imported}</Badge>
            {counts.failed > 0 && <Badge variant="destructive" className="gap-1">Failed: {counts.failed}</Badge>}
          </div>

          {/* Speed & ETA */}
          {(isRunning || scraping || processing || importing) && speed > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>⚡ {speed} products/min</span>
              {eta && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{eta} min remaining</span>}
            </div>
          )}

          {/* Main action buttons */}
          <div className="flex flex-wrap gap-3">
            {phase === 'idle' && !anyRunning && (
              <>
                <Button size="lg" onClick={() => runFullPipeline(false)} className="gap-2">
                  <Rocket className="h-4 w-4" /> Start Full Pipeline
                </Button>
                <Button size="lg" variant="outline" onClick={() => runFullPipeline(true)} className="gap-2">
                  <Map className="h-4 w-4" /> Force Discovery + Pipeline
                </Button>
              </>
            )}
            {phase === 'paused' && !anyRunning && (
              <Button size="lg" onClick={resumePipeline} className="gap-2">
                <Play className="h-4 w-4" /> Resume Pipeline
              </Button>
            )}
            {isRunning && (
              <Button size="lg" variant="outline" onClick={stopPipeline} className="gap-2">
                {phase === 'discovering' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                Stop Pipeline
              </Button>
            )}
          </div>

          {/* Standalone loop buttons */}
          <div className="flex flex-wrap gap-3">
            {scraping ? (
              <Button variant="outline" onClick={stopPipeline} className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop Scraping
              </Button>
            ) : (
              <Button variant="outline" onClick={runStandaloneScrape} disabled={counts.pending === 0 || anyRunning} className="gap-2">
                <Globe className="h-4 w-4" /> Scrape All
                {counts.pending > 0 && <Badge variant="secondary" className="ml-1 text-xs">{counts.pending.toLocaleString()}</Badge>}
              </Button>
            )}

            {processing ? (
              <Button variant="outline" onClick={stopPipeline} className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop Processing
              </Button>
            ) : (
              <Button variant="outline" onClick={runStandaloneProcess} disabled={counts.scraped === 0 || anyRunning} className="gap-2">
                <Cpu className="h-4 w-4" /> Process All
                {counts.scraped > 0 && <Badge variant="secondary" className="ml-1 text-xs">{counts.scraped.toLocaleString()}</Badge>}
              </Button>
            )}

            {importing ? (
              <Button variant="outline" onClick={stopPipeline} className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop Importing
              </Button>
            ) : (
              <Button variant="outline" onClick={runStandaloneImport} disabled={counts.processed === 0 || anyRunning} className="gap-2">
                <Database className="h-4 w-4" /> Import All
                {counts.processed > 0 && <Badge variant="secondary" className="ml-1 text-xs">{counts.processed.toLocaleString()}</Badge>}
              </Button>
            )}
          </div>

          {/* Image scrape button */}
          <div className="flex flex-wrap gap-3">
            {scrapingImages ? (
              <Button variant="outline" onClick={stopPipeline} className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Stop Image Scrape
              </Button>
            ) : (
              <Button variant="outline" onClick={runImageScrape} disabled={anyRunning} className="gap-2">
                <ImageIcon className="h-4 w-4" /> Scrape Product Images
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {counts.failed > 0 && !anyRunning && (
              <Button variant="outline" onClick={retryFailed} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Retry {counts.failed} Failed
              </Button>
            )}
            {!anyRunning && counts.total > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllJobs} className="gap-2 text-destructive ml-auto">
                <Trash2 className="h-3 w-3" /> Clear All Jobs
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-auto rounded border bg-muted/50 p-3 text-xs font-mono space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced manual controls */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="gap-2 text-muted-foreground">
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            Advanced: Manual Step Controls
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Batch Scrape</CardTitle>
              <CardDescription className="text-xs">Scrape pending URLs (5 per batch)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={async () => {
                const res = await firecrawlApi.scrapeBatch(5);
                addLog(`Manual scrape: ${JSON.stringify(res)}`);
                fetchCounts();
              }} disabled={counts.pending === 0 || isRunning}>Run Once</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4" /> AI Process</CardTitle>
              <CardDescription className="text-xs">AI rewrite scraped content (3 per batch)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={async () => {
                const res = await firecrawlApi.aiProcess(3);
                addLog(`Manual AI: ${JSON.stringify(res)}`);
                fetchCounts();
              }} disabled={counts.scraped === 0 || isRunning}>Run Once</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" /> Bulk Insert</CardTitle>
              <CardDescription className="text-xs">Import processed products (10 per batch)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={async () => {
                const res = await firecrawlApi.bulkInsert(10);
                addLog(`Manual import: ${JSON.stringify(res)}`);
                fetchCounts();
              }} disabled={counts.processed === 0 || isRunning}>Run Once</Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
