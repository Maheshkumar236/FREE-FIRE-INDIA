import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User } from '../types';
import { Trophy, TrendingUp, Medal, Star, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<User[]>([]);
  const [category, setCategory] = useState<'wins' | 'matches' | 'earnings'>('wins');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all-time'>('all-time');

  useEffect(() => {
    const field = category === 'wins' ? 'total_wins' : category === 'matches' ? 'total_matches' : 'winnings';
    const q = query(collection(db, 'users'), orderBy(field, 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    });

    return () => unsubscribe();
  }, [category, timeframe]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Global <span className="text-primary">Leaderboard</span></h1>
          <p className="text-white/40">Top performing players across ELITESTAR</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
            {(['wins', 'matches', 'earnings'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  category === cat ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
            {(['daily', 'weekly', 'all-time'] as const).map((time) => (
              <button
                key={time}
                onClick={() => setTimeframe(time)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  timeframe === time ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12">
        {players.slice(0, 3).map((player, index) => {
          const order = index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3';
          const height = index === 0 ? 'h-64' : index === 1 ? 'h-52' : 'h-44';
          const medalColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600';
          
          return (
            <motion.div
              key={player.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col items-center ${order}`}
            >
              <div className="relative mb-4">
                <div className={`w-20 h-20 rounded-3xl bg-white/5 border-2 ${index === 0 ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-white/10'} flex items-center justify-center overflow-hidden`}>
                  {player.profile_photo ? (
                    <img src={player.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white/40">{player.username[0].toUpperCase()}</span>
                  )}
                </div>
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-dark-bg border-2 border-white/10 flex items-center justify-center ${medalColor}`}>
                  <Medal className="w-4 h-4" />
                </div>
              </div>
              <div className={`w-full ${height} glass-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                {index === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>}
                <p className="font-bold text-lg mb-1 truncate w-full">{player.username}</p>
                <p className="text-primary font-display font-bold text-2xl">
                  {category === 'wins' ? player.total_wins : category === 'matches' ? player.total_matches : `₹${player.winnings}`}
                </p>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">{category}</p>
                <div className="mt-4 text-xs font-bold text-white/20">RANK #{index + 1}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* List View */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Player</th>
                <th className="px-8 py-6">Matches</th>
                <th className="px-8 py-6">Wins</th>
                <th className="px-8 py-6">Earnings</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody>
              {players.slice(3).map((player, index) => (
                <tr key={player.uid} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="font-display font-bold text-white/20 text-lg italic">#{index + 4}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 font-bold">
                        {player.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{player.username}</p>
                        <p className="text-[10px] text-white/30 font-mono">UID: {player.app_uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-white/60 font-medium">{player.total_matches}</td>
                  <td className="px-8 py-4 text-primary font-bold">{player.total_wins}</td>
                  <td className="px-8 py-4 text-green-500 font-bold">₹{player.winnings}</td>
                  <td className="px-8 py-4">
                    <Link to={`/profile/${player.uid}`} className="p-2 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
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

export default Leaderboard;
