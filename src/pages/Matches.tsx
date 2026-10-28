import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Match } from '../types';
import { Trophy, Map, Users, Clock, Shield, Plane, Zap, Flame } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getMapArtwork } from '../lib/ffIndiaAssets';

const Matches: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as any) || 'all';
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Solo' | 'Duo' | 'Squad' | 'Clash Squad' | 'Lone Wolf'>(
    ['all', 'Solo', 'Duo', 'Squad', 'Clash Squad', 'Lone Wolf'].includes(initialMode) ? initialMode : 'all'
  );

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('match_time', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Match));
        setMatches(matchesData);
        setLoading(false);
      },
      (err) => {
        console.warn('Matches listener error:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredMatches =
    filter === 'all' ? matches : matches.filter((m) => m.mode === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="booyah-badge px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <Flame className="w-3 h-3" /> Free Fire India Lobbies
            </span>
            <span className="text-xs text-white/50 font-mono tabular-nums">
              Yotta IND 18ms · Instant Auto-Payout
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wide">
            Official <span className="text-primary">Tournaments</span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {(['all', 'Solo', 'Duo', 'Squad', 'Clash Squad', 'Lone Wolf'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f
                  ? 'booyah-badge shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Modes' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Quick LAN Qualification Banner */}
      <div className="hud-card p-5 tiranga-ribbon flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-primary/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-display font-bold uppercase tracking-widest text-amber-300">
                Monthly India LAN Qualifier Active
              </span>
              <span className="text-white/30">·</span>
              <span className="text-emerald-400 font-bold uppercase">
                100% Sponsored Flights &amp; 5-Star Stay
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              Every Booyah &amp; Kill point counts toward the 4 Monthly Offline LAN Championships!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-sans text-white/40 uppercase">Your Booyahs</p>
            <p className="text-sm font-bold text-amber-400">{user?.total_wins || 0} Wins</p>
          </div>
          <Link
            to="/squad"
            className="px-4 py-2.5 rounded-xl bg-black/60 hover:bg-primary hover:text-black border border-amber-500/30 text-xs font-display font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 1-Click Squad Setup
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hud-card h-72 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const cardArtwork = match.poster_url || getMapArtwork(match.map, match.mode);
            const fillPercent = Math.min(
              100,
              Math.round(((match.joined_players || 0) / (match.max_players || 48)) * 100)
            );
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hud-card overflow-hidden group hover:border-amber-400/60 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={cardArtwork}
                    alt={match.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E15] via-[#0B0E15]/35 to-transparent" />

                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-[10px] font-display font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                      {match.mode} · {match.map}
                    </span>
                    <span className="booyah-badge px-2.5 py-1 rounded text-xs font-mono tabular-nums">
                      ₹{match.prize_pool}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide drop-shadow-lg truncate">
                      {match.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                    <div className="flex items-center gap-2 text-white/65 font-sans">
                      <Map className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{match.map}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/65">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {match.joined_players}/{match.max_players} Slots
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/65">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {match.match_time?.toDate?.() ? (
                          <>
                            {new Date(match.match_time.toDate()).toLocaleDateString()} ·{' '}
                            {new Date(match.match_time.toDate()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : (
                          'Upcoming'
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/65">
                      <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Entry: ₹{match.entry_fee}</span>
                    </div>
                  </div>

                  {/* Tactical Slot Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono tabular-nums text-white/45">
                      <span>Lobby Capacity</span>
                      <span>{fillPercent}% Full</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-amber-400"
                        style={{ width: `${Math.max(8, fillPercent)}%` }}
                      />
                    </div>
                  </div>

                  {match.per_kill_prize && match.per_kill_prize > 0 ? (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono tabular-nums text-emerald-400">
                      <span className="flex items-center gap-1.5 font-sans font-semibold">
                        <Shield className="w-3.5 h-3.5" /> Per-Kill Bounty
                      </span>
                      <span className="font-bold">+₹{match.per_kill_prize} / Elimination</span>
                    </div>
                  ) : null}

                  <Link
                    to={`/match/${match.id}`}
                    className="neon-button block w-full text-center py-3 text-xs"
                  >
                    Enter Lobby (Solo / 1-Click Squad)
                  </Link>
                </div>
              </motion.div>
            );
          })}

          {filteredMatches.length === 0 && (
            <div className="col-span-full py-20 text-center hud-card">
              <p className="text-white/50 font-display text-lg uppercase">
                No tournaments available for this mode right now.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Matches;
