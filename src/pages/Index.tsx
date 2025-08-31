import React, { useState, useEffect } from 'react';
import { MenuCard, MenuItem } from '@/components/MenuCard';
import { ShoppingCart, CartItem } from '@/components/ShoppingCart';
import { TableSelection } from '@/components/TableSelection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import burgerImage from '@/assets/burger-hero.jpg';
import caesarSaladImage from '@/assets/caesar-salad.jpg';
import margheritaPizzaImage from '@/assets/margherita-pizza.jpg';

// Sample menu data
const sampleMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Beef Burger',
    description: 'Juicy beef patty with fresh lettuce, tomato, onions, and our special sauce on a brioche bun',
    price: 85.00,
    category: 'Burgers',
    image: burgerImage,
    available: true,
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce, parmesan cheese, croutons, and grilled chicken with Caesar dressing',
    price: 65.00,
    category: 'Salads',
    image: caesarSaladImage,
    available: true,
  },
  {
    id: '3',
    name: 'Margherita Pizza',
    description: 'Wood-fired pizza with fresh mozzarella, basil leaves, and our signature tomato sauce',
    price: 95.00,
    category: 'Pizza',
    image: margheritaPizzaImage,
    available: true,
  },
];

const Index = () => {
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [tableInfo, setTableInfo] = useState<{
    tableNumber: string | null;
    orderType: 'dine-in' | 'takeout';
  } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const categories = Array.from(new Set(sampleMenuItems.map(item => item.category)));
  const filteredItems = selectedCategory === 'all' 
    ? sampleMenuItems 
    : sampleMenuItems.filter(item => item.category === selectedCategory);

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

  const handleCheckout = () => {
    toast({
      title: "Order Placed!",
      description: `Your order has been placed${tableInfo?.tableNumber ? ` for table ${tableInfo.tableNumber}` : ' for takeout'}. Estimated time: 15-20 minutes.`,
    });
    
    // Reset cart and show success
    setCartItems([]);
    setIsCartOpen(false);
  };

  if (showTableSelection) {
    return <TableSelection onTableSelected={handleTableSelected} />;
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
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
            
            <Button
              variant="outline"
              onClick={() => setShowTableSelection(true)}
              className="text-sm"
            >
              Change Order Type
            </Button>
          </div>
        </div>
      </header>

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
      />
    </div>
  );
};

export default Index;
