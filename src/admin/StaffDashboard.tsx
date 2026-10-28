import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Match } from '../types';
import { Trophy, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffDashboard: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });
    return () => unsubscribe();
  }, []);

  const categories = ['Solo', 'Duo', 'Squad', 'Clash Squad', 'Lone Wolf'];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold">Staff <span className="text-primary">Panel</span></h1>
      
      {categories.map(category => {
        const categoryMatches = matches.filter(m => m.mode === category);
        if (categoryMatches.length === 0) return null;
        
        return (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-white/60">{category} Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryMatches.map((match, index) => (
                <Link to={`/admin/match/${match.id}`} key={match.id} className="glass-card p-6 hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Trophy className="w-6 h-6 text-primary" />
                    <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded">Room {index + 1}</span>
                  </div>
                  <p className="font-bold truncate">{match.title}</p>
                  <p className="text-xs text-white/40">{match.joined_players}/{match.max_players} Players</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StaffDashboard;
