import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { MessageSquare, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface ChatPreview {
  friend: User;
  lastMessage?: string;
  unreadCount: number;
  lastTimestamp?: any;
}

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    const friendsQuery = query(collection(db, 'friends'), where('user_uid', '==', user.uid));
    
    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({
        uid: doc.data().friend_uid,
        username: doc.data().friend_username
      }));

      // Initialize chats state with basic info
      const initialChats: ChatPreview[] = friendsList.map(f => ({
        friend: { uid: f.uid, username: f.username } as User,
        unreadCount: 0
      }));
      setChats(initialChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time listeners for each chat's metadata
  useEffect(() => {
    if (!user || chats.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    chats.forEach((chat, index) => {
      const friendUid = chat.friend.uid;
      const chatId = user.uid < friendUid ? `${user.uid}_${friendUid}` : `${friendUid}_${user.uid}`;
      
      // Listener for friend's profile data
      const unsubFriend = onSnapshot(doc(db, 'users', friendUid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          setChats(prev => {
            const newChats = [...prev];
            if (newChats[index]) {
              newChats[index] = { 
                ...newChats[index], 
                friend: { ...newChats[index].friend, ...userData } 
              };
            }
            return newChats;
          });
        }
      });
      unsubscribes.push(unsubFriend);

      // Listener for unread count
      const unreadQ = query(
        collection(db, 'chats', chatId, 'messages'),
        where('sender_uid', '==', friendUid),
        where('read', '==', false)
      );

      const unsubUnread = onSnapshot(unreadQ, (snap) => {
        setChats(prev => {
          const newChats = [...prev];
          if (newChats[index]) {
            newChats[index] = { ...newChats[index], unreadCount: snap.size };
          }
          return newChats;
        });
      });
      unsubscribes.push(unsubUnread);

      // Listener for last message
      const lastMsgQ = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubLastMsg = onSnapshot(lastMsgQ, (snap) => {
        if (!snap.empty) {
          const msgData = snap.docs[0].data();
          setChats(prev => {
            const newChats = [...prev];
            if (newChats[index]) {
              newChats[index] = { 
                ...newChats[index], 
                lastMessage: msgData.text,
                lastTimestamp: msgData.timestamp
              };
            }
            return newChats;
          });
        }
      });
      unsubscribes.push(unsubLastMsg);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, chats.length]);

  const sortedChats = [...chats].sort((a, b) => {
    const timeA = a.lastTimestamp?.toMillis() || 0;
    const timeB = b.lastTimestamp?.toMillis() || 0;
    return timeB - timeA;
  });

  const filteredChats = sortedChats.filter(c => 
    c.friend.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Private <span className="text-primary">Messages</span></h1>
          <p className="text-white/40">Chat with your friends and teammates</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="glass-card h-20 animate-pulse"></div>)
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <Link
              key={chat.friend.uid}
              to={`/chat/${chat.friend.uid}`}
              className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 overflow-hidden">
                    {chat.friend.profile_photo || chat.friend.avatar_url ? (
                      <img src={chat.friend.profile_photo || chat.friend.avatar_url} alt={chat.friend.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      chat.friend.username[0].toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-bg"></div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold group-hover:text-primary transition-colors truncate">{chat.friend.username}</h3>
                  <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-white font-bold' : 'text-white/40'}`}>
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  {chat.lastTimestamp && (
                    <p className="text-[10px] text-white/20">
                      {chat.lastTimestamp.toDate?.() ? chat.lastTimestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_var(--color-primary-glow)]">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center glass-card">
            <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40">No active conversations. Find players to start chatting!</p>
            <Link to="/search" className="text-primary text-sm font-bold mt-4 inline-block hover:underline">Search Players</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
