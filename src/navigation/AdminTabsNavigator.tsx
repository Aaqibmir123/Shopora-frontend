import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppTheme } from '@/theme';
import { AdminDashboardPreviewScreen } from '@/screens/admin-preview/AdminDashboardPreviewScreen';
import { SellerApprovalListScreen } from '@/screens/admin-preview/SellerApprovalListScreen';
import { ProductModerationScreen } from '@/screens/admin-preview/ProductModerationScreen';
import { OrdersOverviewScreen } from '@/screens/admin-preview/OrdersOverviewScreen';
import { RevenueAnalyticsScreen } from '@/screens/admin-preview/RevenueAnalyticsScreen';
import { ReturnRequestsScreen } from '@/screens/admin-preview/ReturnRequestsScreen';
import { AdminMoreScreen } from '@/screens/admin-preview/AdminMoreScreen';
import { ROUTES } from '@/constants/navigation';

const Tab = createBottomTabNavigator();

export function AdminTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textSoft,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Platform.OS === 'android' ? 18 : 12,
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopColor: 'transparent',
          borderRadius: 24,
          height: 74,
          paddingBottom: Platform.OS === 'android' ? 14 : 12,
          paddingTop: 8,
          paddingHorizontal: 10,
          elevation: 14,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
      }}
    >
      <Tab.Screen
        name={ROUTES.AdminDashboard}
        component={AdminDashboardPreviewScreen}
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="grid-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name={ROUTES.SellerApprovals}
        component={SellerApprovalListScreen}
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="store-check-outline" color={color} size={size - 1} />
        }}
      />
      <Tab.Screen
        name={ROUTES.ProductModeration}
        component={ProductModerationScreen}
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="cube-scan" color={color} size={size - 1} />
        }}
      />
      <Tab.Screen
        name={ROUTES.OrdersOverview}
        component={OrdersOverviewScreen}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="receipt-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name={ROUTES.AdminReturns}
        component={ReturnRequestsScreen}
        options={{
          title: 'Returns',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="backup-restore" color={color} size={size - 1} />
        }}
      />
      <Tab.Screen
        name={ROUTES.RevenueAnalytics}
        component={RevenueAnalyticsScreen}
        options={{
          title: 'Revenue',
          tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="chart-timeline-variant" color={color} size={size - 1} />
        }}
      />
      <Tab.Screen
        name={ROUTES.AdminMore}
        component={AdminMoreScreen}
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }: any) => <Ionicons name="menu-outline" color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
