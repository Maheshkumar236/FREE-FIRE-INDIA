import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Megaphone, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Latest <span className="text-primary">Announcements</span></h1>
        <p className="text-white/40">Stay updated with the latest news and tournament updates.</p>
      </div>

      <div className="space-y-6">
        {announcements.map((ann, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={ann.id}
            className="glass-card p-8 border-l-4 border-l-primary hover:bg-white/5 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{ann.title}</h3>
                  <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
                    <Calendar className="w-3 h-3" />
                    {ann.created_at?.toDate?.() ? ann.created_at.toDate().toLocaleDateString() : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-white/60 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
          </motion.div>
        ))}

        {announcements.length === 0 && (
          <div className="glass-card p-12 text-center text-white/40">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No announcements yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
