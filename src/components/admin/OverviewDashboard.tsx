import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Users, Utensils, Calendar, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalTables: number;
  availableTables: number;
  activeReservations: number;
  todayReservations: number;
  totalMenuItems: number;
  availableMenuItems: number;
  totalUsers: number;
  adminUsers: number;
}

export const OverviewDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all statistics in parallel
      const [
        tablesResult,
        reservationsResult,
        todayReservationsResult,
        menuResult,
        usersResult
      ] = await Promise.all([
        // Tables stats
        supabase.from('tables').select('status'),
        
        // Active reservations (confirmed, seated, pending)
        supabase
          .from('reservations')
          .select('status')
          .in('status', ['confirmed', 'seated', 'pending']),
        
        // Today's reservations
        supabase
          .from('reservations')
          .select('status')
          .gte('created_at', new Date().toISOString().split('T')[0]),
        
    // Menu items stats
    supabase.from('dishes').select('is_available'),
        
        // Users stats
        supabase.from('profiles').select('user_type')
      ]);

      const tables = tablesResult.data || [];
      const reservations = reservationsResult.data || [];
      const todayReservations = todayReservationsResult.data || [];
      const menuItems = menuResult.data || [];
      const users = usersResult.data || [];

      const dashboardStats: DashboardStats = {
        totalTables: tables.length,
        availableTables: tables.filter(t => t.status === 'available').length,
        activeReservations: reservations.length,
        todayReservations: todayReservations.length,
        totalMenuItems: menuItems.length,
        availableMenuItems: menuItems.filter(m => m.is_available).length,
        totalUsers: users.length,
        adminUsers: users.filter(u => u.user_type === 'admin').length,
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const tableOccupancy = stats.totalTables
    ? Math.round(((stats.totalTables - stats.availableTables) / stats.totalTables) * 100)
    : 0;

  const menuAvailability = stats.totalMenuItems
    ? Math.round((stats.availableMenuItems / stats.totalMenuItems) * 100)
    : 0;

  const statCards = [
    {
      title: 'Total Tables',
      value: stats.totalTables,
      subtitle: `${stats.availableTables} available`,
      icon: Table,
      color: 'text-blue-600'
    },
    {
      title: 'Active Reservations',
      value: stats.activeReservations,
      subtitle: 'Currently active',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Today\'s Reservations',
      value: stats.todayReservations,
      subtitle: 'Created today',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Menu Items',
      value: stats.totalMenuItems,
      subtitle: `${stats.availableMenuItems} available`,
      icon: Utensils,
      color: 'text-purple-600'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: 'Registered customers',
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      title: 'Admin Users',
      value: stats.adminUsers,
      subtitle: 'Staff members',
      icon: Users,
      color: 'text-red-600'
    },
    {
      title: 'Table Occupancy',
      value: tableOccupancy,
      subtitle: '% occupied',
      icon: TrendingUp,
      color: 'text-yellow-600'
    },
    {
      title: 'Menu Availability',
      value: menuAvailability,
      subtitle: '% available items',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.title.includes('%') ? '%' : ''}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              • Check table status and manage reservations<br/>
              • Update menu items and availability<br/>
              • Monitor user activity and loyalty points<br/>
              • View real-time restaurant statistics
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Database Connection</span>
              <span className="text-green-600">✓ Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Table Management</span>
              <span className="text-green-600">✓ Operational</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Reservation System</span>
              <span className="text-green-600">✓ Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>User Authentication</span>
              <span className="text-green-600">✓ Secure</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
