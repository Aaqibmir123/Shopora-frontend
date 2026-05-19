import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppTheme } from '@/theme';
import { SellerDashboardScreen } from '@/screens/seller/SellerDashboardScreen';
import { SellerProductListScreen } from '@/screens/seller/SellerProductListScreen';
import { InventoryScreen } from '@/screens/seller/InventoryScreen';
import { SellerOrdersScreen } from '@/screens/seller/SellerOrdersScreen';
import { EarningsScreen } from '@/screens/seller/EarningsScreen';
import { StoreProfileScreen } from '@/screens/seller/StoreProfileScreen';

const Tab = createBottomTabNavigator();

const iconMap: Record<string, { family: 'ionicons' | 'material'; name: string }> = {
  Dashboard: { family: 'ionicons', name: 'speedometer-outline' },
  Products: { family: 'material', name: 'cube-outline' },
  Inventory: { family: 'material', name: 'layers-outline' },
  Orders: { family: 'material', name: 'package-variant-closed' },
  Earnings: { family: 'material', name: 'chart-line' },
  Profile: { family: 'material', name: 'storefront-outline' }
};

export function SellerTabsNavigator() {
  return (
    <Tab.Navigator
      id="SellerTabs"
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textSoft,
        tabBarStyle: {
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: Platform.OS === 'android' ? 18 : 12,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopColor: 'transparent',
          borderRadius: 26,
          height: 76,
          paddingBottom: Platform.OS === 'android' ? 14 : 12,
          paddingTop: 8,
          paddingHorizontal: 10,
          elevation: 16,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size }: any) => {
          const icon = iconMap[route.name] ?? { family: 'ionicons', name: 'apps' };
          return icon.family === 'material' ? (
            <MaterialCommunityIcons name={icon.name as never} color={color} size={size} />
          ) : (
            <Ionicons name={icon.name as never} color={color} size={size} />
          );
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={SellerDashboardScreen} options={{ tabBarLabel: 'Home', title: 'Seller Home' }} />
      <Tab.Screen name="Products" component={SellerProductListScreen} options={{ tabBarLabel: 'Catalog', title: 'Catalog' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: 'Stock', title: 'Stock' }} />
      <Tab.Screen name="Orders" component={SellerOrdersScreen} options={{ tabBarLabel: 'Orders', title: 'Orders' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: 'Revenue', title: 'Revenue' }} />
      <Tab.Screen name="Profile" component={StoreProfileScreen} options={{ tabBarLabel: 'Store', title: 'Store Hub' }} />
    </Tab.Navigator>
  );
}
