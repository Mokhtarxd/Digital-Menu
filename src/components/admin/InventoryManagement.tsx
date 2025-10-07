import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

const LOW_STOCK_THRESHOLD = 5;

type Dish = Database['public']['Tables']['dishes']['Row'];

type InlineValueMap = Record<string, string>;

type InventoryMetrics = {
  totalItems: number;
  totalUnits: number;
  lowStockItems: number;
  outOfStockItems: number;
};

export const InventoryManagement = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inlineValues, setInlineValues] = useState<InlineValueMap>({});
  const { toast } = useToast();

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setDishes((data || []) as Dish[]);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to load inventory data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    const channel = supabase.channel('inventory-management-updates');
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'dishes',
    }, () => {
      fetchInventory();
    });

    channel.subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Failed to remove inventory channel', error);
      }
    };
  }, [fetchInventory]);

  const metrics: InventoryMetrics = useMemo(() => {
    const totalItems = dishes.length;
    const totalUnits = dishes.reduce((sum, dish) => sum + (dish.stock ?? 0), 0);
    const lowStockItems = dishes.filter((dish) => {
      const stock = dish.stock ?? 0;
      return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    }).length;
    const outOfStockItems = dishes.filter((dish) => (dish.stock ?? 0) === 0).length;

    return {
      totalItems,
      totalUnits,
      lowStockItems,
      outOfStockItems,
    };
  }, [dishes]);

  const updateDishStock = async (dish: Dish, newStock: number) => {
    const safeStock = Math.max(0, Math.floor(newStock));

    if (safeStock === (dish.stock ?? 0)) {
      toast({
        title: 'No changes detected',
        description: 'The stock level remains the same.',
      });
      return;
    }

    try {
      setUpdatingId(dish.id);
      const { error } = await (supabase
        .from('dishes') as any)
        .update({
          stock: safeStock,
          is_available: safeStock > 0,
        })
        .eq('id', dish.id);

      if (error) throw error;

      toast({
        title: 'Inventory updated',
        description: `${dish.name} now has ${safeStock} in stock`,
      });

      setInlineValues((prev) => ({ ...prev, [dish.id]: '' }));
      await fetchInventory();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stock level',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickAdjust = (dish: Dish, delta: number) => {
    const currentStock = dish.stock ?? 0;
    updateDishStock(dish, currentStock + delta);
  };

  const handleInlineUpdate = (dish: Dish) => {
    const rawValue = inlineValues[dish.id];
    if (rawValue === undefined || rawValue === '') {
      toast({
        title: 'Enter a quantity',
        description: 'Provide a number or use the quick actions to adjust stock.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
      toast({
        title: 'Invalid number',
        description: 'Please enter a valid numeric quantity.',
        variant: 'destructive',
      });
      return;
    }

    updateDishStock(dish, parsed);
  };

  const renderInventoryStatus = (dish: Dish) => {
    const stock = dish.stock ?? 0;

    if (stock === 0) {
      return <Badge variant="destructive">Out of stock</Badge>;
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
      return <Badge variant="secondary">Low ({stock})</Badge>;
    }

    return <Badge variant="outline">{stock} in stock</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Loading inventory data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching dishes and stock levels...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Monitor and adjust stock quantities for each dish.</CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Total Items</p>
                <p className="text-lg font-semibold">{metrics.totalItems}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Total Units</p>
                <p className="text-lg font-semibold">{metrics.totalUnits}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Low Stock</p>
                <p className="text-lg font-semibold">{metrics.lowStockItems}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Out of Stock</p>
                <p className="text-lg font-semibold">{metrics.outOfStockItems}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {metrics.outOfStockItems > 0 && (
          <Alert className="mb-4">
            <AlertDescription>
              You have {metrics.outOfStockItems} dishes without stock. Replenish them to make them available again.
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Adjust Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => {
                const stock = dish.stock ?? 0;
                const quickAdjustDisabled = updatingId === dish.id;

                return (
                  <TableRow key={dish.id}>
                    <TableCell>
                      <div className="font-medium">{dish.name}</div>
                      {dish.description && (
                        <p className="text-xs text-muted-foreground">{dish.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{dish.category || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={stock === 0 ? 'destructive' : stock <= LOW_STOCK_THRESHOLD ? 'secondary' : 'outline'}>
                        {stock} units
                      </Badge>
                    </TableCell>
                    <TableCell>{renderInventoryStatus(dish)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quickAdjustDisabled || stock === 0}
                            onClick={() => handleQuickAdjust(dish, -1)}
                          >
                            -1
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quickAdjustDisabled || stock === 0}
                            onClick={() => handleQuickAdjust(dish, -5)}
                          >
                            -5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quickAdjustDisabled}
                            onClick={() => handleQuickAdjust(dish, 5)}
                          >
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quickAdjustDisabled}
                            onClick={() => handleQuickAdjust(dish, 1)}
                          >
                            +1
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-24"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={`${stock}`}
                            value={inlineValues[dish.id] ?? ''}
                            onChange={(event) => {
                              const { value } = event.target;
                              if (/^\d*$/.test(value)) {
                                setInlineValues((prev) => ({ ...prev, [dish.id]: value }));
                              }
                            }}
                            disabled={quickAdjustDisabled}
                          />
                          <Button
                            size="sm"
                            disabled={quickAdjustDisabled}
                            onClick={() => handleInlineUpdate(dish)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {dishes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No dishes found. Create menu items to begin tracking inventory.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
