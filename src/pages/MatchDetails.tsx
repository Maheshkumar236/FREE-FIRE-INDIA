import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, serverTimestamp, increment, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Match, User } from '../types';
import { Trophy, Users, Clock, Shield, AlertTriangle, ChevronLeft, Sparkles, Copy, Check, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getVipDesignByName } from '../lib/vipAssets';
import { getMapArtwork } from '../lib/ffIndiaAssets';

const MatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Join mode: solo vs 1-click squad
  const [joinType, setJoinType] = useState<'solo' | 'squad'>('solo');
  const [userSquad, setUserSquad] = useState<any | null>(null);
  const [squadMembers, setSquadMembers] = useState<User[]>([]);
  const [selectedSquadUids, setSelectedSquadUids] = useState<string[]>([]);

  // Solo join form state
  const [ffUid, setFfUid] = useState('');
  const [ffName, setFfName] = useState('');
  const [ffLevel, setFfLevel] = useState('');

  const [registrationStatus, setRegistrationStatus] = useState<'none' | 'pending' | 'registered'>('none');
  const [participantDoc, setParticipantDoc] = useState<any>(null);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  // Countdown & Copy state
  const [countdownText, setCountdownText] = useState<string>('Calculating...');
  const [roomRevealCountdown, setRoomRevealCountdown] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'id' | 'pass' | null>(null);

  const generateMatchBanner = async () => {
    if (!match) return;
    setGeneratingBanner(true);
    try {
      const mapArt = getMapArtwork(match.map, match.mode);
      await updateDoc(doc(db, 'matches', match.id), {
        poster_url: mapArt
      });
      toast.success(`Equipped ${match.map} Tactical Arena Banner!`);
    } catch (error) {
      toast.error('Failed to update match banner');
    } finally {
      setGeneratingBanner(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFfUid((prev) => prev || user.freefire_uid || user.app_uid || '');
      setFfName((prev) => prev || user.freefire_name || user.username || '');
      setFfLevel((prev) => prev || (user.freefire_level ? user.freefire_level.toString() : '55'));
    }
  }, [user]);

  // Load user's squad & hydrate member profiles for 1-Click Squad Registration
  useEffect(() => {
    if (!user) return;
    const sqQuery = query(collection(db, 'squads'), where('members', 'array-contains', user.uid));
    const unsubSquad = onSnapshot(
      sqQuery,
      async (snap) => {
        if (!snap.empty) {
          const sqData: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setUserSquad(sqData);
          const loadedMembers: User[] = [];
          for (const mUid of sqData.members || []) {
            try {
              const uSnap = await getDoc(doc(db, 'users', mUid));
              if (uSnap.exists()) {
                loadedMembers.push({ uid: uSnap.id, ...uSnap.data() } as User);
              }
            } catch (e) {
              console.warn('Error loading squad member:', mUid, e);
            }
          }
          setSquadMembers(loadedMembers);
          setSelectedSquadUids(sqData.members || [user.uid]);
        } else {
          setUserSquad(null);
          setSquadMembers([]);
        }
      },
      (err) => console.warn('Squad fetch error:', err)
    );
    return () => unsubSquad();
  }, [user]);

  // Auto-select Squad join tab if tournament is Squad/Duo/Clash Squad and user has a squad
  useEffect(() => {
    if (match && userSquad && ['Squad', 'Duo', 'Clash Squad', '2v2', '3v3'].includes(match.mode)) {
      setJoinType('squad');
    }
  }, [match?.mode, userSquad?.id]);

  // Live Countdown Timer for Match Start & 15-min Room ID Reveal Window
  useEffect(() => {
    if (!match?.match_time) {
      setCountdownText('Schedule Pending');
      setRoomRevealCountdown('Room ID shared 15m before start');
      return;
    }

    const updateTimer = () => {
      const targetMs = match.match_time?.toMillis?.()
        ? match.match_time.toMillis()
        : new Date(match.match_time).getTime();

      if (!targetMs || isNaN(targetMs)) {
        setCountdownText('Upcoming');
        return;
      }

      const now = Date.now();
      const diff = targetMs - now;
      const revealDiff = targetMs - 15 * 60 * 1000 - now;

      if (diff <= 0) {
        setCountdownText('LIVE NOW');
        setRoomRevealCountdown('Room Credentials Active');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      parts.push(`${String(h).padStart(2, '0')}h`);
      parts.push(`${String(m).padStart(2, '0')}m`);
      parts.push(`${String(s).padStart(2, '0')}s`);
      setCountdownText(parts.join(' : '));

      if (revealDiff <= 0) {
        setRoomRevealCountdown('Room ID Reveal Window Open!');
      } else {
        const rh = Math.floor(revealDiff / (1000 * 60 * 60));
        const rm = Math.floor((revealDiff / (1000 * 60)) % 60);
        const rs = Math.floor((revealDiff / 1000) % 60);
        setRoomRevealCountdown(
          `Unlocks in ${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}:${String(rs).padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [match?.match_time]);

  useEffect(() => {
    if (!id) return;

    const matchRef = doc(db, 'matches', id);
    const unsubscribe = onSnapshot(
      matchRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setMatch({ id: docSnap.id, ...docSnap.data() } as Match);
        } else {
          toast.error('Match not found');
          navigate('/matches');
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Match details listener error:', err);
        setLoading(false);
      }
    );

    if (user) {
      const participantsQuery = query(
        collection(db, 'match_participants'),
        where('match_id', '==', id),
        where('user_uid', '==', user.uid)
      );
      const unsubscribeJoined = onSnapshot(
        participantsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setRegistrationStatus(data.status || 'registered');
            setParticipantDoc(data);
            if (data.status === 'pending') {
              setFfUid(data.ff_uid || '');
              setFfName(data.ff_name || '');
              setFfLevel(data.ff_level?.toString() || '');
            }
          } else {
            setRegistrationStatus('none');
            setParticipantDoc(null);
          }
        },
        (err) => {
          console.warn('Match participants listener error:', err);
        }
      );
      return () => {
        unsubscribe();
        unsubscribeJoined();
      };
    }

    return () => unsubscribe();
  }, [id, user, navigate]);

  const copyRoomValue = (value: string, field: 'id' | 'pass') => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field === 'id' ? 'Room ID' : 'Room Password'} copied!`);
  };

  const toggleSquadMember = (uid: string) => {
    setSelectedSquadUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid]
    );
  };

  const handleSoloJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !match || !id) return;

    const level = parseInt(ffLevel);
    const isIncorrect = level < 40 || !ffUid.trim() || !ffName.trim();

    setSubmitting(true);
    try {
      if (isIncorrect) {
        await setDoc(doc(db, 'match_participants', `${id}_${user.uid}`), {
          match_id: id,
          match_title: match.title,
          match_mode: match.mode,
          user_uid: user.uid,
          username: user.username,
          ff_uid: ffUid.trim(),
          ff_name: ffName.trim(),
          ff_level: level || 0,
          joined_at: serverTimestamp(),
          status: 'pending'
        });
        toast.error('Minimum Level 40 required! Saved as In-Progress.');
        return;
      }

      if (user.wallet_balance < match.entry_fee) {
        toast.error('Insufficient wallet balance');
        navigate('/wallet');
        return;
      }

      if (match.joined_players >= match.max_players) {
        toast.error('Match is full');
        return;
      }

      // 1. Deduct entry fee & increment total_matches
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        wallet_balance: increment(-match.entry_fee),
        total_matches: increment(1)
      });

      // 2. Create transaction record
      const txId = `match_entry_${id}_${user.uid}_${Date.now()}`;
      await setDoc(doc(db, 'transactions', txId), {
        user_id: user.uid,
        type: 'match_entry',
        amount: match.entry_fee,
        status: 'completed',
        created_at: serverTimestamp(),
        match_id: id,
        match_title: match.title
      });

      // 3. Add to participants as registered
      await setDoc(doc(db, 'match_participants', `${id}_${user.uid}`), {
        match_id: id,
        match_title: match.title,
        match_mode: match.mode,
        user_uid: user.uid,
        username: user.username,
        ff_uid: ffUid.trim(),
        ff_name: ffName.trim(),
        ff_level: level,
        squad_id: userSquad?.id || null,
        squad_name: userSquad?.squad_name || null,
        joined_at: serverTimestamp(),
        status: 'registered'
      });

      // 4. Increment match joined players
      await updateDoc(doc(db, 'matches', id), {
        joined_players: increment(1)
      });

      toast.success('Successfully registered for the tournament!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join match');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSquadOneClickJoin = async () => {
    if (!user || !match || !id || !userSquad) return;

    const chosenMembers = squadMembers.filter((m) => selectedSquadUids.includes(m.uid));
    if (chosenMembers.length === 0) {
      toast.error('Select at least 1 squad member to register');
      return;
    }

    const totalCost = match.entry_fee * chosenMembers.length;
    if (user.wallet_balance < totalCost) {
      toast.error(`Insufficient balance. Need ₹${totalCost} for ${chosenMembers.length} squad members.`);
      navigate('/wallet');
      return;
    }

    if (match.joined_players + chosenMembers.length > match.max_players) {
      toast.error(`Not enough slots left for ${chosenMembers.length} players`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Deduct total entry fee from squad leader/initiator wallet
      await updateDoc(doc(db, 'users', user.uid), {
        wallet_balance: increment(-totalCost)
      });

      // 2. Record transaction
      const txId = `squad_entry_${id}_${user.uid}_${Date.now()}`;
      await setDoc(doc(db, 'transactions', txId), {
        user_id: user.uid,
        type: 'match_entry',
        amount: totalCost,
        status: 'completed',
        created_at: serverTimestamp(),
        match_id: id,
        match_title: `${match.title} (Squad: ${userSquad.squad_name} • ${chosenMembers.length} Players)`
      });

      // 3. Register every selected squad member and increment their total_matches
      await Promise.all(
        chosenMembers.map(async (member) => {
          await setDoc(doc(db, 'match_participants', `${id}_${member.uid}`), {
            match_id: id,
            match_title: match.title,
            match_mode: match.mode,
            user_uid: member.uid,
            username: member.username,
            ff_uid: member.freefire_uid || member.app_uid || 'VERIFIED',
            ff_name: member.freefire_name || member.username,
            ff_level: member.freefire_level || 55,
            squad_id: userSquad.id,
            squad_name: userSquad.squad_name,
            joined_at: serverTimestamp(),
            status: 'registered'
          });

          await updateDoc(doc(db, 'users', member.uid), {
            total_matches: increment(1)
          });

          if (member.uid !== user.uid) {
            await addDoc(collection(db, 'notifications'), {
              user_uid: member.uid,
              type: 'match_update',
              message: `${user.username} registered your squad "${userSquad.squad_name}" for ${match.title}!`,
              read: false,
              created_at: serverTimestamp()
            });
          }
        })
      );

      // 4. Increment match joined_players count
      await updateDoc(doc(db, 'matches', id), {
        joined_players: increment(chosenMembers.length)
      });

      toast.success(`Squad "${userSquad.squad_name}" (${chosenMembers.length} players) registered in 1 click!`);
    } catch (error: any) {
      toast.error(error.message || 'Squad registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-primary">Loading match details...</div>;
  if (!match) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Matches
        </button>

        {/* Live Match Countdown Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Match Countdown</p>
            <p className="text-xs font-mono tabular-nums font-bold text-primary">{countdownText}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="relative h-56 bg-gradient-to-br from-primary/30 to-dark-bg overflow-hidden flex flex-col justify-end p-8">
              <img
                src={match.poster_url || getMapArtwork(match.map, match.mode)}
                alt={match.title}
                className="absolute inset-0 w-full h-full object-cover opacity-65"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/40 to-transparent" />
              <div className="relative z-10">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-bold uppercase border border-white/10">
                    {match.mode}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-primary text-xs font-bold uppercase">
                    {match.map}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-mono tabular-nums font-bold text-amber-400 border border-amber-500/30">
                    {roomRevealCountdown}
                  </span>
                </div>
                <h1 className="text-3xl font-display font-bold text-white drop-shadow-lg">{match.title}</h1>
              </div>
              {(user?.is_admin || user?.is_staff) && (
                <button
                  onClick={generateMatchBanner}
                  disabled={generatingBanner}
                  className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md text-white rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 z-20"
                  title="Generate AI Banner"
                >
                  {generatingBanner ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-white/5 font-mono tabular-nums">
              <div className="space-y-1">
                <p className="text-xs font-sans text-white/40 uppercase font-bold tracking-wider">Prize Pool</p>
                <p className="text-xl font-bold text-primary">₹{match.prize_pool}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-sans text-white/40 uppercase font-bold tracking-wider">Entry Fee</p>
                <p className="text-xl font-bold text-white">₹{match.entry_fee}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-sans text-white/40 uppercase font-bold tracking-wider">Slots Filled</p>
                <p className="text-xl font-bold text-white">{match.joined_players}/{match.max_players}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-sans text-white/40 uppercase font-bold tracking-wider">Per Kill</p>
                <p className="text-xl font-bold text-primary">₹{match.per_kill_prize || 0}</p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-white/5 bg-white/5 font-mono tabular-nums">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <div>
                  <p className="text-[10px] font-sans text-white/40 uppercase font-bold">1st Prize</p>
                  <p className="text-lg font-bold">₹{match.prize_pool_1st || match.prize_pool}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">2</div>
                <div>
                  <p className="text-[10px] font-sans text-white/40 uppercase font-bold">2nd Prize</p>
                  <p className="text-lg font-bold">₹{match.prize_pool_2nd || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">3</div>
                <div>
                  <p className="text-[10px] font-sans text-white/40 uppercase font-bold">3rd Prize</p>
                  <p className="text-lg font-bold">₹{match.prize_pool_3rd || 0}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Rules &amp; Instructions
              </h2>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex gap-2">• Room ID and Password unlock 15 minutes before the match start time with 1-click Copy buttons.</li>
                <li className="flex gap-2">• Match winnings and Per-Kill rewards are auto-credited directly to your Smart Wallet upon completion.</li>
                <li className="flex gap-2">• Ensure your Free Fire UID matches the one provided during Solo or 1-Click Squad registration.</li>
                <li className="flex gap-2">• Minimum level requirement: Level 40.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {registrationStatus === 'registered' ? (
            <div className="glass-card p-6 border-green-500/30 bg-green-500/5 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto border border-green-500/30">
                  <Trophy className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-400">You're Registered!</h3>
                {participantDoc?.squad_name && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase border border-primary/30">
                    Squad: {participantDoc.squad_name}
                  </span>
                )}
                <p className="text-xs text-white/60">
                  Slot: <span className="text-white font-mono font-bold">#{participantDoc?.slot || 'Auto-Assigning'}</span>
                </p>
              </div>

              {/* Live Countdown & Room ID Auto-Copy Panel */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Room Access</span>
                  <span className="text-[11px] font-mono tabular-nums font-bold text-amber-400">{roomRevealCountdown}</span>
                </div>

                {match.room_id ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold">Room ID</p>
                        <p className="font-mono tabular-nums font-bold text-white text-sm">{match.room_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyRoomValue(match.room_id!, 'id')}
                        className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copiedField === 'id' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'id' ? 'Copied' : 'Copy ID'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold">Password</p>
                        <p className="font-mono tabular-nums font-bold text-white text-sm">{match.room_password || 'N/A'}</p>
                      </div>
                      {match.room_password && (
                        <button
                          type="button"
                          onClick={() => copyRoomValue(match.room_password!, 'pass')}
                          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          {copiedField === 'pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === 'pass' ? 'Copied' : 'Copy Pass'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-xs font-bold text-white/70">Waiting for Official Room ID</p>
                    <p className="text-[11px] text-white/40">
                      Starts in <span className="text-primary font-mono tabular-nums font-bold">{countdownText}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Join Tournament</h3>
                {registrationStatus === 'pending' && (
                  <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase animate-pulse">
                    In Progress
                  </span>
                )}
              </div>

              {/* Mode Switcher: Solo vs 1-Click Squad */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setJoinType('solo')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    joinType === 'solo' ? 'bg-primary text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Solo Entry (1P)
                </button>
                <button
                  type="button"
                  onClick={() => setJoinType('squad')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    joinType === 'squad' ? 'bg-primary text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> 1-Click Squad
                </button>
              </div>

              {joinType === 'squad' ? (
                <div className="space-y-4">
                  {userSquad ? (
                    <>
                      <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-primary">Active Squad Roster</p>
                          <p className="font-bold text-white text-sm">{userSquad.squad_name}</p>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-white/60">
                          {selectedSquadUids.length} Selected
                        </span>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {squadMembers.map((member) => {
                          const isChecked = selectedSquadUids.includes(member.uid);
                          const vipAvatar = getVipDesignByName(member.username).avatarUrl;
                          return (
                            <button
                              key={member.uid}
                              type="button"
                              onClick={() => toggleSquadMember(member.uid)}
                              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                                isChecked
                                  ? 'bg-white/10 border-primary/50'
                                  : 'bg-white/5 border-white/10 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={member.profile_photo || member.avatar_url || vipAvatar}
                                  alt={member.username}
                                  className="w-9 h-9 rounded-lg object-cover border border-primary/30"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{member.username}</p>
                                  <p className="text-[10px] text-white/40 font-mono truncate">
                                    FF: {member.freefire_name || member.username} • Lvl {member.freefire_level || 55}
                                  </p>
                                </div>
                              </div>
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${isChecked ? 'text-primary' : 'text-white/20'}`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-white/50 font-sans">
                            Squad Entry ({selectedSquadUids.length} × ₹{match.entry_fee}):
                          </span>
                          <span className="text-base font-bold text-primary">
                            ₹{match.entry_fee * selectedSquadUids.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={submitting || selectedSquadUids.length === 0}
                          onClick={handleSquadOneClickJoin}
                          className="w-full neon-button py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Zap className="w-4 h-4" />
                          {submitting
                            ? 'Registering Squad...'
                            : `1-Click Join Squad (₹${match.entry_fee * selectedSquadUids.length})`}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                      <Users className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-sm font-bold text-white">No Squad Found</p>
                      <p className="text-xs text-white/50">
                        Create or join a 4-player Squad first to unlock 1-Click Team Registration.
                      </p>
                      <Link
                        to="/squad"
                        className="block w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider"
                      >
                        Create / Join Squad
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSoloJoin} className="space-y-4">
                  {registrationStatus === 'pending' && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-[10px] text-yellow-500 leading-relaxed">
                      Your registration is "In Progress" because of level below 40. Correct it below to join.
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-1">Free Fire UID</label>
                    <input
                      required
                      value={ffUid}
                      onChange={(e) => setFfUid(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-primary transition-all outline-none"
                      placeholder="e.g. 123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-1">In-Game Name</label>
                    <input
                      required
                      value={ffName}
                      onChange={(e) => setFfName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
                      placeholder="e.g. ShadowX_YT"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-1">Player Level</label>
                    <input
                      required
                      type="number"
                      value={ffLevel}
                      onChange={(e) => setFfLevel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-primary transition-all outline-none"
                      placeholder="e.g. 65"
                    />
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 text-sm font-mono tabular-nums">
                      <span className="text-white/40 font-sans">Entry Fee:</span>
                      <span className="font-bold">₹{match.entry_fee}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full neon-button disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : `Pay ₹${match.entry_fee} & Join Solo`}
                    </button>
                  </div>
                </form>
              )}

              <p className="text-[10px] text-center text-white/30">
                By joining, you agree to the tournament rules and fair play policy.
              </p>
            </div>
          )}

          <div className="glass-card p-4 flex items-start gap-3 bg-yellow-500/5 border-yellow-500/20">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Anti-cheat protection is active. Any suspicious activity will lead to an immediate ban and loss of winnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
