import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Users, Plus, LogOut, Shield, MessageSquare, Copy, Check, X, Trophy, Zap, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { getVipDesignByName } from '../lib/vipAssets';

const Squad: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [squad, setSquad] = useState<any | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User>>({});
  const [squadName, setSquadName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'squads'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setSquad({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setSquad(null);
        }
      },
      (err) => console.warn('Squad listener error:', err)
    );
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!squad || !Array.isArray(squad.members) || squad.members.length === 0) {
      setMemberProfiles({});
      return;
    }

    const fetchMembers = async () => {
      const profilesMap: Record<string, User> = {};
      await Promise.all(
        squad.members.map(async (memberUid: string) => {
          try {
            const snap = await getDoc(doc(db, 'users', memberUid));
            if (snap.exists()) {
              profilesMap[memberUid] = { uid: snap.id, ...snap.data() } as User;
            }
          } catch (err) {
            console.warn('Failed to load squad member:', memberUid, err);
          }
        })
      );
      setMemberProfiles(profilesMap);
    };

    fetchMembers();
  }, [squad]);

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadName.trim() || !user) return;

    setLoading(true);
    try {
      const squadCode = 'SQ' + Math.floor(10000 + Math.random() * 90000);
      await addDoc(collection(db, 'squads'), {
        squad_name: squadName.trim(),
        squad_code: squadCode,
        leader_uid: user.uid,
        leader_name: user.username,
        members: [user.uid],
        created_at: serverTimestamp(),
      });
      toast.success('Squad created!');
      setSquadName('');
    } catch (error) {
      toast.error('Failed to create squad');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'squads'), where('squad_code', '==', joinCode.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('Invalid squad code');
        return;
      }

      const squadDoc = snapshot.docs[0];
      const squadData = squadDoc.data();

      if (squadData.members.length >= 4) {
        toast.error('Squad is full (Max 4 members)');
        return;
      }

      if (squadData.members.includes(user.uid)) {
        toast.error('You are already in this squad');
        return;
      }

      await updateDoc(doc(db, 'squads', squadDoc.id), {
        members: arrayUnion(user.uid)
      });

      toast.success('Joined squad!');
      setJoinCode('');
    } catch (error) {
      toast.error('Failed to join squad');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!squad || !user) return;

    try {
      if (squad.leader_uid === user.uid && squad.members.length === 1) {
        await updateDoc(doc(db, 'squads', squad.id), { members: [] });
      } else {
        await updateDoc(doc(db, 'squads', squad.id), {
          members: arrayRemove(user.uid)
        });
      }
      toast.success('Left squad');
    } catch (error) {
      toast.error('Failed to leave');
    }
  };

  const copyCode = () => {
    if (!squad) return;
    navigator.clipboard.writeText(squad.squad_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Squad code copied!');
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!squad || !user || squad.leader_uid !== user.uid) return;

    try {
      await updateDoc(doc(db, 'squads', squad.id), {
        members: arrayRemove(memberUid)
      });
      toast.success('Member removed from squad');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (squad) {
    const totalSquadWins = squad.members.reduce(
      (sum: number, uid: string) => sum + (memberProfiles[uid]?.total_wins || 0),
      0
    );
    const totalSquadMatches = squad.members.reduce(
      (sum: number, uid: string) => sum + (memberProfiles[uid]?.total_matches || 0),
      0
    );

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-primary/30 bg-gradient-to-r from-primary/10 via-dark-bg to-transparent">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-display font-bold">{squad.squad_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                Active Roster ({squad.members.length}/4)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Invite Code:</span>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
              >
                <span className="text-primary font-mono tabular-nums font-bold">{squad.squad_code}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/squad/chat/${squad.id}`)}
              className="neon-button flex items-center gap-2 text-sm py-2.5 px-5"
            >
              <MessageSquare className="w-4 h-4" /> Team Strategy Chat
            </button>
            <button
              onClick={handleLeaveSquad}
              className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Leave
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Squad Lineup ({squad.members.length}/4)
              </h2>
              <span className="text-xs text-white/40">Real-time 3D VIP Avatars &amp; Game IDs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {squad.members.map((memberUid: string, idx: number) => {
                const profile = memberProfiles[memberUid];
                const displayName = profile?.username || (memberUid === squad.leader_uid ? squad.leader_name : `Teammate #${idx + 1}`);
                const vipDesign = getVipDesignByName(displayName);
                const avatarSrc = profile?.profile_photo || profile?.avatar_url || vipDesign.avatarUrl;
                const isLeader = memberUid === squad.leader_uid;

                return (
                  <div
                    key={memberUid}
                    className="glass-card p-5 flex items-center justify-between border-white/10 hover:border-primary/40 transition-all"
                  >
                    <Link to={`/profile/${memberUid}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/40 bg-dark-bg"
                          referrerPolicy="no-referrer"
                        />
                        {isLeader && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                            <Crown className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{displayName}</p>
                          {isLeader && (
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 border border-primary/30">
                              IGL / Leader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 truncate">
                          FF: <span className="text-white/80 font-medium">{profile?.freefire_name || 'Verified Player'}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono tabular-nums text-white/40">
                          <span>UID: {profile?.freefire_uid || profile?.app_uid || '---'}</span>
                          <span>•</span>
                          <span className="text-primary font-bold">{profile?.total_wins || 0} Wins</span>
                        </div>
                      </div>
                    </Link>

                    {squad.leader_uid === user?.uid && memberUid !== user?.uid && (
                      <button
                        onClick={() => handleRemoveMember(memberUid)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                        title="Remove Member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {Array.from({ length: Math.max(0, 4 - squad.members.length) }).map((_, emptyIdx) => (
                <div
                  key={`empty_${emptyIdx}`}
                  onClick={copyCode}
                  className="glass-card p-5 border-dashed border-white/10 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-white/30 group-hover:text-primary transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-white/50 group-hover:text-white transition-colors">Open Squad Slot</p>
                      <p className="text-xs text-white/30">Click to copy code <span className="text-primary font-mono">{squad.squad_code}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/15 rounded-2xl text-primary">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Squad Command</h3>
                  <p className="text-xs text-white/40">1-Click Tournament Ready</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-sans text-white/40 uppercase font-bold">Combined Wins</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">{totalSquadWins}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-sans text-white/40 uppercase font-bold">Matches Played</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{totalSquadMatches}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-green-400">
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> 1-Click Squad Registration</span>
                  <span>ACTIVE</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  You can now register this entire squad in a single click on any Squad, Duo, or Clash Squad tournament page!
                </p>
              </div>

              <button
                onClick={() => navigate('/matches?mode=Squad')}
                className="w-full neon-button py-3 text-sm flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" /> Browse Squad Tournaments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display font-bold">Join or Create a <span className="text-primary">Squad</span></h1>
        <p className="text-white/40">Build your 4-player Free Fire roster for 1-click tournament entry and monthly LAN qualifiers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <div className="p-4 bg-primary/10 rounded-2xl w-fit text-primary">
            <Plus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Create Squad</h2>
          <p className="text-sm text-white/40">Start your own 4-player squad and invite your teammates using a unique squad code.</p>
          <form onSubmit={handleCreateSquad} className="space-y-4">
            <input
              required
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              placeholder="Enter Squad Name (e.g. TEAM ELITE)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
            />
            <button
              type="submit"
              disabled={loading || !squadName.trim()}
              className="w-full neon-button py-3 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create My Squad'}
            </button>
          </form>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="p-4 bg-blue-500/10 rounded-2xl w-fit text-blue-500">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Join Squad</h2>
          <p className="text-sm text-white/40">Already have a squad code from your captain? Enter it below to join the lineup.</p>
          <form onSubmit={handleJoinSquad} className="space-y-4">
            <input
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter Squad Code (e.g. SQ83921)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-primary transition-all outline-none uppercase"
            />
            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Squad'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Squad;
