export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  axiNumber: number;
  registrationDate: string;
  authType: 'wallet' | 'web2';
  totalAxioms: number;
  totalLikes: number;
  totalViews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  profilePhoto?: string;
  email?: string;
  emailVerified?: boolean;
}

export interface ModeColors {
  accent: string;
  bg: string;
  code: string;
}

export type Mode = 'pro' | 'gamer' | 'biohacker' | 'hacker';

export interface WalletConnection {
  address: string;
  type: 'metamask' | 'phantom' | 'manual';
  connected: boolean;
}

export type AppPage = 'home' | 'profile' | 'faq';