import React, { useEffect, useMemo, useState } from 'react';
import { supabase, CLIENT_ID } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

type Reservation = Database['public']['Tables']['reservations']['Row'];
type TableRow = Database['public']['Tables']['tables']['Row'];

type Notes = {
  orderType?: string;
  contact_phone?: string;
  total?: number;
  tableNumber?: string | number;
  items?: { id: string; name: string; qty: number }[];
  [k: string]: unknown;
}

function statusVariant(s: Reservation['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'pending': return 'outline';
    case 'confirmed': return 'default';
    case 'seated': return 'secondary';
    case 'completed': return 'secondary';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
}

function parseNotes(notes: string | null): Notes {
  if (!notes) return {};
  try { return JSON.parse(notes); } catch { return {}; }
}

export function ReservationsPanel({ userId }: { userId?: string | null }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();
  const tableLabel = useMemo(() => {
    const map = new Map<string, string>();
    tables.forEach(t => map.set(t.id, t.label));
    return map;
  }, [tables]);

  const filtered = useMemo(() => {
    if (filter === 'all') return reservations;
    const active = new Set<Reservation['status']>(['pending','confirmed','seated']);
    return reservations.filter(r => filter === 'active' ? active.has(r.status) : !active.has(r.status));
  }, [reservations, filter]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: res } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!alive) return;
      setReservations(res ?? []);

      const { data: tbls } = await supabase
        .from('tables')
        .select('*');
      if (!alive) return;
      setTables(tbls ?? []);
    })();

    // Subscribe to realtime changes for this device
    const channel = supabase.channel('reservation-status-follow');
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: 'reservations', filter: `client_id=eq.${CLIENT_ID}`
    }, (payload) => {
      setReservations((prev) => {
        const copy = [...prev];
        const row = payload.new as Reservation;
        const idx = copy.findIndex(r => r.id === row.id);
        if (idx >= 0) copy[idx] = row; else copy.unshift(row);
        return copy;
      });
    });
    if (userId) {
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${userId}`
      }, (payload) => {
        setReservations((prev) => {
          const copy = [...prev];
          const row = payload.new as Reservation;
          const idx = copy.findIndex(r => r.id === row.id);
          if (idx >= 0) copy[idx] = row; else copy.unshift(row);
          return copy;
        });
      });
    }
    channel.subscribe();

    return () => { 
      alive = false; 
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    };
  }, [userId]);

  if (!reservations.length) {
    return (
      <div className="text-sm text-muted-foreground py-4">No reservations yet.</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1">
        <Button size="sm" variant={filter==='all'?'default':'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button size="sm" variant={filter==='active'?'default':'outline'} onClick={() => setFilter('active')}>Active</Button>
        <Button size="sm" variant={filter==='completed'?'default':'outline'} onClick={() => setFilter('completed')}>Completed</Button>
      </div>
      {filtered.map((r) => {
  const n = parseNotes(r.notes);
  const label = r.table_id ? (tableLabel.get(r.table_id) ?? String(n?.tableNumber ?? '—')) : String(n?.tableNumber ?? '—');
        return (
          <Card key={r.id} className="border">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Reservation #{r.id.slice(0,8)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge>
                  {(r.status === 'pending' || r.status === 'confirmed') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={async () => {
                        try {
                          setBusyId(r.id);
                          const { data: updated, error } = await supabase
                            .from('reservations')
                            .update({ status: 'cancelled' })
                            .eq('id', r.id)
                            .select('id')
                            .maybeSingle();
                          if (error) throw error;
                          if (!updated) {
                            toast({
                              title: 'Cancel not applied',
                              description: 'Reservation not found or not permitted.',
                              variant: 'destructive'
                            });
                          } else {
                            setReservations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'cancelled' } as Reservation : x));
                          }
                        } catch (e) {
                          // ignored; RLS may block
                          console.error('Cancel failed', e);
                          toast({ title: 'Cancel failed', description: 'You may not have permission to cancel this reservation.', variant: 'destructive' });
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >Cancel</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">When</div>
                  <div>{new Date(r.reserved_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Table</div>
                  <div>{String(label)}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">Order type</div>
                  <div>{String(n?.orderType ?? '—')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Contact</div>
                  <div>{String(n?.contact_phone ?? '—')}</div>
                </div>
              </div>
              {n?.total != null && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div>{Number(n.total).toFixed(2)} MAD</div>
                  </div>
                </div>
              )}
              {Array.isArray(n?.items) && n.items.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Show items</summary>
                  <div className="mt-2 space-y-1">
                    {n.items.map((it, idx) => (
                      <div className="flex justify-between text-xs" key={idx}>
                        <span className="truncate mr-2">{String(it.name)}</span>
                        <span className="text-muted-foreground">x{Number(it.qty)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
