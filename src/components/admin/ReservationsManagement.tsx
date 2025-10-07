import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { adjustInventory } from '@/lib/inventory';

interface Reservation {
  id: string;
  table_id: string | null;
  user_id: string | null;
  party_size: number;
  reserved_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  client_id: string;
  // Joined data
  table_label?: string;
  user_email?: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', variant: 'secondary' as const, icon: Clock },
  { value: 'confirmed', label: 'Confirmed', variant: 'default' as const, icon: CheckCircle },
  { value: 'seated', label: 'Seated', variant: 'default' as const, icon: CheckCircle },
  { value: 'completed', label: 'Completed', variant: 'outline' as const, icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
  { value: 'no_show', label: 'No Show', variant: 'destructive' as const, icon: XCircle },
];

export const ReservationsManagement = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('reservations')
        .select(`
          *,
          tables!left(label),
          profiles!left(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reservations',
          variant: 'destructive',
        });
        return;
      }

      const formattedData = (data || []).map((reservation: any) => ({
        ...reservation,
        table_label: reservation.tables?.label || 'Takeout',
        user_email: reservation.profiles?.email || 'Guest',
      }));

      setReservations(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedStatus]);

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    const previousStatus = reservation?.status;
    try {
      const { error } = await (supabase
        .from('reservations') as any)
        .update({ status: newStatus })
        .eq('id', reservationId);

      if (error) throw error;

      if (reservation) {
        const notes = parseNotes(reservation.notes);
        const adjustments = Array.isArray(notes?.items)
          ? notes.items
              .filter((item: any) => item?.id)
              .map((item: any) => ({
                id: String(item.id),
                delta: Math.max(1, Math.floor(Number(item.qty) || 1)),
              }))
          : [];

        if (adjustments.length && previousStatus !== 'cancelled' && newStatus === 'cancelled') {
          try {
            await adjustInventory(adjustments);
          } catch (inventoryError) {
            console.error('Inventory restock failed (admin panel)', inventoryError);
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Reservation status updated',
      });

      await fetchReservations();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reservation status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reservation deleted successfully',
      });

      await fetchReservations();
    } catch (error: any) {
      console.error('Error deleting reservation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete reservation',
        variant: 'destructive',
      });
    }
  };

  const handleClearAllReservations = async () => {
    if (!confirm('Are you sure you want to delete ALL reservations? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'All reservations cleared successfully',
      });

      await fetchReservations();
    } catch (error: any) {
      console.error('Error clearing reservations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear reservations',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    const Icon = statusConfig.icon;
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const parseNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return { raw: notes };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservations Management</CardTitle>
          <CardDescription>Loading reservations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservations Management</CardTitle>
        <CardDescription>View and manage all restaurant reservations</CardDescription>
        <div className="flex gap-4 mt-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => fetchReservations()}>Refresh</Button>
          <Button 
            variant="destructive" 
            onClick={handleClearAllReservations}
            className="ml-auto"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Products</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => {
                const notes = parseNotes(reservation.notes);
                return (
                  <TableRow key={reservation.id}>
                    <TableCell className="max-w-xs">
                      {notes?.items && notes.items.length > 0 ? (
                        <div className="space-y-1">
                          {notes.items.map((item: any, index: number) => (
                            <div key={index} className="text-xs">
                              <span className="font-medium">{item.name}</span>
                              {item.qty > 1 && <span className="text-muted-foreground"> ×{item.qty}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No items</span>
                      )}
                    </TableCell>
                    <TableCell>{reservation.table_label}</TableCell>
                    <TableCell>{reservation.user_email}</TableCell>
                    <TableCell>{reservation.party_size}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell>
                      {notes?.total ? `${notes.total} MAD` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={reservation.status}
                          onValueChange={(newStatus) => handleStatusChange(reservation.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReservation(reservation.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {reservations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No reservations found for the selected status.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
