import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, query, where, onSnapshot, updateDoc, serverTimestamp, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Match } from '../types';
import { Shield, Users, AlertTriangle, CheckCircle, Send, Plus, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RoomControl: React.FC = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [killInputs, setKillInputs] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmWinnerKey, setConfirmWinnerKey] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const matchRef = doc(db, 'matches', matchId);
    const unsubscribeMatch = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMatch({ id: docSnap.id, ...data } as Match);
        if (data.room_id) setRoomId(data.room_id);
        if (data.room_password) setRoomPassword(data.room_password);
      }
      setLoading(false);
    });

    const pQuery = query(collection(db, 'match_participants'), where('match_id', '==', matchId));
    const unsubscribeP = onSnapshot(pQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.slot || 999) - (b.slot || 999));
      setParticipants(list);
    });

    return () => {
      unsubscribeMatch();
      unsubscribeP();
    };
  }, [matchId]);

  const handleUpdateRoom = async () => {
    if (!matchId || !roomId.trim() || !roomPassword.trim()) {
      toast.error('Please enter both Room ID and Password');
      return;
    }

    if (!currentUser?.is_staff && !currentUser?.is_admin) {
      await updateDoc(doc(db, 'users', currentUser!.uid), { is_banned: true });
      toast.error("Security Breach Detected. Account Blocked.");
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        room_id: roomId.trim(),
        room_password: roomPassword.trim(),
        status: 'ongoing'
      });

      await Promise.all(
        participants.map((p) =>
          addDoc(collection(db, 'notifications'), {
            user_uid: p.user_uid,
            type: 'match_update',
            message: `Room ID: ${roomId.trim()} | Password: ${roomPassword.trim()} for match ${match?.title}. Your Slot: ${p.slot || 'Assigned'}`,
            read: false,
            created_at: serverTimestamp()
          })
        )
      );

      toast.success('Room details announced and all players notified!');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleAutoSlot = async () => {
    if (!matchId || participants.length === 0) return;

    if (!currentUser?.is_staff && !currentUser?.is_admin) {
      await updateDoc(doc(db, 'users', currentUser!.uid), { is_banned: true });
      toast.error("Security Breach Detected. Account Blocked.");
      return;
    }

    try {
      const sortedParticipants = [...participants].sort((a, b) =>
        (a.joined_at?.toMillis?.() || 0) - (b.joined_at?.toMillis?.() || 0)
      );

      for (let i = 0; i < sortedParticipants.length; i++) {
        const p = sortedParticipants[i];
        await updateDoc(doc(db, 'match_participants', p.id), {
          slot: i + 1
        });
      }
      toast.success('Slots assigned automatically!');
    } catch (error) {
      toast.error('Slot assignment failed');
    }
  };

  const handleCancelMatch = async () => {
    if (!matchId) return;

    if (!currentUser?.is_staff && !currentUser?.is_admin) {
      await updateDoc(doc(db, 'users', currentUser!.uid), { is_banned: true });
      toast.error("Security Breach Detected. Account Blocked.");
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), { status: 'cancelled' });

      await Promise.all(
        participants.map(async (p) => {
          if (match && match.entry_fee > 0) {
            await updateDoc(doc(db, 'users', p.user_uid), {
              wallet_balance: increment(match.entry_fee)
            });
            await addDoc(collection(db, 'transactions'), {
              user_id: p.user_uid,
              type: 'deposit',
              amount: match.entry_fee,
              status: 'completed',
              created_at: serverTimestamp(),
              note: `Refund: ${match.title} Cancelled`
            });
          }
          await addDoc(collection(db, 'notifications'), {
            user_uid: p.user_uid,
            type: 'match_update',
            message: `Match "${match?.title}" was cancelled. Entry fee ₹${match?.entry_fee || 0} has been refunded to your wallet.`,
            read: false,
            created_at: serverTimestamp()
          });
        })
      );

      toast.success('Match cancelled and all players refunded');
      setConfirmCancel(false);
      navigate('/admin/matches');
    } catch (error) {
      toast.error('Cancellation failed');
    }
  };

  const handleSetResults = async (participant: any, position: 1 | 2 | 3) => {
    if (!matchId) return;
    const posText = position === 1 ? '1st' : position === 2 ? '2nd' : '3rd';
    const winnerUid = participant.user_uid;

    if (!currentUser?.is_staff && !currentUser?.is_admin) {
      await updateDoc(doc(db, 'users', currentUser!.uid), { is_banned: true });
      toast.error("Security Breach Detected. Account Blocked.");
      return;
    }

    try {
      let prize = 0;
      if (position === 1) prize = match?.prize_pool_1st || match?.prize_pool || 0;
      else if (position === 2) prize = match?.prize_pool_2nd || 0;
      else if (position === 3) prize = match?.prize_pool_3rd || 0;

      // 1. Update match status if 1st place
      if (position === 1) {
        await updateDoc(doc(db, 'matches', matchId), {
          status: 'completed',
          winner_uid: winnerUid
        });
      }

      // 2. Update participant record with placement & prize won
      await updateDoc(doc(db, 'match_participants', participant.id), {
        placement: position,
        prize_won: increment(prize),
        result_declared: true
      });

      // 3. Auto-payout to winner's wallet and increment wins
      await updateDoc(doc(db, 'users', winnerUid), {
        wallet_balance: increment(prize),
        winnings: increment(prize),
        total_wins: position === 1 ? increment(1) : increment(0)
      });

      // 4. Create completed prize transaction
      await addDoc(collection(db, 'transactions'), {
        user_id: winnerUid,
        type: 'match_win',
        amount: prize,
        status: 'completed',
        created_at: serverTimestamp(),
        match_id: matchId,
        match_title: `${match?.title} (${posText} Place)`
      });

      // 5. Notify winner
      await addDoc(collection(db, 'notifications'), {
        user_uid: winnerUid,
        type: 'match_update',
        message: `Congratulations! You secured ${posText} place in ${match?.title} and ₹${prize} was auto-credited to your wallet.`,
        read: false,
        created_at: serverTimestamp()
      });

      setConfirmWinnerKey(null);
      toast.success(`${posText} Winner (${participant.username}) paid ₹${prize} automatically!`);
    } catch (error) {
      toast.error('Failed to declare result');
    }
  };

  const handleAddKillPrize = async (p: any, kills: number) => {
    if (!matchId || isNaN(kills) || kills <= 0) {
      toast.error('Enter valid kills greater than 0');
      return;
    }

    if (!currentUser?.is_staff && !currentUser?.is_admin) {
      await updateDoc(doc(db, 'users', currentUser!.uid), { is_banned: true });
      toast.error("Security Breach Detected. Account Blocked.");
      return;
    }

    try {
      const perKillAmount = match?.per_kill_prize || 0;
      const totalKillPrize = kills * perKillAmount;

      // 1. Update participant kills & prize_won
      await updateDoc(doc(db, 'match_participants', p.id), {
        kills: kills,
        prize_won: increment(totalKillPrize),
        kill_prize_added: true
      });

      // 2. Pay user if kill prize > 0
      if (totalKillPrize > 0) {
        await updateDoc(doc(db, 'users', p.user_uid), {
          wallet_balance: increment(totalKillPrize),
          winnings: increment(totalKillPrize)
        });

        await addDoc(collection(db, 'transactions'), {
          user_id: p.user_uid,
          type: 'match_win',
          amount: totalKillPrize,
          status: 'completed',
          created_at: serverTimestamp(),
          match_id: matchId,
          match_title: `${match?.title} (${kills} Kills)`
        });

        await addDoc(collection(db, 'notifications'), {
          user_uid: p.user_uid,
          type: 'match_update',
          message: `₹${totalKillPrize} auto-credited to your wallet for ${kills} kills in ${match?.title}.`,
          read: false,
          created_at: serverTimestamp()
        });
      }

      toast.success(`${kills} kills recorded & ₹${totalKillPrize} credited to ${p.username}!`);
    } catch (error) {
      toast.error('Failed to add kill prize');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading room control...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Match <span className="text-primary">Room Control</span></h1>
          <p className="text-white/40">{match?.title} • <span className="uppercase text-primary font-bold text-xs">{match?.mode}</span></p>
        </div>

        {confirmCancel ? (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 p-2 rounded-xl">
            <span className="text-xs text-red-400 font-bold px-2">Refund all &amp; cancel?</span>
            <button
              onClick={handleCancelMatch}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
            >
              Confirm Cancel
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg text-xs font-bold hover:bg-white/20 transition-all"
            >
              Back
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={match?.status === 'cancelled'}
            className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <AlertTriangle className="w-4 h-4" /> Cancel Match &amp; Refund
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Room Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Room ID</label>
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono tabular-nums focus:border-primary transition-all outline-none"
                  placeholder="e.g. 83492104"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Password</label>
                <input
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono tabular-nums focus:border-primary transition-all outline-none"
                  placeholder="e.g. 7291"
                />
              </div>
              <button onClick={handleUpdateRoom} className="w-full neon-button py-2.5 text-sm flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Announce Room to Players
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold">Match Stats &amp; Auto-Payouts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Joined</p>
                <p className="text-xl font-bold font-mono tabular-nums">{participants.length}/{match?.max_players || 48}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase">Prize Pool</p>
                <p className="text-xl font-bold font-mono tabular-nums text-primary">₹{match?.prize_pool}</p>
              </div>
            </div>
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2 font-mono tabular-nums">
              <p className="text-[10px] text-primary uppercase font-sans font-bold">Instant Auto-Payout Schedule</p>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">1st Place:</span>
                <span className="font-bold">₹{match?.prize_pool_1st || match?.prize_pool}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">2nd Place:</span>
                <span className="font-bold">₹{match?.prize_pool_2nd || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">3rd Place:</span>
                <span className="font-bold">₹{match?.prize_pool_3rd || 0}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-white/40">Per Kill:</span>
                <span className="font-bold text-primary">₹{match?.per_kill_prize || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Registered Roster
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleAutoSlot}
                className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Auto Assign Slots
              </button>
              <span className="text-xs text-white/40 font-mono tabular-nums">{participants.length} Players</span>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <th className="px-6 py-4">Slot</th>
                    <th className="px-6 py-4">Player &amp; Squad Info</th>
                    <th className="px-6 py-4">Kills &amp; Bonus</th>
                    <th className="px-6 py-4">Declare Rank (Auto-Pay)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold font-mono tabular-nums text-primary">
                          {p.slot || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold">{p.username}</p>
                          {p.squad_name && (
                            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold uppercase border border-primary/30">
                              Squad: {p.squad_name}
                            </span>
                          )}
                          {p.placement && (
                            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[9px] font-bold uppercase flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" /> #{p.placement}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50">FF Name: <span className="text-white/80">{p.ff_name || 'N/A'}</span></p>
                        <p className="text-[10px] text-white/40 font-mono tabular-nums">FF UID: {p.ff_uid || 'N/A'} • Lvl {p.ff_level || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={killInputs[p.id] !== undefined ? killInputs[p.id] : (p.kills ?? '')}
                            onChange={(e) => setKillInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="0"
                            disabled={p.kill_prize_added}
                            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono tabular-nums focus:border-primary outline-none"
                          />
                          {!p.kill_prize_added ? (
                            <button
                              onClick={() => handleAddKillPrize(p, parseInt(killInputs[p.id] || '0'))}
                              className="px-2.5 py-1 bg-primary/15 text-primary border border-primary/30 rounded-lg hover:bg-primary/25 transition-all text-[10px] font-bold flex items-center gap-1"
                              title="Record Kills & Auto-Pay Kill Prize"
                            >
                              <Plus className="w-3 h-3" /> Pay
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Paid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {([1, 2, 3] as const).map((pos) => {
                            const key = `${p.id}_${pos}`;
                            const isConfirming = confirmWinnerKey === key;
                            const isAlreadyPlaced = p.placement === pos;
                            return isConfirming ? (
                              <button
                                key={pos}
                                onClick={() => handleSetResults(p, pos)}
                                className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold uppercase animate-pulse"
                              >
                                Confirm #{pos}
                              </button>
                            ) : (
                              <button
                                key={pos}
                                onClick={() => setConfirmWinnerKey(key)}
                                disabled={Boolean(p.placement)}
                                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase border ${
                                  isAlreadyPlaced
                                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                    : pos === 1
                                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                } disabled:opacity-50`}
                              >
                                {isAlreadyPlaced ? `✓ #${pos}` : `${pos === 1 ? '1st' : pos === 2 ? '2nd' : '3rd'}`}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/40">No players joined yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomControl;
