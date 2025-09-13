import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MenuItemTest = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Test Dish',
    description: 'A test dish for debugging',
    price: 15.99,
    category: 'Main Courses',
    image_url: '',
    is_available: true,
    currency: 'MAD'
  });

  const testAddMenuItem = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing add menu item with data:', formData);
      setResult(prev => prev + `🔍 Attempting to add menu item...\n`);
      setResult(prev => prev + `📋 Data: ${JSON.stringify(formData, null, 2)}\n`);
      
      const { data, error } = await supabase
        .from('dishes')
        .insert({
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          category: formData.category || null,
          image_url: formData.image_url || null,
          is_available: formData.is_available,
          currency: formData.currency
        })
        .select();

      if (error) {
        console.error('Insert error:', error);
        setResult(prev => prev + `❌ Error: ${error.message}\n`);
        setResult(prev => prev + `💡 Error details: ${JSON.stringify(error, null, 2)}\n`);
        return;
      }

      console.log('Insert successful:', data);
      setResult(prev => prev + `✅ Successfully added menu item!\n`);
      setResult(prev => prev + `📊 Returned data: ${JSON.stringify(data, null, 2)}\n`);

    } catch (error: any) {
      console.error('Unexpected error:', error);
      setResult(prev => prev + `💥 Unexpected error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setResult(prev => prev + `🔐 Current session: ${session ? 'Authenticated' : 'Not authenticated'}\n`);
      
      if (session) {
        setResult(prev => prev + `👤 User: ${session.user.email}\n`);
        setResult(prev => prev + `🆔 User ID: ${session.user.id}\n`);
        setResult(prev => prev + `🔑 Role: ${session.user.role}\n`);
      }

    } catch (error: any) {
      setResult(prev => prev + `❌ Auth check error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testSelectDishes = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .limit(5);

      if (error) {
        setResult(prev => prev + `❌ Select error: ${error.message}\n`);
        return;
      }

      setResult(prev => prev + `✅ Found ${data?.length || 0} dishes\n`);
      setResult(prev => prev + `📊 Data: ${JSON.stringify(data, null, 2)}\n`);

    } catch (error: any) {
      setResult(prev => prev + `💥 Select error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Menu Item Add Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Name:</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label>Price:</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label>Category:</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label>Description:</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testAuth} disabled={loading}>
              Test Auth
            </Button>
            <Button onClick={testSelectDishes} disabled={loading}>
              Test Select Dishes
            </Button>
            <Button onClick={testAddMenuItem} disabled={loading} variant="destructive">
              Test Add Menu Item
            </Button>
          </div>

          {result && (
            <div className="p-3 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuItemTest;
