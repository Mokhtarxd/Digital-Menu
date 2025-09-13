import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Crown, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  created_at: string;
  updated_at: string;
}

interface LoyaltyPoints {
  user_id: string;
  points: number;
  updated_at: string;
}

export const UserManagement = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const { toast } = useToast();

  const userTypes = [
    { value: 'customer', label: 'Customer', variant: 'default' as const, icon: User },
    { value: 'admin', label: 'Admin', variant: 'destructive' as const, icon: Crown },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedUserType !== 'all') {
        query = query.eq('user_type', selectedUserType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
        return;
      }

      setProfiles(data || []);

      // Fetch loyalty points for all users
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('user_id, points');

      if (!loyaltyError && loyaltyData) {
        const loyaltyMap = loyaltyData.reduce((acc, item) => {
          acc[item.user_id] = item.points;
          return acc;
        }, {} as Record<string, number>);
        setLoyaltyData(loyaltyMap);
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedUserType]);

  const handleUserTypeChange = async (userId: string, newUserType: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User type updated successfully',
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user type:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user type',
        variant: 'destructive',
      });
    }
  };

  const getUserTypeBadge = (userType: string | null) => {
    const type = userType || 'customer';
    const typeConfig = userTypes.find(t => t.value === type) || userTypes[0];
    const Icon = typeConfig.icon;
    return (
      <Badge variant={typeConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {typeConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>Manage customer accounts and admin users</CardDescription>
        <div className="flex gap-4 mt-4">
          <Select value={selectedUserType} onValueChange={setSelectedUserType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {userTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => fetchUsers()}>Refresh</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Loyalty Points</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    {profile.full_name || 'Unnamed User'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {profile.email || '—'}
                  </TableCell>
                  <TableCell>
                    {getUserTypeBadge(profile.user_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {loyaltyData[profile.user_id] || 0} pts
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={profile.user_type || 'customer'}
                      onValueChange={(newType) => handleUserTypeChange(profile.user_id, newType)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {profiles.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No users found for the selected type.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
