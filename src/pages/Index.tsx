import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MenuCard, MenuItem } from '@/components/MenuCard';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { TableSelection } from '@/components/TableSelection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { LogOut, User, Instagram, ExternalLink, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCode from 'qrcode';
import { ReservationsPanel } from '@/components/ReservationsPanel';
// Images are provided by Supabase rows (image_url). Use a placeholder when missing.
import { supabase, CLIENT_ID } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { sendOrderNotification } from '@/lib/whatsapp';
import { adjustInventory } from '@/lib/inventory';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { OpeningHours } from '@/components/OpeningHours';

// No static sample menu — the UI uses Supabase `dishes` rows directly.

const Index = () => {
  const { t, i18n } = useTranslation();
  const direction = useMemo(
    () => i18n.dir(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );
  const [remoteMenuItems, setRemoteMenuItems] = useState<MenuItem[] | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingMenu(true);
      try {
        const { data, error } = await supabase
          .from('dishes')
          .select('*')
          .eq('is_hidden', false)
          .order('name', { ascending: true });
        if (!mounted) return;
        if (error) {
          setRemoteMenuItems([]);
          return;
        }

        const mapped: MenuItem[] = (data || []).map((r: Database['public']['Tables']['dishes']['Row']) => {
          const rawStock = (r as unknown as { stock?: number | null }).stock;
          const stock = typeof rawStock === 'number' ? Number(rawStock) : null;

          return {
            id: r.id,
            name: r.name,
            description: r.description || '',
            price: Number(r.price) || 0,
            category: r.category || 'Uncategorized',
            image: r.image_url || '/placeholder.svg',
            available: Boolean(r.is_available && (stock === null || stock > 0)),
            is_hidden: Boolean(r.is_hidden),
            loyalty_points: r.loyalty_points,
            wait_time: r.wait_time,
            stock,
          };
        });
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
  const [followOpen, setFollowOpen] = useState(false);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const { points: loyaltyPoints, redeemPoints, awardPoints } = useLoyaltyPoints();
  const navigate = useNavigate();

  useEffect(() => {
    // useLoyaltyPoints hook handles loyalty points loading automatically
  }, [user]);

  const sourceItems = remoteMenuItems ?? [];
  const categories = Array.from(new Set(sourceItems.map(item => String(item.category))));
  const filteredItems = selectedCategory === 'all'
    ? sourceItems
    : sourceItems.filter(item => item.category === selectedCategory);

  const stockIssues = useMemo(() =>
    cartItems.filter(item => typeof item.stock === 'number' && item.quantity > (item.stock ?? 0)),
  [cartItems]);
  const cartCanProceed = stockIssues.length === 0;

  useEffect(() => {
    if (!remoteMenuItems) return;

    setCartItems(prevItems =>
      prevItems.map(cartItem => {
        const latest = remoteMenuItems.find(item => item.id === cartItem.id);
        if (!latest) {
          return cartItem;
        }
        return { ...cartItem, ...latest, quantity: cartItem.quantity };
      })
    );
  }, [remoteMenuItems]);

  const handleTableSelected = (tableNumber: string | null, orderType: 'dine-in' | 'takeout') => {
    setTableInfo({ tableNumber, orderType });
    setShowTableSelection(false);
  };

  const handleAddToCart = (item: MenuItem, quantityChange: number) => {
    const existingCartItem = cartItems.find(cartItem => cartItem.id === item.id);
    const currentQuantity = existingCartItem?.quantity ?? 0;
    const stockLimit = typeof item.stock === 'number' ? item.stock : null;

    if (quantityChange > 0 && stockLimit !== null && currentQuantity + quantityChange > stockLimit) {
      toast({
        title: t('toasts.stockLimitTitle'),
        description: t('toasts.stockLimitDescription', { item: item.name, stock: stockLimit }),
        variant: 'destructive',
      });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityChange;
        
        if (newQuantity <= 0) {
          return prevItems.filter(cartItem => cartItem.id !== item.id);
        }
        
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, ...item, quantity: newQuantity }
            : cartItem
        );
      } else if (quantityChange > 0) {
        return [...prevItems, { ...item, quantity: quantityChange }];
      }
      
      return prevItems;
    });

    if (quantityChange > 0) {
      toast({
        title: t('toasts.addedTitle'),
        description: t('toasts.addedDescription', { item: item.name }),
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const latestMenuItem = sourceItems.find(item => item.id === itemId) || cartItems.find(item => item.id === itemId);
    const stockLimit = latestMenuItem && typeof latestMenuItem.stock === 'number' ? latestMenuItem.stock : null;

    if (stockLimit !== null && newQuantity > stockLimit) {
      toast({
        title: t('toasts.stockLimitTitle'),
        description: t('toasts.stockLimitDescription', { item: latestMenuItem?.name ?? '', stock: stockLimit }),
        variant: 'destructive',
      });
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
      title: t('toasts.removedTitle'),
      description: t('toasts.removedDescription'),
    });
  };

  const handleCheckout = async (contactPhone?: string, loyaltyPointsUsed?: number) => {
    // Build reservation payload
    const partySize = cartItems.reduce((s, it) => s + it.quantity, 0) || 1;

    // Try to resolve table_id from selected table number
    let resolvedTableId: string | null = null;
  const providedTable = tableInfo?.orderType === 'dine-in' ? (tableInfo?.tableNumber ?? null) : null;
    try {
      if (providedTable) {
        const tVal = String(providedTable).trim();
        // Match either exact number (e.g., '3') or label with prefix (e.g., 'T3')
        const { data: tbl, error: tErr } = await supabase
          .from('tables')
          .select('id,label')
          .or(`label.eq.${tVal},label.eq.T${tVal}`)
          .limit(1)
          .maybeSingle<{ id: string | null; label: string | null }>();
        if (!tErr && tbl && tbl.id) {
          resolvedTableId = String(tbl.id);
        }
      }
    } catch { /* ignore */ }

    const totalAmount = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
    
    // Calculate final amount after loyalty discount
    const loyaltyDiscount = loyaltyPointsUsed ? loyaltyPointsUsed * 1 : 0; // 1 point = 1 MAD
    const finalAmount = Math.max(0, totalAmount - loyaltyDiscount);
    
    // Determine reservation time - automatic timing only
    let reservedAtISO = new Date().toISOString();
    
    // Automatic timing based on order type - both set to present hour
    const reservationTime = new Date();
    // Both dine-in and takeout orders are set for the present hour (no delay)
    reservedAtISO = reservationTime.toISOString();

    const notes = JSON.stringify({
      orderType: tableInfo?.orderType ?? 'takeout',
      tableNumber: providedTable,
      items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
      subtotal: totalAmount,
      loyaltyPointsUsed: loyaltyPointsUsed || 0,
      loyaltyDiscount: loyaltyDiscount,
      total: finalAmount,
      contact_phone: contactPhone ?? null,
      requested_slot: null, // No longer using manual date/time selection
    });

    try {
      // Redeem loyalty points if any were used
      if (loyaltyPointsUsed && loyaltyPointsUsed > 0 && user) {
        const newBalance = await redeemPoints(
          loyaltyPointsUsed,
          'Order payment',
          {
            order_items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
            discount_amount: loyaltyDiscount,
            original_total: totalAmount,
            final_total: finalAmount,
          }
        );
      }

      const payload: Database['public']['Tables']['reservations']['Insert'] = {
        table_id: resolvedTableId,
        user_id: (user?.id as unknown as string) ?? null,
        party_size: partySize,
        reserved_at: reservedAtISO,
        notes,
        client_id: CLIENT_ID,
      };

      const { data: inserted, error } = await (supabase
        .from('reservations') as any)
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      const reservationId = (inserted as { id: string | null } | null)?.id;
      if (!reservationId) {
        throw new Error('Reservation insert failed');
      }

      let updatedInventory: Awaited<ReturnType<typeof adjustInventory>> = [];
      try {
        updatedInventory = await adjustInventory(
          cartItems.map(item => ({ id: item.id, delta: -item.quantity }))
        );

        if (updatedInventory.length) {
          setRemoteMenuItems(prev => {
            if (!prev) return prev;
            return prev.map(menuItem => {
              const update = updatedInventory.find(entry => entry.dish_id === menuItem.id);
              if (!update) return menuItem;
              return {
                ...menuItem,
                stock: update.stock,
                available: update.is_available,
              };
            });
          });

          const newlyOut = updatedInventory.find(entry => entry.stock === 0);
          if (newlyOut) {
            const itemInfo = cartItems.find(item => item.id === newlyOut.dish_id);
            if (itemInfo) {
              toast({
                title: t('toasts.stockDepletedTitle'),
                description: t('toasts.stockDepletedDescription', { item: itemInfo.name }),
              });
            }
          }
        }
      } catch (inventoryError) {
        console.error('Failed to adjust inventory', inventoryError);
      }

      // No longer generating QR code - removed popup functionality

      setLastReservation({
        reservationId,
        orderType: (tableInfo?.orderType ?? 'takeout'),
        tableNumber: providedTable,
        partySize,
        total: finalAmount,
      });

      // Calculate the maximum wait time from all cart items
      let maxWaitTime = 0;
      cartItems.forEach(cartItem => {
        const dishData = remoteMenuItems?.find(item => item.id === cartItem.id);
        if (dishData?.wait_time && dishData.wait_time > maxWaitTime) {
          maxWaitTime = dishData.wait_time;
        }
      });

      // Create wait time notification message
      const waitTimeMessage = maxWaitTime > 0 
        ? t('toasts.orderPlacedWaitExact', { minutes: maxWaitTime })
        : t('toasts.orderPlacedWaitDefault');

      // Award loyalty points for logged-in users
      let pointsEarned = 0;
      if (user) {
        try {
          // Calculate points per dish considering custom loyalty_points
          let totalPointsToAward = 0;
          cartItems.forEach(cartItem => {
            const dishData = remoteMenuItems?.find(item => item.id === cartItem.id);
            if (dishData) {
              if (dishData.loyalty_points !== null && dishData.loyalty_points !== undefined) {
                // Use custom loyalty points per dish
                totalPointsToAward += dishData.loyalty_points * cartItem.quantity;
              } else {
                // Use default calculation: 1 point per 10 currency units
                const dishTotal = dishData.price * cartItem.quantity;
                totalPointsToAward += Math.floor(dishTotal / 10);
              }
            }
          });

          if (totalPointsToAward > 0) {
            await awardPoints(totalPointsToAward, 'order', { reservation_id: reservationId });
            pointsEarned = totalPointsToAward;
          }
        } catch (e) {
          // non-blocking: ignore loyalty errors
          console.error('Failed to award loyalty points', e);
        }
      }

      // Send WhatsApp notification
      try {
        const orderData = {
          orderType: tableInfo?.orderType ?? 'takeout',
          tableNumber: providedTable,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.quantity,
            price: item.price
          })),
          subtotal: totalAmount,
          loyaltyPointsUsed: loyaltyPointsUsed || 0,
          loyaltyDiscount: loyaltyDiscount,
          total: finalAmount,
          contact_phone: contactPhone ?? null,
          reservationId
        };

        await sendOrderNotification(orderData);
      } catch (e) {
        console.error('Failed to send WhatsApp notification:', e);
        // Don't block the checkout process if WhatsApp fails
      }

      const confirmationDetails = [
        tableInfo?.tableNumber
          ? t('toasts.orderPlacedTable', { table: tableInfo.tableNumber })
          : t('toasts.orderPlacedTakeout'),
        loyaltyPointsUsed > 0 ? t('toasts.orderPlacedDiscount', { amount: loyaltyDiscount.toFixed(2) }) : null,
        pointsEarned > 0 ? t('toasts.orderPlacedPoints', { points: pointsEarned }) : null,
        waitTimeMessage,
      ].filter(Boolean).join(' ');

      toast({
        title: t('toasts.orderPlacedTitle'),
        description: confirmationDetails,
      });

      // Reset cart and show success
      setCartItems([]);
      setIsCartOpen(false);
    } catch (err: unknown) {
  const message = (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>)) ? String((err as Record<string, unknown>)['message']) : String(err);
      toast({
        title: t('toasts.checkoutErrorTitle'),
        description: t('toasts.checkoutErrorDescription', { message }),
        variant: 'destructive',
      });
    }
  };

  if (showTableSelection) {
    return <TableSelection onTableSelected={handleTableSelected} />;
  }

  return (
    <div className="min-h-screen bg-gradient-warm" dir={direction}>
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.reservationQrTitle')}</DialogTitle>
            <DialogDescription>
              {t('common.reservationQrDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex flex-col items-center gap-3">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Reservation QR" className="w-64 h-64" />
            )}
            {(() => {
              const msg = lastReservation
                ? t('common.reservationConfirmedDetailed', {
                    table: lastReservation.orderType === 'dine-in'
                      ? (lastReservation.tableNumber ?? 'N/A')
                      : t('tableSelection.takeout'),
                    party: lastReservation.partySize,
                    total: lastReservation.total,
                  })
                : t('common.reservationConfirmed');
              const phoneRaw = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_WHATSAPP_PHONE;
              const phone = phoneRaw ? phoneRaw.replace(/[^\d]/g, '') : '';
              const wa = phone
                ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
                : `https://wa.me/?text=${encodeURIComponent(msg)}`;
              return (
                <a href={wa} target="_blank" rel="noreferrer">
                  <Button variant="outline">{t('common.whatsappButton')}</Button>
                </a>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Top Row: Logo + Title and Sign Out */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/dar-lmeknessia.png" 
                  alt="Dar Lmeknessiya" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <h1 className="text-base font-bold text-black leading-tight">
                    Dar Lmeknessiya
                  </h1>
                  <OpeningHours variant="mobile" className="mt-0.5" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <LanguageSwitcher size="sm" align="end" className="rounded-full" />
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="px-2 py-1 rounded-full border-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                    title={t('common.signOut')}
                    aria-label={t('common.signOut')}
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Bottom Row: Social Links + User Info + Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Social Media Links */}
                <a 
                  href="https://www.instagram.com/dar_lmeknessia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  title={t('common.instagramTitle')}
                >
                  <Instagram className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </a>
                <a 
                  href="https://www.tripadvisor.fr/Restaurant_Review-g479761-d23790414-Reviews-Teranga-Dakhla_Dakhla_Oued_Ed_Dahab.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                  title={t('common.tripAdvisorTitle')}
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </a>
                
                {/* Loyalty Points Badge */}
                {!loading && user && typeof loyaltyPoints === 'number' && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {t('common.pointsBadge', { points: loyaltyPoints })}
                  </Badge>
                )}
              </div>
              
              {/* User Actions */}
              {!loading && (
                <>
                  {user ? (
                    <Button
                      variant="outline"
                      onClick={() => setFollowOpen(true)}
                      className="text-xs px-3 py-1 rounded-full border-2 hover:bg-accent hover:text-accent-foreground font-semibold transition-all duration-300"
                      size="sm"
                    >
                      {t('common.orders')}
                    </Button>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="rounded-full px-3 py-1 border-2 hover:bg-accent hover:text-accent-foreground font-semibold transition-all duration-300 text-xs">
                        {t('common.signIn')}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src="/dar-lmeknessia.png" 
                alt="Dar Lmeknessiya" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-black">
                  Dar Lmeknessiya
                </h1>
                <OpeningHours className="mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Social Media Links */}
              <div className="flex items-center gap-2">
                <a 
                  href="https://www.instagram.com/dar_lmeknessia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title={t('common.instagramTitle')}
                >
                  <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
                <a 
                  href="https://www.tripadvisor.fr/Restaurant_Review-g479761-d23790414-Reviews-Teranga-Dakhla_Dakhla_Oued_Ed_Dahab.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title={t('common.tripAdvisorTitle')}
                >
                  <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
              </div>
              <LanguageSwitcher size="sm" className="hidden sm:flex" />
              
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span className="hidden md:inline">{user.email}</span>
                        {typeof loyaltyPoints === 'number' && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {t('common.pointsBadge', { points: loyaltyPoints })}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setFollowOpen(true)}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full border-2 hover:bg-accent hover:text-accent-foreground font-semibold transition-all duration-300"
                        size="sm"
                      >
                        {t('common.reservations')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut()}
                        className="px-2 sm:px-3 py-1 sm:py-2 rounded-full border-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                        title={t('common.signOut')}
                        aria-label={t('common.signOut')}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="rounded-full px-3 sm:px-6 py-1 sm:py-2 border-2 hover:bg-accent hover:text-accent-foreground font-semibold transition-all duration-300 text-xs sm:text-sm">
                        {t('common.signIn')}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <Dialog open={followOpen} onOpenChange={setFollowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.myReservationsTitle')}</DialogTitle>
            <DialogDescription>{t('common.myReservationsDescription')}</DialogDescription>
          </DialogHeader>
          <ReservationsPanel userId={user?.id ?? null} />
        </DialogContent>
      </Dialog>

      {/* Category Filter */}
      <div className="pt-4 sm:pt-8 pb-4 sm:pb-6">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* Menu Items */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">{t('common.noItems')}</p>
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
        canProceed={cartCanProceed}
      />

      {/* Admin Login Button */}
      <div className="fixed bottom-4 left-4 z-40">
        <Link to="/admin/login">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-background/90 backdrop-blur-sm border-2 hover:bg-accent hover:text-accent-foreground transition-all duration-300 rounded-full px-3 py-2"
            title={t('common.adminLoginTitle')}
          >
            <Shield className="w-4 h-4" />
            <span className="ml-1 text-xs hidden sm:inline">{t('common.admin')}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
