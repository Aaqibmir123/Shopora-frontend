export type Category = {
  id: string;
  name: string;
  icon: string;
  tint: string;
};

export type ProductColor = {
  name: string;
  hex: string;
  image?: string;
  priceDelta?: number;
};

export type ProductPolicy = {
  title: string;
  description: string;
  tone?: 'primary' | 'info' | 'success' | 'danger';
};

export type Product = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  price: number;
  mrp?: number;
  rating?: number;
  reviews?: number;
  discount?: string;
  image: string;
  badge?: string;
  vendor?: string;
  stock?: number;
  sizes?: string[];
  colors?: ProductColor[];
  gallery?: string[];
  highlights?: string[];
  policies?: ProductPolicy[];
  relatedIds?: string[];
  deliveryText?: string;
};

export type CartItem = Product & {
  quantity: number;
  size?: string;
  color?: string;
};

export type Order = {
  id: string;
  title: string;
  date: string;
  status: 'Placed' | 'Packed' | 'Shipping' | 'Delivered' | 'Cancelled';
  amount: number;
  image: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: 'primary' | 'info' | 'success' | 'danger';
};

export type BannerTargetType = 'NONE' | 'SEARCH' | 'CATEGORY' | 'PRODUCT';

export type Banner = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  targetType: BannerTargetType;
  targetValue?: string | null;
  accentColor?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type SupportThreadStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type SupportSenderRole = 'SHOPPER' | 'SELLER' | 'ADMIN';

export type SupportMessage = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  threadId: string;
  senderId?: string | null;
  senderRole: SupportSenderRole;
  senderName: string;
  message: string;
  attachmentUrl?: string | null;
  isSystem: boolean;
};

export type SupportThreadUser = {
  id: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: 'SHOPPER' | 'SELLER' | 'ADMIN' | null;
};

export type SupportThread = {
  id: string;
  subject: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  user: SupportThreadUser;
  orderId?: string | null;
  orderNumberSnapshot?: string | null;
  orderItemId?: string | null;
  orderItemTitleSnapshot?: string | null;
  assignedAdmin?: SupportThreadUser | null;
  messages: SupportMessage[];
};

export type SupportThreadSummary = Omit<SupportThread, 'messages'> & {
  lastMessage?: SupportMessage | null;
};
