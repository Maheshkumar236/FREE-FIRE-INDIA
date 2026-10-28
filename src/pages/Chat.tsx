import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, getDoc, limit, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Send, ChevronLeft, Shield, MoreVertical, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface ChatMessage {
  id: string;
  sender_uid: string;
  text: string;
  timestamp: any;
  read: boolean;
}

const Chat: React.FC = () => {
  const { id: friendUid } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendUid || !user) return;

    const fetchFriend = async () => {
      const friendDoc = await getDoc(doc(db, 'users', friendUid));
      if (friendDoc.exists()) {
        setFriend({ uid: friendDoc.id, ...friendDoc.data() } as User);
      }
      setLoading(false);
    };
    fetchFriend();

    const id = user.uid < friendUid ? `${user.uid}_${friendUid}` : `${friendUid}_${user.uid}`;
    setChatId(id);

    const q = query(
      collection(db, 'chats', id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);

      // Mark unread messages from friend as read
      const unreadMessages = snapshot.docs.filter(msgDoc => {
        const data = msgDoc.data();
        return data.sender_uid === friendUid && !data.read;
      });

      if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach(msgDoc => {
          batch.update(doc(db, 'chats', id, 'messages', msgDoc.id), { read: true });
        });
        batch.commit();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [friendUid, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !friendUid) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        sender_uid: user.uid,
        text: text,
        timestamp: serverTimestamp(),
        read: false
      });

      // Send a notification to the friend
      await addDoc(collection(db, 'notifications'), {
        user_uid: friendUid,
        type: 'system_alert',
        message: `New message from ${user.username}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        read: false,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) return <div className="p-20 text-center text-primary animate-pulse">Initializing Secure Chat...</div>;
  if (!friend) return <div className="p-20 text-center text-white/40">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col gap-4 relative">
      {/* Chat Header */}
      <div className="glass-card p-4 flex items-center justify-between bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${friend.uid}`)}>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 overflow-hidden">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                friend.username[0].toUpperCase()
              )}
            </div>
            <div>
              <h2 className="font-bold leading-tight flex items-center gap-2">
                {friend.username}
                {friend.is_admin && <Shield className="w-3 h-3 text-primary" />}
              </h2>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Active Now
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><Info className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="p-4 bg-white/5 rounded-full">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold">No messages yet</p>
                <p className="text-xs">Start the conversation with {friend.username}</p>
              </div>
            </div>
          )}
          {messages.map((msg, index) => {
            const isOwn = msg.sender_uid === user?.uid;
            const showTime = index === messages.length - 1 || 
              (messages[index + 1] && messages[index + 1].sender_uid !== msg.sender_uid);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[75%]">
                  <div className={`px-4 py-3 rounded-2xl text-sm shadow-lg ${
                    isOwn 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                  {showTime && (
                    <div className={`text-[8px] mt-1.5 font-bold uppercase tracking-widest flex items-center gap-1 ${isOwn ? 'justify-end text-white/40' : 'text-white/20'}`}>
                      {msg.timestamp?.toDate?.() ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      {isOwn && (
                        <span className={msg.read ? 'text-primary' : 'text-white/20'}>
                          {msg.read ? 'Read' : 'Sent'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${friend.username}...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-primary transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-4 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,107,0,0.3)]"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
