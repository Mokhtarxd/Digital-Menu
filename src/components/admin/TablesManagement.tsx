import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableData {
  id: string;
  label: string;
  seats: number;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusOptions = [
  { value: 'available', label: 'Available', variant: 'default' as const },
  { value: 'occupied', label: 'Occupied', variant: 'destructive' as const },
  { value: 'reserved', label: 'Reserved', variant: 'secondary' as const },
  { value: 'maintenance', label: 'Maintenance', variant: 'outline' as const },
  { value: 'out_of_service', label: 'Out of Service', variant: 'destructive' as const },
];

export const TablesManagement = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    seats: 4,
    location: '',
    status: 'available'
  });
  const { toast } = useToast();

  const fetchTables = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('tables')
        .select('*')
        .order('label', { ascending: true });

      if (error) {
        console.error('Error fetching tables:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tables',
          variant: 'destructive',
        });
        return;
      }

      setTables(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingTable) {
        // Update existing table
        const { error } = await (supabase as any)
          .from('tables')
          .update({
            label: formData.label,
            seats: formData.seats,
            location: formData.location || null,
            status: formData.status
          })
          .eq('id', editingTable.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Table updated successfully',
        });
      } else {
        // Create new table
        const { error } = await (supabase as any)
          .from('tables')
          .insert({
            label: formData.label,
            seats: formData.seats,
            location: formData.location || null,
            status: formData.status
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Table created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingTable(null);
      setFormData({ label: '', seats: 4, location: '', status: 'available' });
      await fetchTables();
    } catch (error: any) {
      console.error('Error saving table:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save table',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (table: TableData) => {
    setEditingTable(table);
    setFormData({
      label: table.label,
      seats: table.seats,
      location: table.location || '',
      status: table.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await (supabase as any)
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Table deleted successfully',
      });

      await fetchTables();
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete table',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tables')
        .update({ status: newStatus })
        .eq('id', tableId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Table status updated',
      });

      await fetchTables();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update table status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Loading tables...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tables Management</h1>
          <p className="text-muted-foreground">Manage restaurant tables and their availability</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTable(null);
              setFormData({ label: '', seats: 4, location: '', status: 'available' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
              <DialogDescription>
                {editingTable ? 'Update the table information below.' : 'Enter the details for the new table.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right">Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., T1, T2, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seats" className="text-right">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., Window, Patio, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>
                {editingTable ? 'Update Table' : 'Create Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tables ({tables.length})</CardTitle>
          <CardDescription>Manage your restaurant tables and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.label}</TableCell>
                  <TableCell>{table.seats}</TableCell>
                  <TableCell>{table.location || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={table.status}
                      onValueChange={(value) => handleStatusChange(table.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(table)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(table.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
