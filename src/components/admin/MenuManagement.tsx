import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Plus, Trash2, Image, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Dish = Database['public']['Tables']['dishes']['Row'];
type DishInsert = Database['public']['Tables']['dishes']['Insert'];
type DishUpdate = Database['public']['Tables']['dishes']['Update'];

type FormState = {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  is_hidden: boolean;
  loyalty_points: number | null;
  wait_time: number | null;
  currency: string;
};

export const MenuManagement = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [formData, setFormData] = useState<FormState>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    is_available: true,
    is_hidden: false,
    loyalty_points: null,
    wait_time: null,
    currency: 'MAD',
  });
  const { toast } = useToast();

  const categories = [
    'Appetizers',
    'Main Courses',
    'Desserts',
    'Beverages',
    'Salads',
    'Soups',
    'Pizza',
    'Pasta',
    'Seafood',
    'Vegetarian',
    'Specials'
  ];

  const outOfStockCount = dishes.filter(d => !d.is_available).length;

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching dishes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu items',
          variant: 'destructive',
        });
        return;
      }

  setDishes((data || []) as Dish[]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Basic validation
      if (!formData.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a dish name',
          variant: 'destructive',
        });
        return;
      }
      
      if (formData.price <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid price',
          variant: 'destructive',
        });
        return;
      }
    const isAvailable = editingDish ? formData.is_available : false;
      
      if (editingDish) {
        // Update existing dish
        const updatePayload: DishUpdate = {
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category: formData.category || null,
          image_url: formData.image_url || null,
          is_available: isAvailable,
          loyalty_points: formData.loyalty_points,
          wait_time: formData.wait_time,
          currency: formData.currency,
        };

        const { error } = await (supabase
          .from('dishes') as any)
          .update(updatePayload)
          .eq('id', editingDish.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Menu item updated successfully',
        });
      } else {
        // Create new dish
        const insertPayload: DishInsert = {
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category: formData.category || null,
          image_url: formData.image_url || null,
          is_available: false,
          loyalty_points: formData.loyalty_points,
          wait_time: formData.wait_time,
          currency: formData.currency,
          stock: 0,
        };

        const { data, error } = await (supabase
          .from('dishes') as any)
          .insert(insertPayload)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast({
          title: 'Success',
          description: 'Menu item created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingDish(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        image_url: '',
        is_available: true,
        is_hidden: false,
        loyalty_points: null,
        wait_time: null,
        currency: 'MAD',
      });
      await fetchDishes();
    } catch (error: any) {
      console.error('Error saving dish:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save menu item',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      price: dish.price,
      category: dish.category || '',
      image_url: dish.image_url || '',
      is_available: dish.is_available,
      is_hidden: dish.is_hidden,
      loyalty_points: dish.loyalty_points,
      wait_time: dish.wait_time,
      currency: dish.currency,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await (supabase
        .from('dishes') as any)
        .delete()
        .eq('id', dishId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });

      await fetchDishes();
    } catch (error: any) {
      console.error('Error deleting dish:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  };

  const toggleAvailability = async (dishId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from('dishes') as any)
        .update({ is_available: !currentStatus })
        .eq('id', dishId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Menu item availability updated',
      });

      await fetchDishes();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update availability',
        variant: 'destructive',
      });
    }
  };

  const toggleHidden = async (dishId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase
        .from('dishes') as any)
        .update({ is_hidden: !currentStatus })
        .eq('id', dishId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Menu item ${!currentStatus ? 'hidden' : 'shown'} successfully`,
      });

      await fetchDishes();
    } catch (error: any) {
      console.error('Error updating visibility:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>Loading menu items...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Management</CardTitle>
        <CardDescription>
          Add, edit, and manage menu items • {dishes.length} total items • {outOfStockCount} out of stock
        </CardDescription>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter">Filter:</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'unavailable')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Items</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Out of Stock Only</option>
            </select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingDish(null);
                setFormData({
                  name: '',
                  description: '',
                  price: 0,
                  category: '',
                  image_url: '',
                  is_available: true,
                  is_hidden: false,
                  loyalty_points: null,
                  wait_time: null,
                  currency: 'MAD',
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDish ? 'Edit Menu Item' : 'Add New Menu Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingDish ? 'Update the menu item details below.' : 'Enter the details for the new menu item.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dish name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Dish description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Main Courses"
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loyalty_points">Custom Loyalty Points (optional)</Label>
                    <Input
                      id="loyalty_points"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.loyalty_points || ''}
                      onChange={(e) => setFormData({ ...formData, loyalty_points: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Leave empty for default calculation"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If set, customers earn this many points when ordering this dish (overrides the default rate)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="wait_time">Wait Time (minutes)</Label>
                    <Input
                      id="wait_time"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.wait_time || ''}
                      onChange={(e) => setFormData({ ...formData, wait_time: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g., 15"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Preparation time in minutes. If multiple items are ordered, the highest wait time will be used.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting 
                    ? 'Saving...' 
                    : editingDish ? 'Update' : 'Create'
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {dishes.filter(d => !d.is_available).length > 3 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You have {dishes.filter(d => !d.is_available).length} items currently out of stock. 
              Consider updating inventory or removing items from the menu.
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes
                .filter(dish => {
                  if (statusFilter === 'available') return dish.is_available;
                  if (statusFilter === 'unavailable') return !dish.is_available;
                  return true; // 'all'
                })
                .map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell>
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dish.name}</div>
                        {dish.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {dish.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{dish.category || '—'}</TableCell>
                    <TableCell>{dish.currency} {dish.price.toFixed(2)}</TableCell>
                    <TableCell>
                      {dish.loyalty_points !== null ? (
                        <Badge variant="outline" className="text-xs">
                          {dish.loyalty_points} pts
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dish.wait_time !== null ? (
                        <Badge variant="secondary" className="text-xs">
                          {dish.wait_time} min
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dish.is_available ? 'default' : 'destructive'} className="text-xs">
                        {dish.is_available ? '✓ Available' : '✗ Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={dish.is_available ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleAvailability(dish.id, dish.is_available)}
                          className="min-w-[80px]"
                        >
                          {dish.is_available ? 'Mark Out' : 'Mark In'}
                        </Button>
                        <Button
                          variant={dish.is_hidden ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleHidden(dish.id, dish.is_hidden)}
                          className={`min-w-[70px] ${
                            dish.is_hidden
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'text-orange-600 border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          {dish.is_hidden ? 'Show' : 'Hide'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(dish)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(dish.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {dishes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No menu items found. Add your first item to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
