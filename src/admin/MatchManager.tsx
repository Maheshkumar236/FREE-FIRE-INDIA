import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Match } from '../types';
import { Trophy, Plus, Edit2, Trash2, Clock, Map, Users, Shield, Save, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { getMapArtwork } from '../lib/ffIndiaAssets';

const MatchManager: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState('10');
  const [prizePool, setPrizePool] = useState('100');
  const [prize1st, setPrize1st] = useState('50');
  const [prize2nd, setPrize2nd] = useState('30');
  const [prize3rd, setPrize3rd] = useState('20');
  const [perKill, setPerKill] = useState('2');
  const [map, setMap] = useState<'Bermuda' | 'Kalahari' | 'Purgatory' | 'Alpine'>('Bermuda');
  const [mode, setMode] = useState<'Solo' | 'Duo' | 'Squad' | 'Clash Squad' | 'Lone Wolf' | '1v1' | '2v2' | '3v3'>('Solo');
  const [matchTime, setMatchTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('48');
  const [posterUrl, setPosterUrl] = useState('');

  const startEdit = (match: Match) => {
    setEditingMatch(match);
    setTitle(match.title);
    setDescription(match.description || '');
    setEntryFee(match.entry_fee.toString());
    setPrizePool(match.prize_pool.toString());
    setPrize1st(match.prize_pool_1st?.toString() || '');
    setPrize2nd(match.prize_pool_2nd?.toString() || '');
    setPrize3rd(match.prize_pool_3rd?.toString() || '');
    setPerKill(match.per_kill_prize?.toString() || '');
    setMap(match.map);
    setMode(match.mode);
    setMatchTime(match.match_time?.toDate ? match.match_time.toDate().toISOString().slice(0, 16) : '');
    setMaxPlayers(match.max_players.toString());
    setPosterUrl(match.poster_url || '');
    setIsAdding(true);
  };

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('match_time', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });
    return () => unsubscribe();
  }, []);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const generatePoster = async () => {
    if (!title || !prizePool || !map || !mode) {
      toast.error('Please fill in Match Name, Prize Pool, Map, and Mode first');
      return;
    }
    setGeneratingPoster(true);
    try {
      const mapArt = getMapArtwork(map, mode);
      setPosterUrl(mapArt);
      toast.success(`Equipped ${map} (${mode}) Free Fire India Arena Poster!`);
    } finally {
      setGeneratingPoster(false);
    }
  };

  const generateDescription = async () => {
    if (!title || !map || !mode) {
      toast.error('Please fill in Match Name, Map, and Mode first');
      return;
    }
    setGeneratingDescription(true);
    try {
      const prompt = `Write an exciting, high-energy description for a Free Fire India tournament match named "${title}". Map: ${map}. Mode: ${mode}. Prize Pool: ₹${prizePool}. Keep it under 3 sentences.`;
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.text) {
        setDescription(data.text);
        toast.success('Description generated!');
      }
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleCreateOrUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const matchData = {
        title,
        entry_fee: parseFloat(entryFee) || 0,
        prize_pool: parseFloat(prizePool) || 0,
        prize_pool_1st: prize1st ? parseFloat(prize1st) : null,
        prize_pool_2nd: prize2nd ? parseFloat(prize2nd) : null,
        prize_pool_3rd: prize3rd ? parseFloat(prize3rd) : null,
        per_kill_prize: perKill ? parseFloat(perKill) : null,
        map,
        mode,
        match_time: matchTime ? new Date(matchTime) : null,
        description: description || null,
        max_players: parseInt(maxPlayers) || 48,
        joined_players: editingMatch ? editingMatch.joined_players : 0,
        status: editingMatch ? editingMatch.status : 'upcoming',
        poster_url: posterUrl || null,
        updated_at: serverTimestamp()
      };

      if (editingMatch) {
        await updateDoc(doc(db, 'matches', editingMatch.id), matchData);
        toast.success('Match updated successfully!');
      } else {
        await addDoc(collection(db, 'matches'), { ...matchData, created_at: serverTimestamp() });
        toast.success('Match created successfully!');
      }
      setIsAdding(false);
      resetForm();
      setEditingMatch(null);
    } catch (error) {
      toast.error('Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setEntryFee('10');
    setPrizePool('100');
    setPrize1st('50');
    setPrize2nd('30');
    setPrize3rd('20');
    setPerKill('2');
    setMatchTime('');
    setPosterUrl('');
  };

  const deleteMatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'matches', id));
      setConfirmDeleteId(null);
      toast.success('Match deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Manage <span className="text-primary">Matches</span></h1>
          <p className="text-white/40">Create and monitor tournaments</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="neon-button flex items-center gap-2"
        >
          {isAdding ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create Match</>}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-8 overflow-hidden"
          >
            <form onSubmit={handleCreateOrUpdateMatch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Match Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Solo Bermuda ₹100 Prize"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-white/40 uppercase block">Match Description</label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={generatingDescription}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {generatingDescription ? <><Sparkles className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> Generate with Gemini AI</>}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter match description..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all h-24"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Match Time</label>
                <input
                  required
                  type="datetime-local"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Entry Fee (₹)</label>
                <input
                  required
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Prize Pool (₹)</label>
                <input
                  required
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">1st Prize (₹)</label>
                <input
                  required
                  type="number"
                  value={prize1st}
                  onChange={(e) => setPrize1st(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">2nd Prize (₹)</label>
                <input
                  required
                  type="number"
                  value={prize2nd}
                  onChange={(e) => setPrize2nd(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">3rd Prize (₹)</label>
                <input
                  required
                  type="number"
                  value={prize3rd}
                  onChange={(e) => setPrize3rd(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Per Kill Prize (₹)</label>
                <input
                  required
                  type="number"
                  value={perKill}
                  onChange={(e) => setPerKill(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Max Players</label>
                <input
                  required
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Map</label>
                <select
                  value={map}
                  onChange={(e) => setMap(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                >
                  <option value="Bermuda">Bermuda</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Alpine">Alpine</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all"
                >
                  <option value="Solo">Solo</option>
                  <option value="Duo">Duo</option>
                  <option value="Squad">Squad</option>
                  <option value="Clash Squad">Clash Squad</option>
                  <option value="Lone Wolf">Lone Wolf</option>
                </select>
              </div>
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/40 uppercase block">Match Poster</label>
                  <button
                    type="button"
                    onClick={generatePoster}
                    disabled={generatingPoster}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {generatingPoster ? <><Sparkles className="w-3 h-3 animate-spin" /> Generating...</> : <><Sparkles className="w-3 h-3" /> Generate with Gemini AI</>}
                  </button>
                </div>
                {posterUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                    <img src={posterUrl} alt="Match Poster" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setPosterUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-white/20 gap-2">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs font-bold">No poster generated yet</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="neon-button w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating...' : <><Save className="w-4 h-4" /> Save Tournament</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">Match Info</th>
                <th className="px-6 py-4">Mode/Map</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {matches.map((match) => (
                <tr key={match.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold">{match.title}</p>
                    <p className="text-xs text-white/40">{match.match_time?.toDate?.() ? new Date(match.match_time.toDate()).toLocaleString() : 'Pending'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase mr-2">{match.mode}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase">{match.map}</span>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {match.joined_players}/{match.max_players}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      match.status === 'upcoming' ? 'bg-blue-500/20 text-blue-500' :
                      match.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {match.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link to={`/admin/match/${match.id}`} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-primary transition-all">
                        <Shield className="w-4 h-4" />
                      </Link>
                      <button onClick={() => startEdit(match)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === match.id ? (
                        <button
                          onClick={() => deleteMatch(match.id)}
                          className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(match.id)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchManager;
