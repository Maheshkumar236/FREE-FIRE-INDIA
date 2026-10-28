import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, increment, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Shield, Edit2, Wallet, History, MessageSquare, UserPlus, Clock, Check, Sparkles, Crown, Grid, Trophy, Crosshair, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { VIP_AZ_DESIGNS, getVipDesignByName } from '../lib/vipAssets';

const Profile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dp' | 'banner'>('dp');
  const [ffUid, setFfUid] = useState('');
  const [ffName, setFfName] = useState('');
  const [ffLevel, setFfLevel] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedBanner, setSelectedBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  const isOwnProfile = !uid || uid === currentUser?.uid;
  const targetUid = uid || currentUser?.uid;

  useEffect(() => {
    if (!targetUid) return;

    const userUnsub = onSnapshot(
      doc(db, 'users', targetUid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { uid: docSnap.id, ...docSnap.data() } as User;
          const defaultVip = getVipDesignByName(data.username);
          setProfileUser(data);
          setFfUid(data.freefire_uid || '');
          setFfName(data.freefire_name || '');
          setFfLevel(data.freefire_level?.toString() || '');
          setSelectedAvatar(data.avatar_url || data.profile_photo || defaultVip.avatarUrl);
          setSelectedBanner(data.banner_url || defaultVip.bannerUrl);
        }
      },
      (err) => console.warn('Error listening to profile:', err)
    );

    // Real-time listener for Player Match History & Kill Stats Table
    const historyQuery = query(
      collection(db, 'match_participants'),
      where('user_uid', '==', targetUid)
    );
    const historyUnsub = onSnapshot(
      historyQuery,
      async (snap) => {
        const rawEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
        // Hydrate match title/mode if missing on older participant docs
        const hydrated = await Promise.all(
          rawEntries.map(async (entry) => {
            if (entry.match_title && entry.match_mode) return entry;
            try {
              if (entry.match_id) {
                const mSnap = await getDoc(doc(db, 'matches', entry.match_id));
                if (mSnap.exists()) {
                  const mData = mSnap.data();
                  return {
                    ...entry,
                    match_title: mData.title || 'Tournament Match',
                    match_mode: mData.mode || 'Squad',
                    match_status: mData.status
                  };
                }
              }
            } catch (e) {
              console.warn('Match hydration failed:', e);
            }
            return {
              ...entry,
              match_title: entry.match_title || 'Free Fire Tournament',
              match_mode: entry.match_mode || 'Classic'
            };
          })
        );

        hydrated.sort((a, b) => {
          const tA = a.joined_at?.toMillis?.() || 0;
          const tB = b.joined_at?.toMillis?.() || 0;
          return tB - tA;
        });
        setMatchHistory(hydrated);
      },
      (err) => console.warn('Match history listener error:', err)
    );

    if (!isOwnProfile && currentUser) {
      const friendUnsub = onSnapshot(
        doc(db, 'friends', `${currentUser.uid}_${targetUid}`),
        (docSnap) => {
          setIsFriend(docSnap.exists());
        },
        (err) => console.warn('Friend status listener error:', err)
      );

      const q = query(
        collection(db, 'friend_requests'),
        where('sender_uid', '==', currentUser.uid),
        where('receiver_uid', '==', targetUid)
      );
      const requestUnsub = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            setRequestStatus(snap.docs[0].data().status);
          } else {
            setRequestStatus(null);
          }
        },
        (err) => console.warn('Friend request listener error:', err)
      );

      return () => {
        userUnsub();
        historyUnsub();
        friendUnsub();
        requestUnsub();
      };
    }

    return () => {
      userUnsub();
      historyUnsub();
    };
  }, [targetUid, isOwnProfile, currentUser]);

  const generateAvatar = async () => {
    if (!profileUser?.username) return;
    setGeneratingAvatar(true);
    try {
      const randomDesign = VIP_AZ_DESIGNS[Math.floor(Math.random() * VIP_AZ_DESIGNS.length)];
      await updateDoc(doc(db, 'users', profileUser.uid), {
        avatar_url: randomDesign.avatarUrl
      });
      setSelectedAvatar(randomDesign.avatarUrl);
      toast.success(`Equipped 3D [${randomDesign.letter}] ${randomDesign.title} Avatar!`);
    } catch (error) {
      setIsEditing(true);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const generateBanner = async () => {
    if (!profileUser?.username) return;
    setGeneratingBanner(true);
    try {
      const randomDesign = VIP_AZ_DESIGNS[Math.floor(Math.random() * VIP_AZ_DESIGNS.length)];
      await updateDoc(doc(db, 'users', profileUser.uid), {
        banner_url: randomDesign.bannerUrl
      });
      setSelectedBanner(randomDesign.bannerUrl);
      toast.success(`Equipped 3D [${randomDesign.letter}] ${randomDesign.title} Banner!`);
    } catch (error) {
      setIsEditing(true);
    } finally {
      setGeneratingBanner(false);
    }
  };

  const handleSelectVipDesign = async (type: 'dp' | 'banner', url: string, letter: string) => {
    if (!currentUser) return;
    try {
      if (type === 'dp') {
        setSelectedAvatar(url);
        await updateDoc(doc(db, 'users', currentUser.uid), { avatar_url: url });
        toast.success(`3D Avatar [${letter}] equipped!`);
      } else {
        setSelectedBanner(url);
        await updateDoc(doc(db, 'users', currentUser.uid), { banner_url: url });
        toast.success(`3D Banner [${letter}] equipped!`);
      }
    } catch (err) {
      toast.error('Failed to update design');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        freefire_uid: ffUid,
        freefire_name: ffName,
        freefire_level: parseInt(ffLevel) || 0,
        avatar_url: selectedAvatar,
        banner_url: selectedBanner,
      });
      toast.success('VIP Profile updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const sendFollowRequest = async () => {
    if (!currentUser || !profileUser) return;
    try {
      await setDoc(doc(collection(db, 'friend_requests')), {
        sender_uid: currentUser.uid,
        sender_username: currentUser.username,
        receiver_uid: profileUser.uid,
        status: 'pending',
        created_at: serverTimestamp()
      });

      await setDoc(doc(collection(db, 'notifications')), {
        user_uid: profileUser.uid,
        type: 'friend_request',
        message: `${currentUser.username} sent you a follow request.`,
        read: false,
        created_at: serverTimestamp()
      });

      toast.success('Follow request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profileUser) return;
    try {
      await deleteDoc(doc(db, 'friends', `${currentUser.uid}_${profileUser.uid}`));
      await deleteDoc(doc(db, 'friends', `${profileUser.uid}_${currentUser.uid}`));

      await updateDoc(doc(db, 'users', currentUser.uid), {
        following_count: increment(-1)
      });
      await updateDoc(doc(db, 'users', profileUser.uid), {
        followers_count: increment(-1)
      });

      toast.success(`Unfollowed ${profileUser.username}`);
    } catch (error) {
      toast.error('Failed to unfollow');
    }
  };

  if (!profileUser) return <div className="p-20 text-center text-primary">Loading VIP Profile...</div>;

  const defaultVip = getVipDesignByName(profileUser.username);
  const activeAvatar = profileUser.avatar_url || profileUser.profile_photo || defaultVip.avatarUrl;
  const activeBanner = profileUser.banner_url || defaultVip.bannerUrl;
  const totalMatchesCount = Math.max(profileUser.total_matches || 0, matchHistory.length);
  const winRate = totalMatchesCount > 0
    ? Math.min(100, Math.round(((profileUser.total_wins || 0) / totalMatchesCount) * 100))
    : 0;
  const totalKills = matchHistory.reduce((sum, item) => sum + (Number(item.kills) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header Banner */}
      <div className="relative h-52 md:h-64 rounded-3xl bg-gradient-to-r from-primary/40 to-dark-bg border border-white/10 overflow-hidden shadow-2xl">
        <img
          src={activeBanner}
          alt="VIP Banner"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-80" />
        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setActiveTab('banner');
              }}
              className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:border-primary transition-all"
            >
              <Grid className="w-3.5 h-3.5 text-primary" /> A-Z 3D Banners (26)
            </button>
            <button
              onClick={generateBanner}
              disabled={generatingBanner}
              className="p-2 bg-primary/80 backdrop-blur-md text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              title="Generate AI Banner"
            >
              {generatingBanner ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-dark-bg border-4 border-primary overflow-hidden shadow-[0_0_25px_rgba(255,107,0,0.4)] relative">
              <img
                src={activeAvatar}
                alt={profileUser.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isOwnProfile && (
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setActiveTab('dp');
                  }}
                  className="p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                  title="Choose 3D A-Z Avatar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={generateAvatar}
                  disabled={generatingAvatar}
                  className="p-2 bg-black/80 border border-white/20 text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                  title="Generate AI Avatar"
                >
                  {generatingAvatar ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-3xl font-display font-bold">{profileUser.username}</h1>
              {profileUser.is_admin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/40">
                  <Shield className="w-3 h-3" /> Official Staff
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-widest border border-yellow-500/30">
                  <Crown className="w-3 h-3" /> VIP Pro Gamer
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-bold uppercase border border-white/10">
                {defaultVip.title} [{defaultVip.letter}]
              </span>
            </div>
            <p className="text-white/40 font-mono tabular-nums text-sm">App UID: {profileUser.app_uid}</p>
          </div>

          <div className="flex flex-wrap gap-3 pb-2">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                >
                  <Edit2 className="w-4 h-4" /> {isEditing ? 'Close Customizer' : 'Edit Profile & 3D Avatar'}
                </button>
                {(currentUser?.email === 'mkofficialforcollab@gmail.com' || currentUser?.email === 'maheshkumae8542@gmail.com') && !currentUser?.is_admin && (
                  <button
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', currentUser.uid), { is_admin: true, is_staff: true });
                        toast.success('Admin status restored!');
                      } catch (e) {
                        toast.error('Failed to restore admin status');
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-sm hover:bg-yellow-500/20 transition-all"
                  >
                    <Shield className="w-4 h-4" /> Restore Admin
                  </button>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                {isFriend ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/chat/${profileUser.uid}`)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                    >
                      <MessageSquare className="w-4 h-4" /> Direct Message
                    </button>
                    <button
                      onClick={handleUnfollow}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm hover:text-red-500 transition-all"
                    >
                      Unfollow
                    </button>
                  </div>
                ) : requestStatus === 'pending' ? (
                  <button disabled className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-sm">
                    <Clock className="w-4 h-4" /> Request Pending
                  </button>
                ) : (
                  <button
                    onClick={sendFollowRequest}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:scale-105 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Follow Player
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* V.I.P. 52 A-Z 3D Designs Customizer Modal / Section */}
      {isEditing && isOwnProfile && (
        <div className="glass-card p-6 md:p-8 border-primary/40 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">VIP Identity System • 52 3D Designs</span>
              <h2 className="text-2xl font-display font-bold text-white">A-Z 3D Avatar &amp; Banner Studio</h2>
              <p className="text-xs text-white/50">Click any 3D letter design below to equip it immediately on your profile</p>
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('dp')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'dp' ? 'bg-primary text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                26 3D Avatars (A–Z DPs)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('banner')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'banner' ? 'bg-primary text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                26 3D Banners (A–Z)
              </button>
            </div>
          </div>

          {activeTab === 'dp' ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-3 max-h-80 overflow-y-auto pr-1">
              {VIP_AZ_DESIGNS.map((item) => {
                const isSelected = activeAvatar === item.avatarUrl;
                return (
                  <button
                    key={item.letter}
                    type="button"
                    onClick={() => handleSelectVipDesign('dp', item.avatarUrl, item.letter)}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all p-1 bg-black/40 ${
                      isSelected ? 'border-primary scale-105 shadow-[0_0_15px_rgba(255,107,0,0.5)]' : 'border-white/10 hover:border-white/40'
                    }`}
                  >
                    <img src={item.avatarUrl} alt={item.letter} className="w-full aspect-square rounded-xl object-cover" />
                    <div className="mt-1 text-center">
                      <p className="text-[10px] font-bold text-white">{item.letter}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-1">
              {VIP_AZ_DESIGNS.map((item) => {
                const isSelected = activeBanner === item.bannerUrl;
                return (
                  <button
                    key={item.letter}
                    type="button"
                    onClick={() => handleSelectVipDesign('banner', item.bannerUrl, item.letter)}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all bg-black/40 text-left ${
                      isSelected ? 'border-primary shadow-[0_0_15px_rgba(255,107,0,0.5)]' : 'border-white/10 hover:border-white/40'
                    }`}
                  >
                    <img src={item.bannerUrl} alt={item.title} className="w-full h-24 object-cover" />
                    <div className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">[{item.letter}] {item.title}</p>
                        <p className="text-[10px] text-white/40">3D Pro Series Banner</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Professional Dashboard Stats Card */}
          <div className="glass-card p-6 grid grid-cols-2 gap-4 font-mono tabular-nums">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-widest mb-1">Matches</p>
              <p className="text-2xl font-display font-bold">{totalMatchesCount}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <p className="text-[10px] font-sans font-bold text-primary/80 uppercase tracking-widest mb-1">Wins</p>
              <p className="text-2xl font-display font-bold text-primary">{profileUser.total_wins || 0}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-widest mb-1">Total Kills</p>
              <p className="text-2xl font-display font-bold text-white">{totalKills}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-widest mb-1">Win Rate</p>
              <p className="text-2xl font-display font-bold text-green-400">{winRate}%</p>
            </div>
          </div>

          {/* Free Fire Info */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Free Fire Game ID
              </h3>
              {isOwnProfile && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-xs text-primary hover:underline">
                  Edit
                </button>
              )}
            </div>

            {isEditing && isOwnProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">FF UID</label>
                  <input
                    value={ffUid}
                    onChange={(e) => setFfUid(e.target.value)}
                    placeholder="e.g. 123456789"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-primary transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">In-Game Name</label>
                  <input
                    value={ffName}
                    onChange={(e) => setFfName(e.target.value)}
                    placeholder="e.g. ShadowX_YT"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-primary transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Level (Min 40 for Pro Matches)</label>
                  <input
                    type="number"
                    value={ffLevel}
                    onChange={(e) => setFfLevel(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-primary transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full neon-button py-2.5 text-sm"
                >
                  {loading ? 'Saving...' : 'Save Game Details'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-white/40">FF UID</span>
                  <span className="text-sm font-mono tabular-nums font-bold">{profileUser.freefire_uid || 'Not Set'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-white/40">In-Game Name</span>
                  <span className="text-sm font-bold">{profileUser.freefire_name || 'Not Set'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-white/40">Level</span>
                  <span className="text-sm font-mono tabular-nums font-bold">{profileUser.freefire_level || '0'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isOwnProfile && (
            <div className="glass-card p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-green-500/20 rounded-2xl">
                  <Wallet className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Smart Wallet Balance</p>
                  <p className="text-3xl font-display font-mono tabular-nums font-bold">₹{profileUser.wallet_balance ?? 0}</p>
                </div>
              </div>
              <button onClick={() => navigate('/wallet')} className="neon-button py-2.5 px-8 text-sm">
                Add Cash / Withdraw
              </button>
            </div>
          )}

          {/* Career Summary Row */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Career Overview &amp; Match History
            </h3>
            <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono tabular-nums">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-sans text-white/40">VIP Emblem</p>
                <p className="text-lg font-sans font-bold text-primary mt-1">{defaultVip.title}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-sans text-white/40">Total Earnings</p>
                <p className="text-lg font-bold text-green-400 mt-1">₹{profileUser.winnings || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs font-sans text-white/40">LAN Qualification</p>
                <p className="text-lg font-sans font-bold text-yellow-400 mt-1">
                  {totalMatchesCount >= 3 || (profileUser.total_wins || 0) >= 1 ? 'Qualified ✓' : 'In Progress'}
                </p>
              </div>
            </div>

            {/* Real-Time Match History & Kill Stats Table */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm">Player Match History &amp; Kill Stats</h4>
                </div>
                <span className="text-xs font-mono tabular-nums text-white/40">
                  {matchHistory.length} Matches Logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                      <th className="px-6 py-3.5">Tournament</th>
                      <th className="px-6 py-3.5">Mode / Squad</th>
                      <th className="px-6 py-3.5 text-right">Kills</th>
                      <th className="px-6 py-3.5 text-right">Placement</th>
                      <th className="px-6 py-3.5 text-right">Prize Won</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-mono tabular-nums">
                    {matchHistory.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3.5 font-sans">
                          <Link
                            to={`/match/${item.match_id}`}
                            className="font-bold text-white hover:text-primary transition-colors block truncate max-w-[200px]"
                          >
                            {item.match_title}
                          </Link>
                          <span className="text-[10px] text-white/40">
                            IGN: {item.ff_name || profileUser.username}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-sans">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase text-white/70">
                            {item.match_mode || 'Squad'}
                          </span>
                          {item.squad_name && (
                            <span className="ml-1.5 px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold uppercase">
                              {item.squad_name}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-white">
                          {item.kills ?? 0}
                        </td>
                        <td className="px-6 py-3.5 text-right font-sans">
                          {item.placement ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                              <Award className="w-3 h-3" /> #{item.placement}
                            </span>
                          ) : (
                            <span className="text-xs text-white/50">
                              {item.slot ? `Slot #${item.slot}` : 'Registered'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-green-400">
                          ₹{item.prize_won || 0}
                        </td>
                      </tr>
                    ))}
                    {matchHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center font-sans text-white/40 space-y-2">
                          <Trophy className="w-7 h-7 text-white/20 mx-auto mb-1" />
                          <p className="text-xs">No tournament matches played yet.</p>
                          {isOwnProfile && (
                            <Link
                              to="/matches"
                              className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-all"
                            >
                              Join First Tournament →
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
