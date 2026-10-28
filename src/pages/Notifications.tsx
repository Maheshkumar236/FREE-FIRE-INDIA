import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, deleteDoc, getDoc, orderBy, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { Bell, Check, X, Trash2, Info, Trophy, Wallet, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const nQuery = query(
      collection(db, 'notifications'),
      where('user_uid', '==', user.uid)
    );

    const unsubscribeN = onSnapshot(
      nQuery,
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        list.sort((a, b) => {
          const tA = a.created_at?.toMillis?.() || 0;
          const tB = b.created_at?.toMillis?.() || 0;
          return tB - tA;
        });
        setNotifications(list);
      },
      (err) => {
        console.warn('Notifications listener error:', err);
      }
    );

    const frQuery = query(
      collection(db, 'friend_requests'),
      where('receiver_uid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeFR = onSnapshot(
      frQuery,
      (snapshot) => {
        setFriendRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.warn('Friend requests listener error:', err);
      }
    );

    return () => {
      unsubscribeN();
      unsubscribeFR();
    };
  }, [user]);

  const handleAcceptRequest = async (request: any) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'friend_requests', request.id), {
        status: 'accepted'
      });

      // 2. Add to friends collection for both
      await setDoc(doc(db, 'friends', `${user!.uid}_${request.sender_uid}`), {
        user_uid: user!.uid,
        friend_uid: request.sender_uid,
        friend_username: request.sender_username,
        created_at: serverTimestamp()
      });

      await setDoc(doc(db, 'friends', `${request.sender_uid}_${user!.uid}`), {
        user_uid: request.sender_uid,
        friend_uid: user!.uid,
        friend_username: user!.username,
        created_at: serverTimestamp()
      });

      // 3. Update follower/following counts
      // Current user (receiver) gets a new follower
      await updateDoc(doc(db, 'users', user!.uid), {
        followers_count: increment(1)
      });

      // Sender gets a new following
      await updateDoc(doc(db, 'users', request.sender_uid), {
        following_count: increment(1)
      });

      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'rejected'
      });
      toast.success('Request rejected');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'match_update': return <Trophy className="w-4 h-4 text-primary" />;
      case 'wallet_update': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'friend_request': return <UserPlus className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Notifications</h1>
        <button className="text-xs text-white/40 hover:text-white transition-colors">Mark all as read</button>
      </div>

      {friendRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Friend Requests</h2>
          {friendRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 flex items-center justify-between border-primary/20 bg-primary/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {req.sender_username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{req.sender_username}</p>
                  <p className="text-xs text-white/40">wants to follow you</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptRequest(req)}
                  className="p-2 bg-primary text-white rounded-lg hover:scale-110 transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRejectRequest(req.id)}
                  className="p-2 bg-white/5 border border-white/10 text-white/40 rounded-lg hover:text-red-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">Recent Activity</h2>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`glass-card p-4 flex items-start gap-4 group ${!n.read ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className={`p-2 rounded-xl ${!n.read ? 'bg-primary/20' : 'bg-white/5'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-white/60'}`}>{n.message}</p>
                  <p className="text-[10px] text-white/20 mt-1">
                    {n.created_at?.toDate?.() ? (
                      <>
                        {n.created_at.toDate().toLocaleDateString()} • {n.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : 'Pending'}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-primary transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {notifications.length === 0 && friendRequests.length === 0 && (
            <div className="py-20 text-center glass-card">
              <Bell className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
