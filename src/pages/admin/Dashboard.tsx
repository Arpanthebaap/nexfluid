import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Package, FolderTree, MessageSquareText, Clock, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  products: number;
  categories: number;
  quotes: number;
  pendingQuotes: number;
}

interface MirrorStats {
  pending: number;
  done: number;
  failed: number;
  total: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, categories: 0, quotes: 0, pendingQuotes: 0 });
  const [mirror, setMirror] = useState<MirrorStats>({ pending: 0, done: 0, failed: 0, total: 0 });
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  const fetchStats = async () => {
    const [products, categories, quotes, pending] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
      supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);
    setStats({
      products: products.count ?? 0,
      categories: categories.count ?? 0,
      quotes: quotes.count ?? 0,
      pendingQuotes: pending.count ?? 0,
    });
  };

  const fetchMirrorStats = async () => {
    const [pending, done, failed, total] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('mirror_status', 'pending'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('mirror_status', 'done'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('mirror_status', 'failed'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ]);
    setMirror({
      pending: pending.count ?? 0,
      done: done.count ?? 0,
      failed: failed.count ?? 0,
      total: total.count ?? 0,
    });
  };

  useEffect(() => {
    fetchStats();
    fetchMirrorStats();
  }, []);

  const startMirror = async () => {
    setRunning(true);
    stopRef.current = false;
    toast.info('Image mirroring started — this may take ~25 minutes');

    try {
      while (!stopRef.current) {
        const { data, error } = await supabase.functions.invoke('product-image-scrape', {
          body: { batchSize: 25 },
        });
        if (error) {
          toast.error(`Batch failed: ${error.message}`);
          break;
        }
        await fetchMirrorStats();
        if (data?.done || data?.processed === 0) {
          toast.success('All product images mirrored ✅');
          break;
        }
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message ?? e}`);
    } finally {
      setRunning(false);
    }
  };

  const stopMirror = () => {
    stopRef.current = true;
    toast.info('Stopping after current batch…');
  };

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-primary' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, color: 'text-accent' },
    { label: 'Quote Requests', value: stats.quotes, icon: MessageSquareText, color: 'text-primary' },
    { label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock, color: 'text-destructive' },
  ];

  const mirrorProgress = mirror.total > 0
    ? Math.round(((mirror.done + mirror.failed) / mirror.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Mirror Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <CardTitle>Product Image Mirror</CardTitle>
          </div>
          {!running ? (
            <Button onClick={startMirror} disabled={mirror.pending === 0}>
              {mirror.pending === 0 ? 'All mirrored' : `Mirror ${mirror.pending.toLocaleString()} pending`}
            </Button>
          ) : (
            <Button variant="outline" onClick={stopMirror}>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Stop
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Copies externally-hotlinked product images into our own storage so every card displays a real photo (or branded placeholder if mirroring fails).
          </p>
          <Progress value={mirrorProgress} />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Mirrored</div>
              <div className="font-bold text-primary">{mirror.done.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pending</div>
              <div className="font-bold text-foreground">{mirror.pending.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Failed (placeholder shown)</div>
              <div className="font-bold text-destructive">{mirror.failed.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
