import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Send, Clock, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const Support: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'support_tickets'),
      where('user_uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        list.sort((a, b) => {
          const tA = a.created_at?.toMillis?.() || 0;
          const tB = b.created_at?.toMillis?.() || 0;
          return tB - tA;
        });
        setTickets(list);
      },
      (err) => {
        console.warn('Support tickets listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        user_uid: user.uid,
        username: user.username,
        message: message,
        status: 'open',
        created_at: serverTimestamp(),
      });
      setMessage('');
      setShowNewTicket(false);
      toast.success('Support ticket created! We will get back to you soon.');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Customer <span className="text-primary">Support</span></h1>
          <p className="text-white/40">Need help? Create a ticket or contact us directly.</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="neon-button flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Direct Contact
            </h3>
            <div className="space-y-3">
              <a href="https://wa.me/918542000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-all group">
                <div className="p-2 bg-green-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">WhatsApp</p>
                  <p className="text-[10px] text-white/40">Instant Support</p>
                </div>
              </a>
              <a href="https://t.me/elitestar" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all group">
                <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Telegram</p>
                  <p className="text-[10px] text-white/40">Community Channel</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> My Tickets
          </h2>
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ticket.status === 'open' ? 'bg-blue-500/20 text-blue-500' :
                    ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {ticket.created_at?.toDate?.() ? ticket.created_at.toDate().toLocaleString() : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-white/80">{ticket.message}</p>
                {ticket.admin_reply && (
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Admin Reply</p>
                    <p className="text-sm text-white/90">{ticket.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="glass-card p-12 text-center text-white/40">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No support tickets yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNewTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Create Support Ticket</h3>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-2">Describe your issue</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none resize-none"
                    placeholder="e.g. My deposit is not reflecting in my wallet..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="flex-1 neon-button py-3 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;
