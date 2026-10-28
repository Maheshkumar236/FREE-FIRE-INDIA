import React, { useEffect, useState } from 'react';
import { collection, query, where, addDoc, serverTimestamp, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Search, UserPlus, MessageSquare, Clock, Shield, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getVipDesignByName } from '../lib/vipAssets';

const SearchPlayer: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('uid') || '');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

  const checkRequestStatusForPlayers = async (players: User[]) => {
    if (!user) return;
    await Promise.all(
      players.map(async (player) => {
        if (player.uid === user.uid) return;
        try {
          const reqQuery = query(
            collection(db, 'friend_requests'),
            where('sender_uid', '==', user.uid),
            where('receiver_uid', '==', player.uid)
          );
          const reqSnap = await getDocs(reqQuery);
          if (!reqSnap.empty) {
            setRequestStatus(prev => ({ ...prev, [player.uid]: reqSnap.docs[0].data().status }));
          }
        } catch (err) {
          console.warn('Friend request status check failed:', err);
        }
      })
    );
  };

  const loadInitialPlayers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), limit(30)));
      const players = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      players.sort((a, b) => (b.total_wins || 0) - (a.total_wins || 0));
      setResults(players.slice(0, 12));
      await checkRequestStatusForPlayers(players.slice(0, 12));
    } catch (err) {
      console.warn('Initial players fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = searchQuery.trim();
    if (!term) {
      loadInitialPlayers();
      return;
    }

    setLoading(true);
    try {
      const lowerTerm = term.toLowerCase();
      // 1. Check exact App UID match first
      const uidSnap = await getDocs(query(collection(db, 'users'), where('app_uid', '==', term)));
      const uidPlayers = uidSnap.docs.map(d => ({ uid: d.id, ...d.data() } as User));

      // 2. Fetch broader user pool for case-insensitive Username / FF Name / FF UID search
      const poolSnap = await getDocs(query(collection(db, 'users'), limit(100)));
      const poolPlayers = poolSnap.docs
        .map(d => ({ uid: d.id, ...d.data() } as User))
        .filter((p) => {
          const uName = (p.username || '').toLowerCase();
          const ffName = (p.freefire_name || '').toLowerCase();
          const appUid = (p.app_uid || '').toLowerCase();
          const ffUid = (p.freefire_uid || '').toLowerCase();
          return (
            uName.includes(lowerTerm) ||
            ffName.includes(lowerTerm) ||
            appUid.includes(lowerTerm) ||
            ffUid.includes(lowerTerm)
          );
        });

      // Merge unique players by uid
      const mergedMap = new Map<string, User>();
      [...uidPlayers, ...poolPlayers].forEach((p) => mergedMap.set(p.uid, p));
      const finalPlayers = Array.from(mergedMap.values());

      setResults(finalPlayers);
      if (finalPlayers.length === 0) {
        toast.error('No player found matching that Username or UID');
      } else {
        await checkRequestStatusForPlayers(finalPlayers);
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('uid')) {
      handleSearch();
    } else {
      loadInitialPlayers();
    }
  }, [searchParams]);

  const sendFollowRequest = async (targetUser: User) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friend_requests'), {
        sender_uid: user.uid,
        sender_username: user.username,
        receiver_uid: targetUser.uid,
        status: 'pending',
        created_at: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: targetUser.uid,
        type: 'friend_request',
        message: `${user.username} sent you a follow request.`,
        read: false,
        created_at: serverTimestamp()
      });

      setRequestStatus(prev => ({ ...prev, [targetUser.uid]: 'pending' }));
      toast.success('Follow request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold">Find <span className="text-primary">Players</span></h1>
        <p className="text-white/40 text-sm">Search by Username, Free Fire Name, or 8-digit App UID</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Username, FF Name, or App UID..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-32 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-base outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="space-y-4">
        {results.map((player) => {
          const vipDesign = getVipDesignByName(player.username);
          const avatarUrl = player.profile_photo || player.avatar_url || vipDesign.avatarUrl;
          return (
            <motion.div
              key={player.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-primary/40 transition-all"
            >
              <Link to={`/profile/${player.uid}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-primary/40 overflow-hidden shrink-0">
                  <img
                    src={avatarUrl}
                    alt={player.username}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold truncate text-white">{player.username}</h3>
                    {player.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase border border-primary/30">
                        <Shield className="w-2.5 h-2.5" /> Official Staff
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-bold uppercase border border-white/10">
                        <Sparkles className="w-2.5 h-2.5 text-primary" /> {vipDesign.title}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-mono tabular-nums mb-2">
                    App UID: {player.app_uid} {player.freefire_name ? `• FF: ${player.freefire_name}` : ''}
                  </p>
                  <div className="flex items-center gap-5 text-xs text-white/60 font-mono tabular-nums">
                    <div>
                      <span className="font-bold text-white">{player.total_matches || 0}</span>{' '}
                      <span className="text-[10px] font-sans uppercase text-white/40">Matches</span>
                    </div>
                    <div>
                      <span className="font-bold text-primary">{player.total_wins || 0}</span>{' '}
                      <span className="text-[10px] font-sans uppercase text-white/40">Wins</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">{player.freefire_level || '-'}</span>{' '}
                      <span className="text-[10px] font-sans uppercase text-white/40">FF Lvl</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex sm:flex-col gap-2 shrink-0">
                {player.uid === user?.uid ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                  >
                    My Profile
                  </button>
                ) : requestStatus[player.uid] === 'accepted' ? (
                  <button
                    onClick={() => navigate(`/chat/${player.uid}`)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                ) : requestStatus[player.uid] === 'pending' ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </button>
                ) : (
                  <button
                    onClick={() => sendFollowRequest(player)}
                    className="px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPlayer;
