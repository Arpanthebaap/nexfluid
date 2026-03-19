import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type QuoteRequest = Tables<'quote_requests'>;

export default function QuoteRequests() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchQuotes = async () => {
    setLoading(true);
    let query = supabase.from('quote_requests').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as QuoteRequest['status']);
    }
    const { data } = await query;
    setQuotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, [statusFilter]);

  const openDetail = (q: QuoteRequest) => {
    setSelected(q);
    setAdminNotes(q.admin_notes ?? '');
    setNewStatus(q.status);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const { error } = await supabase.from('quote_requests').update({
      admin_notes: adminNotes,
      status: newStatus as QuoteRequest['status'],
    }).eq('id', selected.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Quote updated' });
      setSelected(null);
      fetchQuotes();
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'new': return 'destructive';
      case 'in_progress': return 'default';
      case 'quoted': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quote Requests</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : quotes.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No quote requests</TableCell></TableRow>
            ) : (
              quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-sm">{format(new Date(q.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{q.name}</TableCell>
                  <TableCell className="text-muted-foreground">{q.email}</TableCell>
                  <TableCell className="text-sm">{q.product_name ?? q.product_code ?? '—'}</TableCell>
                  <TableCell><Badge variant={statusColor(q.status)}>{q.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(q)}>View</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quote Request Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selected.name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selected.phone ?? '—'}</span></div>
                <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{selected.company ?? '—'}</span></div>
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{selected.product_name ?? '—'}</span></div>
                <div><span className="text-muted-foreground">Code:</span> <span className="font-mono">{selected.product_code ?? '—'}</span></div>
              </div>
              {selected.message && (
                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-md">{selected.message}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleUpdate}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
