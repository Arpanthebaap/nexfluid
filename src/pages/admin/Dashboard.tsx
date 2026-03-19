import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, MessageSquareText, Clock } from 'lucide-react';

interface Stats {
  products: number;
  categories: number;
  quotes: number;
  pendingQuotes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, categories: 0, quotes: 0, pendingQuotes: 0 });

  useEffect(() => {
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
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-primary' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, color: 'text-accent' },
    { label: 'Quote Requests', value: stats.quotes, icon: MessageSquareText, color: 'text-primary' },
    { label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock, color: 'text-destructive' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
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
    </div>
  );
}
