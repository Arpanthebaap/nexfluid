import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Map, Search, Loader2, ExternalLink } from 'lucide-react';
import { firecrawlApi } from '@/lib/api/firecrawl';

export default function ProductImport() {
  const { toast } = useToast();

  // Map state
  const [mapUrl, setMapUrl] = useState('https://valves-direct.com');
  const [mapLoading, setMapLoading] = useState(false);
  const [mappedUrls, setMappedUrls] = useState<string[]>([]);

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleMap = async (e: React.FormEvent) => {
    e.preventDefault();
    setMapLoading(true);
    setMappedUrls([]);
    try {
      const res = await firecrawlApi.map(mapUrl, { limit: 5000 });
      const resAny = res as any;
      if (res.success !== false && (res.data?.links || resAny.links)) {
        const links = res.data?.links || resAny.links || [];
        setMappedUrls(links);
        toast({ title: 'Map complete', description: `Found ${links.length} URLs` });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to map', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Map request failed', variant: 'destructive' });
    } finally {
      setMapLoading(false);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setScrapeLoading(true);
    setScrapeResult(null);
    try {
      const res = await firecrawlApi.scrape(scrapeUrl, {
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      });
      if (res.success !== false) {
        setScrapeResult(res.data || res);
        toast({ title: 'Scrape complete' });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to scrape', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Scrape request failed', variant: 'destructive' });
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await firecrawlApi.search(searchQuery, { limit: 10 });
      if (res.success !== false && (res.data || res)) {
        setSearchResults(res.data || []);
        toast({ title: 'Search complete' });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to search', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Search request failed', variant: 'destructive' });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Import</h1>
        <p className="text-muted-foreground mt-1">
          Discover, scrape, and import products from source websites
        </p>
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map" className="gap-2">
            <Map className="h-4 w-4" /> Map URLs
          </TabsTrigger>
          <TabsTrigger value="scrape" className="gap-2">
            <Globe className="h-4 w-4" /> Scrape Page
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </TabsTrigger>
        </TabsList>

        {/* MAP TAB */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Map Website URLs</CardTitle>
              <CardDescription>
                Discover all product URLs on a source website. Start here to find pages to scrape.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMap} className="flex gap-3">
                <Input
                  value={mapUrl}
                  onChange={e => setMapUrl(e.target.value)}
                  placeholder="https://valves-direct.com"
                  className="flex-1"
                />
                <Button type="submit" disabled={mapLoading}>
                  {mapLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mapping...</> : 'Map URLs'}
                </Button>
              </form>

              {mappedUrls.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{mappedUrls.length} URLs found</Badge>
                  </div>
                  <div className="max-h-80 overflow-auto rounded border bg-muted/50 p-3 space-y-1">
                    {mappedUrls.slice(0, 200).map((url, i) => (
                      <div key={i} className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <a href={url} target="_blank" rel="noopener" className="hover:text-primary hover:underline">
                          {url}
                        </a>
                      </div>
                    ))}
                    {mappedUrls.length > 200 && (
                      <p className="text-xs text-muted-foreground pt-2">...and {mappedUrls.length - 200} more</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCRAPE TAB */}
        <TabsContent value="scrape">
          <Card>
            <CardHeader>
              <CardTitle>Scrape Single Page</CardTitle>
              <CardDescription>
                Extract product data from a specific URL. Test scraping before running bulk imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScrape} className="flex gap-3">
                <Input
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="https://valves-direct.com/product/..."
                  className="flex-1"
                />
                <Button type="submit" disabled={scrapeLoading}>
                  {scrapeLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Scraping...</> : 'Scrape'}
                </Button>
              </form>

              {scrapeResult && (
                <div className="mt-4">
                  {scrapeResult.metadata && (
                    <div className="mb-3">
                      <p className="font-semibold text-sm">{scrapeResult.metadata.title}</p>
                      <p className="text-xs text-muted-foreground">{scrapeResult.metadata.description}</p>
                    </div>
                  )}
                  <pre className="max-h-80 overflow-auto rounded border bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                    {scrapeResult.markdown || JSON.stringify(scrapeResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEARCH TAB */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Web Search</CardTitle>
              <CardDescription>
                Search the web for product pages to discover import sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Parker solenoid valve D1VW"
                  className="flex-1"
                />
                <Button type="submit" disabled={searchLoading}>
                  {searchLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...</> : 'Search'}
                </Button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.map((r: any, i: number) => (
                    <div key={i} className="rounded border p-3">
                      <a href={r.url} target="_blank" rel="noopener" className="text-sm font-medium text-primary hover:underline">
                        {r.title}
                      </a>
                      <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{r.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
