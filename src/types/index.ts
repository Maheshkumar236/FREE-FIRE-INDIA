export interface User {
  uid: string;
  username: string;
  email: string;
  app_uid: string;
  phone: string;
  freefire_uid?: string;
  freefire_name?: string;
  freefire_level?: number;
  profile_photo?: string;
  avatar_url?: string;
  banner_url?: string;
  joined_at: any;
  total_matches: number;
  total_wins: number;
  followers_count?: number;
  following_count?: number;
  wallet_balance: number;
  winnings: number;
  deposits: number;
  is_admin?: boolean;
  is_staff?: boolean;
  is_banned?: boolean;
}

export interface Match {
  id: string;
  title: string;
  entry_fee: number;
  prize_pool: number;
  prize_pool_1st?: number;
  prize_pool_2nd?: number;
  prize_pool_3rd?: number;
  per_kill_prize?: number;
  poster_url?: string;
  description?: string;
  map: 'Bermuda' | 'Kalahari' | 'Purgatory' | 'Alpine';
  mode: 'Solo' | 'Duo' | 'Squad' | '1v1' | '2v2' | '3v3' | 'Clash Squad' | 'Lone Wolf';
  match_time: any;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  max_players: number;
  joined_players: number;
  room_id?: string;
  room_password?: string;
}

export interface Squad {
  id: string;
  name: string;
  code: string;
  leader_uid: string;
  members: string[]; // Array of user UIDs
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw' | 'match_entry' | 'match_win' | 'signup_bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: any;
  upi_id?: string;
  screenshot_url?: string;
  razorpay_payment_id?: string;
}

export interface Notification {
  id: string;
  user_uid: string;
  type: 'friend_request' | 'match_update' | 'wallet_update' | 'system_alert';
  message: string;
  read: boolean;
  created_at: any;
}
