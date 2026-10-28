import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Megaphone, Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const AnnouncementsManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        message,
        created_at: serverTimestamp(),
      });
      toast.success('Announcement posted!');
      setTitle('');
      setMessage('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Manage <span className="text-primary">Announcements</span></h1>
          <p className="text-white/40">Post news and updates for all users</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="neon-button flex items-center gap-2"
        >
          {isAdding ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Announcement</>}
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
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Tournament Tonight!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe the update..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full neon-button flex items-center justify-center gap-2"
              >
                {loading ? 'Posting...' : <><Save className="w-4 h-4" /> Post Announcement</>}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {announcements.map((ann) => (
          <div key={ann.id} className="glass-card p-6 flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">{ann.title}</h3>
              <p className="text-sm text-white/60">{ann.message}</p>
              <p className="text-[10px] text-white/20 uppercase tracking-widest">
                {ann.created_at?.toDate?.() ? ann.created_at.toDate().toLocaleString() : 'Pending'}
              </p>
            </div>
            <button
              onClick={() => handleDelete(ann.id)}
              className="p-2 text-white/20 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsManager;
