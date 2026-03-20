import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, Map, Cpu, Database, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';

type StatusCounts = {
  pending: number;
  scraped: number;
  processed: number;
  imported: number;
  failed: number;
  total: number;
};

export default function ProductImport() {
  const { toast } = useToast();
  const [mapUrl, setMapUrl] = useState('https://valves-direct.com');
  const [mapLoading, setMapLoading] = useState(false);
  const [mappedUrls, setMappedUrls] = useState<string[]>([]);
  const [urlFilter, setUrlFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, scraped: 0, processed: 0, imported: 0, failed: 0, total: 0 });
  const [scrapeRunning, setScrapeRunning] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [insertRunning, setInsertRunning] = useState(false);
  const scrapeRef = useRef(false);
  const aiRef = useRef(false);
  const insertRef = useRef(false);

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
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Step 1: Map URLs
  const handleMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setMapLoading(true);
    setMappedUrls([]);
    try {
      const res = await firecrawlApi.map(mapUrl, { limit: 5000 });
      const resAny = res as any;
      const links = res.data?.links || resAny.links || [];
      if (links.length) {
        setMappedUrls(links);
        toast({ title: 'Map complete', description: `Found ${links.length} URLs` });
      } else {
        toast({ title: 'No URLs found', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Map failed', variant: 'destructive' });
    } finally {
      setMapLoading(false);
    }
  };

  const filteredUrls = urlFilter
    ? mappedUrls.filter(u => u.toLowerCase().includes(urlFilter.toLowerCase()))
    : mappedUrls;

  const saveUrlsAsJobs = async () => {
    if (!filteredUrls.length) return;
    setSaving(true);
    try {
      const batchSize = 500;
      for (let i = 0; i < filteredUrls.length; i += batchSize) {
        const batch = filteredUrls.slice(i, i + batchSize).map(url => ({
          source_url: url,
          status: 'pending' as const,
        }));
        const { error } = await supabase.from('scrape_jobs').insert(batch as any);
        if (error) throw error;
      }
      toast({ title: 'URLs saved', description: `${filteredUrls.length} jobs created` });
      setMappedUrls([]);
      fetchCounts();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Batch scrape
  const runScrapeLoop = async () => {
    scrapeRef.current = true;
    setScrapeRunning(true);
    while (scrapeRef.current) {
      const res = await firecrawlApi.scrapeBatch(5);
      fetchCounts();
      if (!res.success || (res as any).scraped === 0) break;
    }
    setScrapeRunning(false);
    scrapeRef.current = false;
  };

  const stopScrape = () => { scrapeRef.current = false; };

  // Step 3: AI process
  const runAiLoop = async () => {
    aiRef.current = true;
    setAiRunning(true);
    while (aiRef.current) {
      const res = await firecrawlApi.aiProcess(3);
      fetchCounts();
      if (!res.success || (res as any).processed === 0 || (res as any).rateLimited) {
        if ((res as any).rateLimited) {
          toast({ title: 'Rate limited', description: 'Pausing for 30s...' });
          await new Promise(r => setTimeout(r, 30000));
          continue;
        }
        break;
      }
    }
    setAiRunning(false);
    aiRef.current = false;
  };

  const stopAi = () => { aiRef.current = false; };

  // Step 4: Bulk insert
  const runInsertLoop = async () => {
    insertRef.current = true;
    setInsertRunning(true);
    while (insertRef.current) {
      const res = await firecrawlApi.bulkInsert(10);
      fetchCounts();
      if (!res.success || (res as any).imported === 0) break;
    }
    setInsertRunning(false);
    insertRef.current = false;
  };

  const stopInsert = () => { insertRef.current = false; };

  // Retry failed
  const retryFailed = async () => {
    const { error } = await supabase
      .from('scrape_jobs')
      .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() } as any)
      .eq('status', 'failed');
    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Failed jobs reset to pending' });
      fetchCounts();
    }
  };

  const totalProgress = counts.total > 0
    ? Math.round(((counts.imported) / counts.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Import Pipeline</h1>
        <p className="text-muted-foreground mt-1">
          4-step pipeline: Discover → Scrape → AI Process → Import
        </p>
      </div>

      {/* Status overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={totalProgress} className="mb-3" />
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline">Pending: {counts.pending}</Badge>
            <Badge variant="secondary">Scraped: {counts.scraped}</Badge>
            <Badge className="bg-blue-500/20 text-blue-700 border-blue-300">Processed: {counts.processed}</Badge>
            <Badge className="bg-green-500/20 text-green-700 border-green-300">Imported: {counts.imported}</Badge>
            {counts.failed > 0 && (
              <Badge variant="destructive">Failed: {counts.failed}</Badge>
            )}
            <span className="text-muted-foreground ml-auto">Total: {counts.total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Discover */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4" /> Step 1 — Discover URLs
          </CardTitle>
          <CardDescription>Map a source website to find product pages, filter, then save as jobs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleMap} className="flex gap-3">
            <Input value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://valves-direct.com" className="flex-1" />
            <Button type="submit" disabled={mapLoading}>
              {mapLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mapping...</> : 'Map URLs'}
            </Button>
          </form>

          {mappedUrls.length > 0 && (
            <>
              <div className="flex gap-3 items-center">
                <Input
                  value={urlFilter}
                  onChange={e => setUrlFilter(e.target.value)}
                  placeholder="Filter URLs (e.g. /product/)"
                  className="flex-1"
                />
                <Badge variant="secondary">{filteredUrls.length} of {mappedUrls.length}</Badge>
                <Button onClick={saveUrlsAsJobs} disabled={saving || !filteredUrls.length}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save as Jobs
                </Button>
              </div>
              <div className="max-h-48 overflow-auto rounded border bg-muted/50 p-2 text-xs space-y-0.5">
                {filteredUrls.slice(0, 100).map((url, i) => (
                  <div key={i} className="truncate text-muted-foreground">{url}</div>
                ))}
                {filteredUrls.length > 100 && <div className="text-muted-foreground pt-1">...and {filteredUrls.length - 100} more</div>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Scrape */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Step 2 — Batch Scrape
          </CardTitle>
          <CardDescription>Scrape pending URLs with Firecrawl (5 per batch, auto-continues).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {!scrapeRunning ? (
              <Button onClick={runScrapeLoop} disabled={counts.pending === 0}>
                <Play className="h-4 w-4 mr-2" /> Start Scraping
              </Button>
            ) : (
              <Button variant="outline" onClick={stopScrape}>
                <Pause className="h-4 w-4 mr-2" /> Stop
              </Button>
            )}
            <span className="text-sm text-muted-foreground self-center">
              {counts.pending} pending → {counts.scraped} scraped
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: AI Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4" /> Step 3 — AI Rewrite & Translate
          </CardTitle>
          <CardDescription>Rewrite descriptions, translate to Italian, match categories (3 per batch).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {!aiRunning ? (
              <Button onClick={runAiLoop} disabled={counts.scraped === 0}>
                <Play className="h-4 w-4 mr-2" /> Start AI Processing
              </Button>
            ) : (
              <Button variant="outline" onClick={stopAi}>
                <Pause className="h-4 w-4 mr-2" /> Stop
              </Button>
            )}
            <span className="text-sm text-muted-foreground self-center">
              {counts.scraped} scraped → {counts.processed} processed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Step 4 — Bulk Insert
          </CardTitle>
          <CardDescription>Insert processed products into the catalog (10 per batch).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {!insertRunning ? (
              <Button onClick={runInsertLoop} disabled={counts.processed === 0}>
                <Play className="h-4 w-4 mr-2" /> Start Import
              </Button>
            ) : (
              <Button variant="outline" onClick={stopInsert}>
                <Pause className="h-4 w-4 mr-2" /> Stop
              </Button>
            )}
            <span className="text-sm text-muted-foreground self-center">
              {counts.processed} processed → {counts.imported} imported
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Retry failed */}
      {counts.failed > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={retryFailed}>
                <RotateCcw className="h-4 w-4 mr-2" /> Retry {counts.failed} Failed Jobs
              </Button>
              <span className="text-sm text-muted-foreground">Reset failed jobs back to pending status</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
