import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ROUTES } from '@/constants/navigation';
import { HomeScreen } from '@/screens/user/HomeScreen';
import { CartScreen } from '@/screens/user/CartScreen';
import { MyOrdersScreen } from '@/screens/user/MyOrdersScreen';
import { ProfileScreen } from '@/screens/user/ProfileScreen';
import { AppTheme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { selectCartCount } from '@/store/slices/uiSlice';

const Tab = createBottomTabNavigator();

export function AppTabs() {
  const cartCount = useAppSelector(selectCartCount);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textSoft,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'android' ? 28 : 20,
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopColor: 'transparent',
          borderRadius: 26,
          height: 80,
          paddingBottom: Platform.OS === 'android' ? 16 : 14,
          paddingTop: 10,
          paddingHorizontal: 10,
          elevation: 14,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }
      }}
    >
      <Tab.Screen name={ROUTES.MainTabs + ':Home'} component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color, size }: any) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tab.Screen
        name={ROUTES.MainTabs + ':Cart'}
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }: any) => <Ionicons name="bag-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen name={ROUTES.MainTabs + ':Orders'} component={MyOrdersScreen} options={{ title: 'Orders', tabBarIcon: ({ color, size }: any) => <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size - 1} /> }} />
      <Tab.Screen name={ROUTES.MainTabs + ':Profile'} component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color, size }: any) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}
