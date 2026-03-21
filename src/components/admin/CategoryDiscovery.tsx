import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Rocket } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { firecrawlApi } from '@/lib/api/firecrawl';

const PRESET_URLS = [
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

type DiscoveryResult = {
  category: string;
  mapped: number;
  filtered: number;
  new: number;
  error?: string;
};

type Props = {
  onComplete: () => void;
};

export default function CategoryDiscovery({ onComplete }: Props) {
  const { toast } = useToast();
  const [urls, setUrls] = useState(PRESET_URLS.join('\n'));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[] | null>(null);
  const [summary, setSummary] = useState<{ totalNew: number; totalMapped: number; totalFiltered: number } | null>(null);

  const handleDiscover = async () => {
    const categoryUrls = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!categoryUrls.length) return;

    setLoading(true);
    setResults(null);
    setSummary(null);

    try {
      const allResults: DiscoveryResult[] = [];
      let totalNew = 0;
      let totalMapped = 0;

      for (const catUrl of categoryUrls) {
        const res = await firecrawlApi.discoverCategory(catUrl);
        const data = res as any;
        if (res.success) {
          totalNew += data.totalNew || 0;
          totalMapped += data.totalFound || 0;
          allResults.push({ categoryUrl: catUrl, totalMapped: data.totalFound || 0, totalNew: data.totalNew || 0, productUrls: [] });
        } else {
          allResults.push({ categoryUrl: catUrl, totalMapped: 0, totalNew: 0, productUrls: [], error: res.error });
        }
      }

      setResults(allResults);
      setSummary({ totalNew, totalMapped, totalFiltered: 0 });
      toast({ title: 'Discovery complete', description: `${totalNew} new product URLs saved as jobs` });
      onComplete();
    } catch {
      toast({ title: 'Discovery failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4" /> Bulk Category Discovery
        </CardTitle>
        <CardDescription>
          Paste category page URLs (one per line). The system will map each one, filter for product pages, deduplicate, and save as scrape jobs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={urls}
          onChange={e => setUrls(e.target.value)}
          rows={8}
          placeholder="https://example.com/category-1&#10;https://example.com/category-2"
          className="font-mono text-xs"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleDiscover} disabled={loading || !urls.trim()}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Discovering...</> : 'Discover All Products'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {urls.split('\n').filter(u => u.trim()).length} category URLs
          </span>
        </div>

        {summary && (
          <div className="flex flex-wrap gap-3 text-sm pt-2">
            <Badge variant="outline">Mapped: {summary.totalMapped}</Badge>
            <Badge variant="secondary">Filtered: {summary.totalFiltered}</Badge>
            <Badge className="bg-green-500/20 text-green-700 border-green-300">New Jobs: {summary.totalNew}</Badge>
          </div>
        )}

        {results && (
          <div className="max-h-60 overflow-auto rounded border bg-muted/50 p-2 text-xs space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={r.error ? 'text-destructive' : 'text-muted-foreground'}>
                  {r.error ? '✗' : '✓'}
                </span>
                <span className="truncate flex-1">{r.category}</span>
                {r.error ? (
                  <Badge variant="destructive" className="text-[10px]">{r.error}</Badge>
                ) : (
                  <span className="text-muted-foreground whitespace-nowrap">
                    {r.mapped}→{r.filtered}→{r.new} new
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
