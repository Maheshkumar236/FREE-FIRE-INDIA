import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { MessageSquare, CheckCircle, Clock, Send, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'support_tickets'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        admin_reply: reply,
        status: 'closed',
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: selectedTicket.user_uid,
        type: 'system_alert',
        message: `Your support ticket has been answered: "${reply.slice(0, 50)}..."`,
        read: false,
        created_at: serverTimestamp(),
      });

      toast.success('Reply sent and ticket closed');
      setReply('');
      setSelectedTicket(null);
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Support <span className="text-primary">Tickets</span></h1>
        <p className="text-white/40">Review and respond to user issues</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold">{ticket.username}</td>
                  <td className="px-6 py-4 max-w-xs truncate text-white/60">{ticket.message}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ticket.status === 'open' ? 'bg-blue-500/20 text-blue-500' :
                      ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/30 text-xs">
                    {ticket.created_at?.toDate?.() ? ticket.created_at.toDate().toLocaleString() : 'Pending'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">No tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Reply to {selectedTicket.username}</h3>
                <button onClick={() => setSelectedTicket(null)} className="text-white/40 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs font-bold text-white/40 uppercase mb-2">User Message</p>
                <p className="text-sm text-white/80">{selectedTicket.message}</p>
              </div>

              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-2">Your Reply</label>
                  <textarea
                    required
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none resize-none"
                    placeholder="Type your response..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !reply.trim()}
                  className="w-full neon-button py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Reply & Close Ticket</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;
