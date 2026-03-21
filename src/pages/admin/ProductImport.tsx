import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Globe, Map, Cpu, Database, Loader2, Play, Square, RotateCcw, ChevronDown, Rocket, Trash2, Clock } from 'lucide-react';
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
  const [speed, setSpeed] = useState(0); // products imported per minute
  const stopRef = useRef(false);
  const lastImportedRef = useRef(0);
  const speedCheckRef = useRef<number>(0);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 200));
  }, []);

  const fetchCounts = useCallback(async () => {
    const statuses = ['pending', 'scraped', 'processed', 'imported', 'failed'] as const;
    const results: any = {};
    let total = 0;
    for (const s of statuses) {
      const { count } = await supabase.from('scrape_jobs').select('*', { count: 'exact', head: true }).eq('status', s);
      results[s] = count || 0;
      total += count || 0;
    }
    results.total = total;
    setCounts(results);
    return results as StatusCounts;
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 3000);
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

  const runFullPipeline = async () => {
    stopRef.current = false;
    setPhase('discovering');
    setStartTime(Date.now());
    setLogs([]);
    lastImportedRef.current = 0;

    // Phase 1: Discovery — one category at a time to avoid 60s timeout
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

    await fetchCounts();
    if (stopRef.current) { setPhase('paused'); return; }

    // Phase 2-4: Parallel loops
    setPhase('running');
    addLog('⚡ Starting parallel scrape → AI → import pipeline...');

    await Promise.all([
      runScrapeLoop(),
      runAiLoop(),
      runInsertLoop(),
    ]);

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

  const runAiLoop = async () => {
    // Wait for first scraped jobs
    await new Promise(r => setTimeout(r, 10000));
    let emptyRounds = 0;
    while (!stopRef.current) {
      try {
        const res = await firecrawlApi.aiProcess(3);
        const data = res as any;
        if (data.rateLimited) {
          addLog('⏳ AI rate limited, waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
        if (!res.success) {
          if (res.error?.includes('402')) { addLog('💳 AI credits exhausted'); break; }
          addLog(`❌ AI error: ${res.error}`);
          break;
        }
        if (data.processed === 0) {
          emptyRounds++;
          if (emptyRounds > 10) break;
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        emptyRounds = 0;
        addLog(`🤖 AI processed ${data.processed} products`);
      } catch (err) {
        addLog(`❌ AI error: ${err}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  const runInsertLoop = async () => {
    // Wait for first processed jobs
    await new Promise(r => setTimeout(r, 20000));
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
      } catch (err) {
        addLog(`❌ Import error: ${err}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  const stopPipeline = () => {
    stopRef.current = true;
    addLog('⏸️ Stopping pipeline after current batch...');
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
          {isRunning && speed > 0 && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>⚡ {speed} products/min</span>
              {eta && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{eta} min remaining</span>}
            </div>
          )}

          {/* Main action buttons */}
          <div className="flex gap-3">
            {phase === 'idle' && (
              <Button size="lg" onClick={runFullPipeline} className="gap-2">
                <Rocket className="h-4 w-4" /> Start Full Pipeline
              </Button>
            )}
            {phase === 'paused' && (
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
            {counts.failed > 0 && !isRunning && (
              <Button variant="outline" onClick={retryFailed} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Retry {counts.failed} Failed
              </Button>
            )}
            {!isRunning && counts.total > 0 && (
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
