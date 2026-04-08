import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Map, Cpu, Database, Loader2, Play, Square, RotateCcw, ChevronDown, Rocket, Trash2, Clock, ImageIcon, Link2, Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';

// Permanent failure patterns that should be deleted, not retried
const PERMANENT_FAILURE_PATTERNS = [
  'non-whitelisted brand',
  'Pre-filter',
  'URL pre-filter',
  'Invalid brand',
  'No scraped content',
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

type SourceLink = {
  id: string;
  url: string;
  label: string | null;
  is_active: boolean;
  last_discovered_at: string | null;
  product_count: number;
};

type SourceLinkStat = {
  source_link: string;
  total: number;
  pending: number;
  scraped: number;
  processed: number;
  imported: number;
  failed: number;
  failed_brand: number;
};

export default function ProductImport() {
  const { toast } = useToast();
  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, scraped: 0, processed: 0, imported: 0, failed: 0, total: 0 });
  const [phase, setPhase] = useState<PipelinePhase>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sourceLinksOpen, setSourceLinksOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapingImages, setScrapingImages] = useState(false);
  const [manualUrls, setManualUrls] = useState('');
  const [addingUrls, setAddingUrls] = useState(false);
  const [singleSourceUrl, setSingleSourceUrl] = useState('');
  const [discoveringSingle, setDiscoveringSingle] = useState(false);
  const [singleResult, setSingleResult] = useState<any>(null);
  const [sourceLinks, setSourceLinks] = useState<SourceLink[]>([]);
  const [sourceLinkStats, setSourceLinkStats] = useState<SourceLinkStat[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
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

  const fetchSourceLinkStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_source_link_stats');
      if (!error && data) setSourceLinkStats(data as any);
    } catch (err) {
      console.error('Source link stats error:', err);
    }
  }, []);

  const fetchSourceLinks = useCallback(async () => {
    const { data } = await supabase
      .from('source_links')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setSourceLinks(data as any);
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchSourceLinks();
    fetchSourceLinkStats();
    const interval = setInterval(() => { fetchCounts(); fetchSourceLinkStats(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchCounts, fetchSourceLinks, fetchSourceLinkStats]);

  // Speed calculation
  useEffect(() => {
    if (phase === 'running' && startTime) {
      const elapsed = (Date.now() - startTime) / 60000;
      if (elapsed > 0.5) {
        setSpeed(Math.round(counts.imported / elapsed));
      }
    }
  }, [counts.imported, phase, startTime]);

  const getActiveSourceUrls = () => {
    return sourceLinks.filter(s => s.is_active).map(s => s.url);
  };

  const runFullPipeline = async (forceDiscovery = false) => {
    stopRef.current = false;
    setStartTime(Date.now());
    setLogs([]);
    lastImportedRef.current = 0;

    const currentCounts = await fetchCounts();
    const backlog = (currentCounts?.pending || 0) + (currentCounts?.scraped || 0) + (currentCounts?.processed || 0);

    if (backlog > 0 && !forceDiscovery) {
      addLog(`⏩ Skipping discovery — ${backlog} jobs already in queue. Use "Force Discovery" to add more.`);
    } else {
      setPhase('discovering');
      const urls = getActiveSourceUrls();
      addLog(`🚀 Starting URL discovery from ${urls.length} source links...`);
      let totalNewUrls = 0;
      for (let i = 0; i < urls.length; i++) {
        if (stopRef.current) break;
        const catUrl = urls[i];
        addLog(`🔍 [${i + 1}/${urls.length}] Discovering: ${catUrl}`);
        try {
          const res = await firecrawlApi.discoverCategory(catUrl);
          const data = res as any;
          if (res.success) {
            totalNewUrls += data.totalNew || 0;
            const requeuedInfo = data.totalRequeued ? `, ${data.totalRequeued} requeued from failed` : '';
            addLog(`✅ Found ${data.totalFound || 0} products, ${data.totalNew || 0} new${requeuedInfo}${data.timedOut ? ' (partial — timed out)' : ''}`);
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
        if (data.total === 0) {
          emptyRounds++;
          if (emptyRounds > 5) break;
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        emptyRounds = 0;
        addLog(`🔍 Scraped ${data.scraped} products (${data.failed || 0} failed, ${data.skippedBrand || 0} brand-skipped)`);
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
        transientRetries = 0;
        if (data.rateLimited) {
          addLog('⏳ AI rate limited, waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
        if (!res.success) {
          if (res.error?.includes('402')) { addLog('💳 AI credits exhausted'); break; }
          addLog(`❌ AI error: ${res.error}`);
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
    await Promise.all([runScrapeLoop(), runAiLoop(), runInsertLoop()]);
    if (stopRef.current) {
      setPhase('paused');
    } else {
      setPhase('idle');
      addLog('🎉 Pipeline complete!');
    }
    await fetchCounts();
  };

  const deletePermanentFailures = async () => {
    addLog('🗑️ Deleting permanent failures (brand-rejected, no content)...');
    let totalDeleted = 0;
    for (const pattern of PERMANENT_FAILURE_PATTERNS) {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .delete()
        .eq('status', 'failed')
        .ilike('error_message', `%${pattern}%`)
        .select('id');
      if (error) {
        addLog(`❌ Delete error: ${error.message}`);
      } else {
        totalDeleted += (data?.length || 0);
      }
    }
    addLog(`✅ Deleted ${totalDeleted} permanent failures`);
    toast({ title: `Deleted ${totalDeleted} permanent failures` });
    fetchCounts();
  };

  const retryTransientFailures = async () => {
    // Build a filter that excludes permanent failures
    let query = supabase
      .from('scrape_jobs')
      .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() } as any)
      .eq('status', 'failed');

    for (const pattern of PERMANENT_FAILURE_PATTERNS) {
      query = query.not('error_message', 'ilike', `%${pattern}%`);
    }

    const { data, error } = await query.select('id');
    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    } else {
      const count = data?.length || 0;
      toast({ title: `${count} transient failures reset to pending` });
      addLog(`♻️ Reset ${count} transient failures to pending`);
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

  const addSourceLink = async () => {
    if (!newSourceUrl.trim()) return;
    const { error } = await supabase.from('source_links').insert({
      url: newSourceUrl.trim(),
      label: newSourceLabel.trim() || null,
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewSourceUrl('');
      setNewSourceLabel('');
      fetchSourceLinks();
      toast({ title: 'Source link added' });
    }
  };

  const removeSourceLink = async (id: string) => {
    await supabase.from('source_links').delete().eq('id', id);
    fetchSourceLinks();
  };

  const toggleSourceLink = async (id: string, isActive: boolean) => {
    await supabase.from('source_links').update({ is_active: !isActive } as any).eq('id', id);
    fetchSourceLinks();
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

          {/* Failed job management */}
          <div className="flex flex-wrap gap-3">
            {counts.failed > 0 && !anyRunning && (
              <>
                <Button variant="outline" onClick={deletePermanentFailures} className="gap-2">
                  <Trash2 className="h-4 w-4" /> Delete Permanent Failures
                </Button>
                <Button variant="outline" onClick={retryTransientFailures} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Retry Transient Failures
                </Button>
              </>
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

      {/* Source Links Registry */}
      <Collapsible open={sourceLinksOpen} onOpenChange={setSourceLinksOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="gap-2 w-full justify-start">
            <ChevronDown className={`h-4 w-4 transition-transform ${sourceLinksOpen ? 'rotate-180' : ''}`} />
            Source Links ({sourceLinks.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Source Link Registry</CardTitle>
              <CardDescription className="text-xs">Manage the category/brand pages the pipeline discovers products from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                {sourceLinks.map(sl => (
                  <div key={sl.id} className="flex items-center gap-2 text-xs py-1 border-b border-muted last:border-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${sl.is_active ? 'text-green-600' : 'text-muted-foreground'}`}
                      onClick={() => toggleSourceLink(sl.id, sl.is_active)}
                      title={sl.is_active ? 'Active — click to disable' : 'Disabled — click to enable'}
                    >
                      {sl.is_active ? '●' : '○'}
                    </Button>
                    <span className="font-mono truncate flex-1">{sl.url}</span>
                    {sl.label && <Badge variant="outline" className="text-[10px]">{sl.label}</Badge>}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeSourceLink(sl.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.valves-direct.com/..."
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="font-mono text-xs flex-1"
                />
                <Input
                  placeholder="Label (optional)"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  className="text-xs w-40"
                />
                <Button size="sm" onClick={addSourceLink} disabled={!newSourceUrl.trim()} className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Single Source Link Discovery */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Single Source Link Discovery</CardTitle>
          <CardDescription className="text-xs">
            Paste a category or subcategory page URL to discover all product links within it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.valves-direct.com/10-solenoid-valves"
              value={singleSourceUrl}
              onChange={(e) => setSingleSourceUrl(e.target.value)}
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              disabled={!singleSourceUrl.trim() || discoveringSingle}
              onClick={async () => {
                setDiscoveringSingle(true);
                setSingleResult(null);
                const url = singleSourceUrl.trim();
                addLog(`🔍 Discovering products from: ${url}`);
                
                let totalFound = 0;
                let totalNew = 0;
                let totalRequeued = 0;
                let totalPagesScraped = 0;
                let callCount = 0;
                let resumeParams: { startSubcatIndex: number; startPage: number; subcategories: string[] } | undefined;
                
                try {
                  while (true) {
                    callCount++;
                    if (resumeParams) {
                      addLog(`🔄 Resuming discovery (call #${callCount}) — subcat ${resumeParams.startSubcatIndex}, page ${resumeParams.startPage}...`);
                    }
                    const res = await firecrawlApi.discoverCategory(url, resumeParams);
                    const data = res as any;
                    
                    if (!res.success) {
                      addLog(`❌ Discovery failed: ${res.error}`);
                      setSingleResult(data);
                      break;
                    }
                    
                    totalFound += data.totalFound || 0;
                    totalNew += data.totalNew || 0;
                    totalRequeued += data.totalRequeued || 0;
                    totalPagesScraped += data.pagesScraped || 0;
                    
                    addLog(`✅ Call #${callCount}: ${data.totalFound || 0} found, ${data.totalNew || 0} new (${data.pagesScraped || 0} pages scraped, ${data.elapsedSeconds || 0}s)`);
                    
                    if (data.resumeFrom && data.subcategories) {
                      resumeParams = {
                        startSubcatIndex: data.resumeFrom.subcatIndex,
                        startPage: data.resumeFrom.page,
                        subcategories: data.subcategories,
                      };
                      // Update running totals in UI
                      setSingleResult({
                        success: true,
                        totalFound,
                        totalNew,
                        totalRequeued,
                        pagesScraped: totalPagesScraped,
                        callCount,
                        timedOut: true,
                        inProgress: true,
                      });
                      await fetchCounts();
                    } else {
                      // Complete!
                      setSingleResult({
                        success: true,
                        totalFound,
                        totalNew,
                        totalRequeued,
                        pagesScraped: totalPagesScraped,
                        callCount,
                        timedOut: false,
                      });
                      addLog(`🎉 Discovery complete: ${totalFound} total found, ${totalNew} new, ${totalRequeued} requeued (${callCount} calls, ${totalPagesScraped} pages)`);
                      toast({ title: `Discovery complete`, description: `${totalFound} found, ${totalNew} new, ${totalRequeued} requeued` });
                      break;
                    }
                  }
                } catch (err) {
                  addLog(`❌ ${err}`);
                  toast({ title: 'Discovery failed', variant: 'destructive' });
                }
                setDiscoveringSingle(false);
                fetchCounts();
              }}
              className="gap-2 whitespace-nowrap"
            >
              {discoveringSingle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Discover
            </Button>
          </div>
          {singleResult && (
            <div className="flex flex-wrap gap-2 text-xs">
              {singleResult.success ? (
                <>
                  <Badge variant="outline">Found: {singleResult.totalFound || 0}</Badge>
                  <Badge className="bg-green-500/20 text-green-700 border-green-300">New: {singleResult.totalNew || 0}</Badge>
                  {(singleResult.totalRequeued || 0) > 0 && <Badge variant="secondary">Requeued: {singleResult.totalRequeued}</Badge>}
                  {singleResult.pagesScraped > 0 && <Badge variant="outline">Pages scraped: {singleResult.pagesScraped}</Badge>}
                  {singleResult.callCount > 1 && <Badge variant="outline">API calls: {singleResult.callCount}</Badge>}
                  {singleResult.inProgress && <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-300">Still discovering...</Badge>}
                  {!singleResult.inProgress && !singleResult.timedOut && <Badge className="bg-green-500/20 text-green-700 border-green-300">✓ Complete</Badge>}
                </>
              ) : (
                <Badge variant="destructive">{singleResult.error || 'Failed'}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual URL Input */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Add Specific URLs</CardTitle>
          <CardDescription className="text-xs">Paste product URLs (one per line) to add them directly to the pipeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={"https://www.valves-direct.com/123-product-name.html\nhttps://www.valves-direct.com/456-another-product.html"}
            value={manualUrls}
            onChange={(e) => setManualUrls(e.target.value)}
            rows={5}
            className="font-mono text-xs"
          />
          <Button
            size="sm"
            disabled={!manualUrls.trim() || addingUrls}
            onClick={async () => {
              setAddingUrls(true);
              const urls = manualUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
              addLog(`📎 Adding ${urls.length} URLs to pipeline...`);
              try {
                const res = await firecrawlApi.addUrls(urls);
                const data = res as any;
                if (res.success) {
                  addLog(`✅ Added: ${data.totalNew || 0} new, ${data.totalRequeued || 0} requeued, ${data.totalSkipped || 0} already exist`);
                  toast({ title: `${data.totalNew || 0} new URLs added to pipeline` });
                  setManualUrls('');
                } else {
                  addLog(`❌ ${res.error}`);
                  toast({ title: 'Error', description: res.error, variant: 'destructive' });
                }
              } catch (err) {
                addLog(`❌ ${err}`);
              }
              setAddingUrls(false);
              fetchCounts();
            }}
            className="gap-2"
          >
            {addingUrls ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Add to Pipeline
          </Button>
        </CardContent>
      </Card>

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
              <CardDescription className="text-xs">AI rewrite scraped content (2 per batch)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={async () => {
                const res = await firecrawlApi.aiProcess(2);
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
