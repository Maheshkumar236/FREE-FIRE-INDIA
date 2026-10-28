import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDocs, collection, query, limit } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { User } from '../types';
import { generateAppUID } from '../lib/utils';
import { getVipDesignByName } from '../lib/vipAssets';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, firebaseUser: null });

const SUPER_ADMIN_EMAILS = [
  'mkofficialforcollab@gmail.com',
  'maheshkumae8542@gmail.com',
];

let starterSeededCheckDone = false;

async function seedStarterMatchesIfEmpty() {
  if (starterSeededCheckDone) return;
  starterSeededCheckDone = true;
  try {
    const snap = await getDocs(query(collection(db, 'matches'), limit(1)));
    if (!snap.empty) return;

    const now = Date.now();
    const starterMatches = [
      {
        id: 'starter_solo_bermuda',
        title: 'ELITESTAR Daily Solo Pro — Bermuda',
        description: 'Official Solo survival battle. Top 3 placements + ₹5 per kill instant wallet auto-payout!',
        entry_fee: 10,
        prize_pool: 500,
        prize_pool_1st: 250,
        prize_pool_2nd: 150,
        prize_pool_3rd: 100,
        per_kill_prize: 5,
        map: 'Bermuda',
        mode: 'Solo',
        match_time: new Date(now + 2 * 60 * 60 * 1000),
        max_players: 48,
        joined_players: 0,
        status: 'upcoming',
        created_at: serverTimestamp(),
      },
      {
        id: 'starter_squad_kalahari',
        title: 'ELITESTAR 1-Click Squad Championship',
        description: 'Bring your 4-player squad! 1-click full roster registration and LAN qualifier points.',
        entry_fee: 20,
        prize_pool: 2000,
        prize_pool_1st: 1000,
        prize_pool_2nd: 600,
        prize_pool_3rd: 400,
        per_kill_prize: 10,
        map: 'Kalahari',
        mode: 'Squad',
        match_time: new Date(now + 4 * 60 * 60 * 1000),
        max_players: 48,
        joined_players: 0,
        status: 'upcoming',
        created_at: serverTimestamp(),
      },
      {
        id: 'starter_clash_squad',
        title: 'ELITESTAR 4v4 Clash Squad Rush',
        description: 'Fast-paced 4v4 tactical showdown. Custom room rules: Unlimited ammo, no grenade.',
        entry_fee: 25,
        prize_pool: 1000,
        prize_pool_1st: 700,
        prize_pool_2nd: 300,
        prize_pool_3rd: 0,
        per_kill_prize: 5,
        map: 'Bermuda',
        mode: 'Clash Squad',
        match_time: new Date(now + 6 * 60 * 60 * 1000),
        max_players: 8,
        joined_players: 0,
        status: 'upcoming',
        created_at: serverTimestamp(),
      },
      {
        id: 'starter_duo_purgatory',
        title: 'ELITESTAR Duo Blitz — Purgatory',
        description: 'Team up with your duo partner and dominate Purgatory for instant cash rewards.',
        entry_fee: 15,
        prize_pool: 800,
        prize_pool_1st: 400,
        prize_pool_2nd: 250,
        prize_pool_3rd: 150,
        per_kill_prize: 5,
        map: 'Purgatory',
        mode: 'Duo',
        match_time: new Date(now + 8 * 60 * 60 * 1000),
        max_players: 48,
        joined_players: 0,
        status: 'upcoming',
        created_at: serverTimestamp(),
      },
    ];

    await Promise.all(
      starterMatches.map((m) => {
        const { id, ...data } = m;
        return setDoc(doc(db, 'matches', id), data);
      })
    );
  } catch (err) {
    console.warn('Starter match check skipped:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (fUser) {
        setLoading(true);
        seedStarterMatchesIfEmpty();

        const userRef = doc(db, 'users', fUser.uid);
        unsubscribeUser = onSnapshot(
          userRef,
          async (docSnap) => {
            const emailLower = (fUser.email || '').toLowerCase();
            const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(emailLower);

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (isSuperAdminEmail && (!data.is_admin || !data.is_staff)) {
                try {
                  await updateDoc(userRef, { is_admin: true, is_staff: true });
                } catch (e) {
                  console.warn('Failed to elevate super admin:', e);
                }
              }
              setUser({ uid: fUser.uid, ...data, is_admin: data.is_admin || isSuperAdminEmail } as User);
              setLoading(false);
            } else {
              // Automatically provision profile for Google Sign-In or fresh database user
              try {
                const rawName = fUser.displayName || fUser.email?.split('@')[0] || 'ProGamer';
                const cleanUsername = rawName.replace(/[^a-zA-Z0-9_ ]/g, '').trim() || 'ProGamer';
                const vipDesign = getVipDesignByName(cleanUsername);
                const newProfile = {
                  username: cleanUsername,
                  email: fUser.email || '',
                  phone: fUser.phoneNumber || '',
                  dob: '2002-01-01',
                  app_uid: generateAppUID(),
                  freefire_uid: '',
                  freefire_name: cleanUsername,
                  freefire_level: 55,
                  wallet_balance: 10,
                  winnings: 0,
                  deposits: 0,
                  total_matches: 0,
                  total_wins: 0,
                  joined_at: serverTimestamp(),
                  is_admin: isSuperAdminEmail,
                  is_staff: isSuperAdminEmail,
                  is_banned: false,
                  avatar_url: vipDesign.avatarUrl,
                  banner_url: vipDesign.bannerUrl,
                };
                await setDoc(userRef, newProfile);
                await setDoc(doc(db, 'transactions', `signup_${fUser.uid}`), {
                  user_id: fUser.uid,
                  type: 'signup_bonus',
                  amount: 10,
                  status: 'completed',
                  created_at: serverTimestamp(),
                });
              } catch (err) {
                console.error('Error auto-provisioning user profile:', err);
                setLoading(false);
              }
            }
          },
          (error) => {
            console.error('Error listening to user document:', error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
