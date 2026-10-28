import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User } from '../types';
import { Users, Search, Shield, ShieldAlert, Ban, CheckCircle, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('joined_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [staffUid, setStaffUid] = useState('');
  const [staffActionLoading, setStaffActionLoading] = useState(false);

  const toggleBan = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        is_banned: !user.is_banned
      });
      toast.success(user.is_banned ? 'User unbanned' : 'User banned');
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const toggleAdmin = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        is_admin: !user.is_admin
      });
      toast.success(user.is_admin ? 'Admin rights removed' : 'Admin rights granted');
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const toggleStaff = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        is_staff: !user.is_staff
      });
      toast.success(user.is_staff ? 'Staff rights removed' : 'Staff rights granted');
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Are you absolutely sure you want to PERMANENTLY DELETE ${user.username}? This cannot be undone.`)) return;
    try {
      // Note: This only deletes the Firestore document. 
      // To delete from Auth, you'd need a Cloud Function or Admin SDK.
      // But for this app, deleting the doc is the primary way to "remove" them.
      await deleteDoc(doc(db, 'users', user.uid));
      toast.success('User document deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleStaffActionByUid = async (e: React.FormEvent, action: 'add' | 'remove') => {
    e.preventDefault();
    if (!staffUid.trim()) return;
    
    setStaffActionLoading(true);
    try {
      const q = query(collection(db, 'users'), where('app_uid', '==', staffUid.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('User not found with this UID');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      await updateDoc(doc(db, 'users', userDoc.id), {
        is_staff: action === 'add'
      });

      toast.success(`${userData.username} ${action === 'add' ? 'is now a Staff member!' : 'is no longer a Staff member.'}`);
      setStaffUid('');
    } catch (error) {
      toast.error(`Failed to ${action} staff`);
    } finally {
      setStaffActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.app_uid.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">User <span className="text-primary">Management</span></h1>
          <p className="text-white/40">Monitor and moderate player accounts</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={staffUid}
                onChange={(e) => setStaffUid(e.target.value)}
                placeholder="Enter UID for Staff action..."
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary transition-all"
              />
              <div className="flex gap-1">
                <button 
                  onClick={(e) => handleStaffActionByUid(e, 'add')} 
                  disabled={staffActionLoading}
                  className="neon-button py-2 px-4 text-xs disabled:opacity-50"
                >
                  Add
                </button>
                <button 
                  onClick={(e) => handleStaffActionByUid(e, 'remove')} 
                  disabled={staffActionLoading}
                  className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/20">Manage staff roles by App UID</p>
          </div>

          <div className="relative w-full md:w-80 h-fit">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or UID..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">App UID</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${u.is_banned ? 'bg-red-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{u.username}</p>
                        <p className="text-[10px] text-white/40">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{u.app_uid}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold">₹{u.wallet_balance}</p>
                    <p className="text-[10px] text-green-500">Win: ₹{u.winnings}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs">{u.total_matches} Matches</p>
                    <p className="text-xs text-primary font-bold">{u.total_wins} Wins</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {u.is_admin && <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase w-fit">Admin</span>}
                      {u.is_staff && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase w-fit">Staff</span>}
                      {u.is_banned && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold uppercase w-fit">Banned</span>}
                      {!u.is_admin && !u.is_staff && !u.is_banned && <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-[10px] font-bold uppercase w-fit">Active</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAdmin(u)}
                        title={u.is_admin ? "Remove Admin" : "Make Admin"}
                        className={`p-2 rounded-lg transition-all ${u.is_admin ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:text-primary'}`}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStaff(u)}
                        title={u.is_staff ? "Remove Staff" : "Make Staff"}
                        className={`p-2 rounded-lg transition-all ${u.is_staff ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 hover:text-blue-500'}`}
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleBan(u)}
                        title={u.is_banned ? "Unblock User" : "Block User"}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${u.is_banned ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:text-red-500'}`}
                      >
                        <Ban className="w-4 h-4" />
                        {u.is_banned && <span className="text-[10px] font-bold uppercase">Unblock</span>}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        title="Delete User Permanently"
                        className="p-2 bg-white/5 text-white/40 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default UserManager;
