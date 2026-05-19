declare module '@react-navigation/native' {
  export const NavigationContainer: any;
  export const DefaultTheme: any;
  export const DarkTheme: any;
  export function useNavigation(): any;
}

declare module '@react-navigation/native-stack' {
  export function createNativeStackNavigator(): any;
  export type NativeStackScreenProps = any;
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
  export const MaterialCommunityIcons: any;
}

declare module 'expo-image' {
  export const Image: any;
}

declare module 'expo-linear-gradient' {
  export const LinearGradient: any;
}

declare module 'expo-blur' {
  export const BlurView: any;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'react-hook-form' {
  export const Controller: any;
  export function useForm(): any;
}

declare module '@hookform/resolvers/zod' {
  export const zodResolver: any;
}

declare module '@reduxjs/toolkit' {
  export const configureStore: any;
  export const createSlice: any;
  export type PayloadAction = any;
}

declare module '@reduxjs/toolkit/query/react' {
  export const createApi: any;
  export const fetchBaseQuery: any;
}
