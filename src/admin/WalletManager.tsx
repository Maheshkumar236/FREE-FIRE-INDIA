import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Transaction } from '../types';
import { Wallet, CheckCircle, XCircle, Clock, ArrowUpRight, Filter, Eye, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const WalletManager: React.FC = () => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const qWithdraw = query(
      collection(db, 'transactions'),
      where('type', '==', 'withdraw'),
      where('status', '==', 'pending')
    );

    const qDeposit = query(
      collection(db, 'transactions'),
      where('type', '==', 'deposit'),
      where('status', '==', 'pending')
    );

    const unsubscribeWithdraw = onSnapshot(qWithdraw, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      // Sort in memory to avoid index requirement
      txs.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeA - timeB;
      });
      setPendingWithdrawals(txs);
    });

    const unsubscribeDeposit = onSnapshot(qDeposit, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      // Sort in memory to avoid index requirement
      txs.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeA - timeB;
      });
      setPendingDeposits(txs);
      setLoading(false);
    });

    return () => {
      unsubscribeWithdraw();
      unsubscribeDeposit();
    };
  }, []);

  const approveWithdrawal = async (tx: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'completed'
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: tx.user_id,
        type: 'wallet_update',
        message: `Your withdrawal of ₹${tx.amount} has been approved and processed.`,
        read: false,
        created_at: serverTimestamp()
      });

      toast.success('Withdrawal approved');
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const rejectWithdrawal = async (tx: Transaction) => {
    try {
      // Refund the amount
      await updateDoc(doc(db, 'users', tx.user_id), {
        wallet_balance: increment(tx.amount),
        winnings: increment(tx.amount)
      });

      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'failed'
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: tx.user_id,
        type: 'wallet_update',
        message: `Your withdrawal of ₹${tx.amount} was rejected. Funds have been refunded to your wallet.`,
        read: false,
        created_at: serverTimestamp()
      });

      toast.success('Withdrawal rejected and refunded');
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const approveDeposit = async (tx: Transaction) => {
    try {
      const userRef = doc(db, 'users', tx.user_id);
      await updateDoc(userRef, {
        wallet_balance: increment(tx.amount),
        deposits: increment(tx.amount)
      });

      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'completed'
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: tx.user_id,
        type: 'wallet_update',
        message: `Your deposit of ₹${tx.amount} has been approved. Funds added to your wallet.`,
        read: false,
        created_at: serverTimestamp()
      });

      toast.success('Deposit approved');
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const rejectDeposit = async (tx: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'failed'
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: tx.user_id,
        type: 'wallet_update',
        message: `Your deposit of ₹${tx.amount} was rejected. Please contact support if this is an error.`,
        read: false,
        created_at: serverTimestamp()
      });

      toast.success('Deposit rejected');
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Wallet <span className="text-primary">Manager</span></h1>
        <p className="text-white/40">Review and process deposit and withdrawal requests</p>
      </div>

      {/* Pending Deposits */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-green-500" /> Pending Deposits
          </h2>
          <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">
            {pendingDeposits.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Screenshot</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pendingDeposits.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{tx.user_id}</td>
                  <td className="px-6 py-4 font-bold text-green-500">₹{tx.amount}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedScreenshot(tx.screenshot_url || null)}
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" /> View Proof
                    </button>
                  </td>
                  <td className="px-6 py-4 text-white/40">
                    {tx.created_at?.toDate?.() ? tx.created_at.toDate().toLocaleString() : 'Pending'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveDeposit(tx)}
                        className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectDeposit(tx)}
                        className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingDeposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">No pending deposit requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Pending Withdrawals
          </h2>
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/20">
            {pendingWithdrawals.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">User ID / UPI</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pendingWithdrawals.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-white/40">{tx.user_id}</p>
                    <p className="font-bold text-primary">{tx.upi_id}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-500">₹{tx.amount}</td>
                  <td className="px-6 py-4 text-white/40">
                    {tx.created_at?.toDate?.() ? tx.created_at.toDate().toLocaleString() : 'Pending'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveWithdrawal(tx)}
                        className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectWithdrawal(tx)}
                        className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/40">No pending withdrawal requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Viewer Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full"
            >
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="absolute -top-12 right-0 text-white/60 hover:text-white flex items-center gap-2"
              >
                <XCircle className="w-6 h-6" /> Close
              </button>
              <img 
                src={selectedScreenshot} 
                alt="Payment Proof" 
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletManager;
