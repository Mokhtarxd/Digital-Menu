import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MenuCard, MenuItem } from '@/components/MenuCard';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { TableSelection } from '@/components/TableSelection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCode from 'qrcode';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReservationsPanel } from '@/components/ReservationsPanel';
// Images are provided by Supabase rows (image_url). Use a placeholder when missing.
import { supabase, CLIENT_ID } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// No static sample menu — the UI uses Supabase `dishes` rows directly.

const Index = () => {
  const [remoteMenuItems, setRemoteMenuItems] = useState<MenuItem[] | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingMenu(true);
      try {
        const { data, error } = await supabase.from('dishes').select('*').order('name', { ascending: true });
        if (!mounted) return;
        if (error) {
          setRemoteMenuItems([]);
          return;
        }
  const mapped: MenuItem[] = (data || []).map((r: Database['public']['Tables']['dishes']['Row']) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          price: Number(r.price) || 0,
          category: r.category || 'Uncategorized',
          image: r.image_url || '/placeholder.svg',
          available: Boolean(r.is_available),
        }));
        setRemoteMenuItems(mapped);
      } finally {
        if (mounted) setLoadingMenu(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [tableInfo, setTableInfo] = useState<{
    tableNumber: string | null;
    orderType: 'dine-in' | 'takeout';
  } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [lastReservation, setLastReservation] = useState<{
    reservationId?: string
    orderType: 'dine-in' | 'takeout'
    tableNumber: string | null
    partySize: number
    total: number
  } | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [reservationDate, setReservationDate] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('');
  const [followOpen, setFollowOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadPoints = async () => {
      if (!user) { setLoyaltyPoints(null); return; }
      const { data } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!mounted) return;
      setLoyaltyPoints(data?.points ?? 0);
    };
    loadPoints();
    return () => { mounted = false };
  }, [user]);

  const sourceItems = remoteMenuItems ?? [];
  const categories = Array.from(new Set(sourceItems.map(item => String(item.category))));
  const filteredItems = selectedCategory === 'all'
    ? sourceItems
    : sourceItems.filter(item => item.category === selectedCategory);

  const handleTableSelected = (tableNumber: string | null, orderType: 'dine-in' | 'takeout') => {
    setTableInfo({ tableNumber, orderType });
    setShowTableSelection(false);
  };

  const handleAddToCart = (item: MenuItem, quantityChange: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityChange;
        
        if (newQuantity <= 0) {
          return prevItems.filter(cartItem => cartItem.id !== item.id);
        }
        
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );
      } else if (quantityChange > 0) {
        return [...prevItems, { ...item, quantity: quantityChange }];
      }
      
      return prevItems;
    });

    if (quantityChange > 0) {
      toast({
        title: "Added to cart",
        description: `${item.name} added to your order`,
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({
      title: "Item removed",
      description: "Item removed from your cart",
    });
  };

  const handleCheckout = async (contactPhone?: string) => {
    // Build reservation payload
    const partySize = cartItems.reduce((s, it) => s + it.quantity, 0) || 1;

    // Try to resolve table_id from selected table number
    let resolvedTableId: string | null = null;
  const providedTable = tableInfo?.orderType === 'dine-in' ? (tableInfo?.tableNumber ?? null) : null;
    try {
      if (providedTable) {
        const t = String(providedTable).trim();
        // Match either exact number (e.g., '3') or label with prefix (e.g., 'T3')
        const { data: tbl, error: tErr } = await supabase
          .from('tables')
          .select('id,label')
          .or(`label.eq.${t},label.eq.T${t}`)
          .limit(1)
          .maybeSingle();
        if (!tErr && tbl?.id) {
          resolvedTableId = tbl.id as string;
        }
      }
    } catch { /* ignore */ }

    const totalAmount = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
    // Determine reserved_at from selected date/time if provided
    let reservedAtISO = new Date().toISOString();
    if (reservationDate && reservationTime) {
      const dt = new Date(`${reservationDate}T${reservationTime}:00`);
      if (!Number.isNaN(dt.getTime())) reservedAtISO = dt.toISOString();
    }

    const notes = JSON.stringify({
      orderType: tableInfo?.orderType ?? 'takeout',
      tableNumber: providedTable,
      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
      total: totalAmount,
      contact_phone: contactPhone ?? null,
      requested_slot: reservationDate && reservationTime ? `${reservationDate} ${reservationTime}` : null,
    });

    try {
      const payload: Database['public']['Tables']['reservations']['Insert'] = {
        table_id: resolvedTableId,
        user_id: (user?.id as unknown as string) ?? null,
        party_size: partySize,
  reserved_at: reservedAtISO,
        notes,
  client_id: CLIENT_ID,
      };

  const { data: inserted, error } = await supabase
        .from('reservations')
        .insert([payload])
        .select('id')
        .single();
  if (error) throw error;

      // Build QR payload with reservation info
      const qrPayload = {
        reservation_id: inserted?.id,
        order_type: tableInfo?.orderType ?? 'takeout',
        table: providedTable,
        party_size: partySize,
        total: totalAmount,
        created_at: new Date().toISOString(),
        client_id: CLIENT_ID,
        contact_phone: contactPhone ?? null,
        requested_slot: reservationDate && reservationTime ? `${reservationDate} ${reservationTime}` : null,
      };
      try {
        const dataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 300, margin: 1 });
        setQrDataUrl(dataUrl);
        setQrOpen(true);
      } catch (e) {
        // ignore QR generation issues
      }

  setLastReservation({
        reservationId: inserted?.id,
        orderType: (tableInfo?.orderType ?? 'takeout'),
        tableNumber: providedTable,
        partySize,
        total: totalAmount,
      });

      toast({
        title: "Order Placed!",
        description: `Your order has been placed${tableInfo?.tableNumber ? ` for table ${tableInfo.tableNumber}` : ' for takeout'}. Estimated time: 15-20 minutes.`,
      });

      // Award loyalty points for logged-in users: 1 point per 10 currency units (floor)
      if (user) {
        try {
          const points = Math.floor(totalAmount / 10);
          if (points > 0) {
            const { data: award, error: awardErr } = await supabase.rpc('award_points', {
              p_user_id: user.id,
              amount: points,
              reason: 'order',
              metadata: { reservation_id: inserted?.id }
            });
            if (!awardErr) setLoyaltyPoints(award as number);
          }
        } catch (e) {
          // non-blocking: ignore loyalty errors
          console.error('Failed to award loyalty points', e);
        }
      }

      // Reset cart and show success
      setCartItems([]);
      setIsCartOpen(false);
    } catch (err: unknown) {
  const message = (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>)) ? String((err as Record<string, unknown>)['message']) : String(err);
      toast({
        title: 'Checkout error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (showTableSelection) {
    return <TableSelection onTableSelected={handleTableSelected} />;
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation QR</DialogTitle>
            <DialogDescription>
              Scan to share your reservation details with staff or companions.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex flex-col items-center gap-3">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Reservation QR" className="w-64 h-64" />
            )}
            {(() => {
              const msg = lastReservation
                ? `Reservation confirmed. Table: ${lastReservation.orderType === 'dine-in' ? (lastReservation.tableNumber ?? 'N/A') : 'Takeout'} | Party: ${lastReservation.partySize} | Total: ${lastReservation.total}`
                : 'Reservation confirmed.';
              const phoneRaw = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_WHATSAPP_PHONE;
              const phone = phoneRaw ? phoneRaw.replace(/[^\d]/g, '') : '';
              const wa = phone
                ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
                : `https://wa.me/?text=${encodeURIComponent(msg)}`;
              return (
                <a href={wa} target="_blank" rel="noreferrer">
                  <Button variant="outline">Message the restaurant on WhatsApp</Button>
                </a>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Digital Menu
              </h1>
              <p className="text-sm text-muted-foreground">
                {tableInfo?.orderType === 'dine-in' && tableInfo?.tableNumber
                  ? `Table ${tableInfo.tableNumber} • Dine In`
                  : 'Takeout Order'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {user.email}
                        {typeof loyaltyPoints === 'number' && (
                          <Badge variant="secondary" className="ml-2">{loyaltyPoints} pts</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut()}
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </>
              )}
              <Button
                variant="outline"
                onClick={() => setShowTableSelection(true)}
                className="text-sm"
              >
                Change Order Type
              </Button>
              <Button
                variant="outline"
                onClick={() => setFollowOpen(true)}
                className="text-sm"
              >
                My Reservations
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={followOpen} onOpenChange={setFollowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My Reservations</DialogTitle>
            <DialogDescription>Live updates for your device and account.</DialogDescription>
          </DialogHeader>
          <ReservationsPanel userId={user?.id ?? null} />
        </DialogContent>
      </Dialog>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Menu Items */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
            return (
              <MenuCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                cartQuantity={cartItem?.quantity || 0}
              />
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found in this category.</p>
          </div>
        )}
      </main>

      

      {/* Shopping Cart */}
      <ShoppingCart
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      onCheckout={handleCheckout}
        isOpen={isCartOpen}
        onToggle={() => setIsCartOpen(!isCartOpen)}
      isLoggedIn={!!user}
        extraFields={(
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1 space-y-1">
              <Label htmlFor="res-date">Reservation date</Label>
              <Input
                id="res-date"
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
              />
            </div>
            <div className="col-span-1 space-y-1">
              <Label htmlFor="res-time">Reservation time</Label>
              <Input
                id="res-time"
                type="time"
                step={900}
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
              />
            </div>
          </div>
        )}
        canProceed={!(tableInfo?.orderType === 'dine-in') || (Boolean(reservationDate) && Boolean(reservationTime))}
      />
    </div>
  );
};

export default Index;
