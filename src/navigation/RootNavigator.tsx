import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/constants/navigation';
import { SplashScreen } from '@/screens/auth/SplashScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { OtpScreen } from '@/screens/auth/OtpScreen';
import { AppTabs } from './TabsNavigator';
import { SellerStack } from './SellerStack';
import { AdminStack } from './AdminStack';
import { ProductDetailsScreen } from '@/screens/user/ProductDetailsScreen';
import { SearchScreen } from '@/screens/user/SearchScreen';
import { MyOrdersScreen } from '@/screens/user/MyOrdersScreen';
import { OrderDetailScreen } from '@/screens/user/OrderDetailScreen';
import { CheckoutScreen } from '@/screens/user/CheckoutScreen';
import { AddressSelectionScreen } from '@/screens/user/AddressSelectionScreen';
import { PaymentMethodScreen } from '@/screens/user/PaymentMethodScreen';
import { OrderSuccessScreen } from '@/screens/user/OrderSuccessScreen';
import { OrderTrackingScreen } from '@/screens/user/OrderTrackingScreen';
import { ReturnRequestScreen } from '@/screens/user/ReturnRequestScreen';
import { WishlistScreen } from '@/screens/user/WishlistScreen';
import { NotificationsScreen } from '@/screens/user/NotificationsScreen';
import { CouponsScreen } from '@/screens/user/CouponsScreen';
import { SettingsScreen } from '@/screens/user/SettingsScreen';
import { HelpSupportScreen } from '@/screens/user/HelpSupportScreen';
import { SupportChatScreen } from '@/screens/user/SupportChatScreen';
import { EditProfileScreen } from '@/screens/user/EditProfileScreen';
import { PrivacyPolicyScreen } from '@/screens/common/PrivacyPolicyScreen';
import { TermsConditionsScreen } from '@/screens/common/TermsConditionsScreen';
import { StoreDetailsScreen } from '@/screens/seller/StoreDetailsScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.Splash} component={SplashScreen} />
      <Stack.Screen name={ROUTES.Login} component={LoginScreen} />
      <Stack.Screen name={ROUTES.Otp} component={OtpScreen} />
      <Stack.Screen name={ROUTES.MainTabs} component={AppTabs} />
      <Stack.Screen name={ROUTES.SellerStack} component={SellerStack} />
      <Stack.Screen name={ROUTES.AdminStack} component={AdminStack} />
      <Stack.Screen name={ROUTES.SellerStoreDetails} component={StoreDetailsScreen} />
      <Stack.Screen name={ROUTES.ProductDetails} component={ProductDetailsScreen} />
      <Stack.Screen name={ROUTES.Search} component={SearchScreen} />
      <Stack.Screen name={ROUTES.MyOrders} component={MyOrdersScreen} />
      <Stack.Screen name={ROUTES.OrderDetail} component={OrderDetailScreen} />
      <Stack.Screen name={ROUTES.Checkout} component={CheckoutScreen} />
      <Stack.Screen name={ROUTES.AddressSelection} component={AddressSelectionScreen} />
      <Stack.Screen name={ROUTES.PaymentMethod} component={PaymentMethodScreen} />
      <Stack.Screen name={ROUTES.OrderSuccess} component={OrderSuccessScreen} />
      <Stack.Screen name={ROUTES.OrderTracking} component={OrderTrackingScreen} />
      <Stack.Screen name={ROUTES.ReturnRequest} component={ReturnRequestScreen} />
      <Stack.Screen name={ROUTES.Wishlist} component={WishlistScreen} />
      <Stack.Screen name={ROUTES.Notifications} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.Coupons} component={CouponsScreen} />
      <Stack.Screen name={ROUTES.Settings} component={SettingsScreen} />
      <Stack.Screen name={ROUTES.HelpSupport} component={HelpSupportScreen} />
      <Stack.Screen name={ROUTES.SupportChat} component={SupportChatScreen} />
      <Stack.Screen name={ROUTES.EditProfile} component={EditProfileScreen} />
      <Stack.Screen name={ROUTES.PrivacyPolicy} component={PrivacyPolicyScreen} />
      <Stack.Screen name={ROUTES.TermsConditions} component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
}
