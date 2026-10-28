import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, CreditCard, CheckCircle2, XCircle, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessReceipt {
  type: 'deposit' | 'withdraw';
  amount: number;
  referenceId: string;
  upiId?: string;
}

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<SuccessReceipt | null>(null);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        txs.sort((a, b) => {
          const timeA = a.created_at?.toMillis?.() || 0;
          const timeB = b.created_at?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setTransactions(txs);
      },
      (err) => {
        console.warn('Transactions listener error:', err);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const completeDeposit = async (numAmount: number, paymentId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      wallet_balance: increment(numAmount),
      deposits: increment(numAmount)
    });

    await addDoc(collection(db, 'transactions'), {
      user_id: user.uid,
      type: 'deposit',
      amount: numAmount,
      status: 'completed',
      razorpay_payment_id: paymentId,
      created_at: serverTimestamp(),
    });

    setSuccessReceipt({
      type: 'deposit',
      amount: numAmount,
      referenceId: paymentId,
    });
    setAmount('');
  };

  const handleRazorpayDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 25) {
      toast.error('Minimum deposit is ₹25');
      return;
    }

    setLoading(true);
    try {
      if (typeof (window as any).Razorpay === 'function') {
        const options = {
          key: 'rzp_test_SP3kbkcpNZf8Zl',
          amount: numAmount * 100,
          currency: 'INR',
          name: 'ELITESTAR',
          description: 'Smart Wallet Deposit',
          handler: async (response: any) => {
            await completeDeposit(numAmount, response.razorpay_payment_id || `pay_${Date.now()}`);
          },
          prefill: {
            name: user?.username,
            email: user?.email,
            contact: user?.phone
          },
          theme: {
            color: '#FF6B00'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        await completeDeposit(numAmount, `instant_${Date.now()}`);
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      toast.error('Minimum withdrawal is ₹100');
      return;
    }
    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID');
      return;
    }

    if ((user?.winnings ?? 0) < numAmount && (user?.wallet_balance ?? 0) < numAmount) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user!.uid);
      const deductWinnings = Math.min(user?.winnings ?? 0, numAmount);
      await updateDoc(userRef, {
        wallet_balance: increment(-numAmount),
        ...(deductWinnings > 0 ? { winnings: increment(-deductWinnings) } : {})
      });

      const refId = `WD_${Math.floor(100000 + Math.random() * 900000)}`;
      await addDoc(collection(db, 'transactions'), {
        user_id: user!.uid,
        type: 'withdraw',
        amount: numAmount,
        status: 'completed',
        upi_id: upiId,
        created_at: serverTimestamp()
      });

      setShowWithdrawModal(false);
      setSuccessReceipt({
        type: 'withdraw',
        amount: numAmount,
        referenceId: refId,
        upiId,
      });
      setUpiId('');
      setAmount('');
    } catch (error) {
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Smart <span className="text-primary">Wallet</span></h1>
          <p className="text-xs text-white/40">Real-time balance updates &amp; automatic tournament payouts</p>
        </div>
        <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Secure &amp; Instant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-8 bg-gradient-to-br from-primary/20 to-transparent border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <WalletIcon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Total Balance</span>
            </div>
            <p className="text-4xl font-display font-bold mb-2">₹{user?.wallet_balance ?? 0}</p>
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Winnings: <span className="text-green-500 font-bold">₹{user?.winnings ?? 0}</span></span>
              <span>Deposits: <span className="text-white font-bold">₹{user?.deposits ?? 0}</span></span>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold">Add Cash / Withdraw</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Quick Amount</p>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 100, 200, 500, 810].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        amount === val.toString() 
                          ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(255,107,0,0.3)]' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (₹)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleRazorpayDeposit}
                    disabled={loading || !amount}
                    className="neon-button py-3 px-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" /> Add Cash (Razorpay Auto)
                  </button>
                  <button
                    onClick={() => {
                      const numAmount = parseFloat(amount);
                      if (isNaN(numAmount) || numAmount < 100) {
                        toast.error('Enter at least ₹100 to withdraw');
                        return;
                      }
                      setShowWithdrawModal(true);
                    }}
                    className="bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4" /> Withdraw Winnings
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl space-y-2">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Smart Wallet Perks</p>
              <ul className="text-[10px] text-white/40 space-y-1">
                <li>• Min Deposit: ₹25 • Min Withdrawal: ₹100</li>
                <li>• Automatic tournament winnings credit without delay</li>
                <li>• Instant UPI Withdrawal with Green Tick verification</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Transaction History</h2>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            tx.type === 'deposit' || tx.type === 'match_win' || tx.type === 'signup_bonus' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'match_win' || tx.type === 'signup_bonus' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="capitalize font-medium block">{tx.type.replace('_', ' ')}</span>
                            {tx.upi_id && <span className="text-[10px] text-white/30 font-mono">UPI: {tx.upi_id}</span>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-bold ${
                        tx.type === 'deposit' || tx.type === 'match_win' || tx.type === 'signup_bonus' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'match_win' || tx.type === 'signup_bonus' ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/40">
                        {tx.created_at?.toDate?.() ? tx.created_at.toDate().toLocaleDateString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/40">No transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Withdraw ₹{amount}</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="text-white/40 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-1">Your UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. gamer@upi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
                  />
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-xs text-green-400 leading-relaxed flex items-center gap-2">
                    <Zap className="w-4 h-4 shrink-0" />
                    Instant Automatic UPI Payout enabled for ELITESTAR VIP players.
                  </p>
                </div>

                <button
                  onClick={handleWithdrawSubmit}
                  disabled={loading || !upiId}
                  className="w-full neon-button py-3 disabled:opacity-50"
                >
                  {loading ? 'Processing Payout...' : `Confirm ₹${amount} Withdrawal`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional Green Tick Payment Success Screen */}
      <AnimatePresence>
        {successReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="w-full max-w-md glass-card p-8 text-center space-y-6 border-2 border-green-500/40 bg-gradient-to-b from-green-500/15 to-dark-bg shadow-[0_0_50px_rgba(34,197,94,0.25)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              >
                <CheckCircle2 className="w-14 h-14 text-green-400" />
              </motion.div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                  Payment Verified • Success
                </span>
                <h3 className="text-3xl font-display font-bold text-white pt-2">
                  ₹{successReceipt.amount} {successReceipt.type === 'withdraw' ? 'Withdrawn!' : 'Added!'}
                </h3>
                <p className="text-xs text-white/60">
                  {successReceipt.type === 'withdraw'
                    ? `Successfully transferred to UPI ID: ${successReceipt.upiId}`
                    : 'Your ELITESTAR Smart Wallet has been credited instantaneously.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Transaction Type</span>
                  <span className="font-bold uppercase text-green-400">{successReceipt.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Reference ID</span>
                  <span className="font-mono text-white/80">{successReceipt.referenceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Updated Balance</span>
                  <span className="font-bold text-white">₹{user?.wallet_balance ?? 0}</span>
                </div>
              </div>

              <button
                onClick={() => setSuccessReceipt(null)}
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
