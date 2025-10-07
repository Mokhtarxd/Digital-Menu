import { supabase } from '@/integrations/supabase/client';

export interface InventoryAdjustment {
  id: string;
  delta: number;
}

interface AdjustInventoryResponse {
  dish_id: string;
  stock: number | null;
  is_available: boolean;
}

export async function adjustInventory(adjustments: InventoryAdjustment[]): Promise<AdjustInventoryResponse[]> {
  const payload = adjustments
    .filter((item) => item.id && Number.isFinite(item.delta) && item.delta !== 0)
    .map((item) => ({ id: item.id, delta: item.delta }));

  if (payload.length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc('adjust_inventory', {
    _items: payload,
  } as any);

  if (error) {
    throw error;
  }

  return data as AdjustInventoryResponse[];
}
