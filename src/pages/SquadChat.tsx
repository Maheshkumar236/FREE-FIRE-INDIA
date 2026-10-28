import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Send, Users, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

const SquadChat: React.FC = () => {
  const { id: squadId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [squad, setSquad] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!squadId) return;

    const fetchSquad = async () => {
      const docSnap = await getDoc(doc(db, 'squads', squadId));
      if (docSnap.exists()) {
        setSquad({ id: docSnap.id, ...docSnap.data() });
      }
    };
    fetchSquad();

    const q = query(
      collection(db, 'squad_chats', squadId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [squadId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !squadId) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'squad_chats', squadId, 'messages'), {
        sender_uid: user.uid,
        sender_name: user.username,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col glass-card overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/squad')} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-display font-bold">{squad?.squad_name || 'Squad'} <span className="text-primary">Chat</span></h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Team Communication</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, x: msg.sender_uid === user?.uid ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={msg.id}
            className={`flex flex-col ${msg.sender_uid === user?.uid ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.sender_uid === user?.uid 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'
            }`}>
              {msg.sender_uid !== user?.uid && (
                <p className="text-[10px] font-bold text-primary mb-1">{msg.sender_name}</p>
              )}
              <p className="text-sm">{msg.text}</p>
            </div>
            <span className="text-[8px] text-white/20 mt-1">
              {msg.timestamp?.toDate?.() ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </span>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message your squad..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-primary transition-all outline-none"
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="p-2 bg-primary text-white rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default SquadChat;
