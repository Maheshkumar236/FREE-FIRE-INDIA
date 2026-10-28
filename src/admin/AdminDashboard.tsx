import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { Match, User, Transaction } from '../types';
import { LayoutDashboard, Trophy, Users, Wallet, AlertCircle, TrendingUp, Plus, Shield, CheckCircle, XCircle, Brain } from 'lucide-react';
import AIBugDetector from './AIBugDetector';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    pendingDeposits: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const matchesSnap = await getDocs(collection(db, 'matches'));
      const withdrawSnap = await getDocs(query(collection(db, 'transactions'), where('type', '==', 'withdraw'), where('status', '==', 'pending')));
      const depositSnap = await getDocs(query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending')));
      
      setStats({
        totalUsers: usersSnap.size,
        totalMatches: matchesSnap.size,
        totalRevenue: 0, // Calculate from transactions if needed
        pendingWithdrawals: withdrawSnap.size,
        pendingDeposits: depositSnap.size
      });
    };

    const reportsQuery = query(collection(db, 'reports'), orderBy('created_at', 'desc'), limit(5));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      setRecentReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const logsQuery = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setRecentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchStats();
    return () => {
      unsubscribeReports();
      unsubscribeLogs();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Admin <span className="text-primary">Control Panel</span></h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase">Secure Access</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Total Players</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.totalUsers}</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Matches</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.totalMatches}</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Wallet className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pending Payouts</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.pendingWithdrawals}</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <Plus className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pending Deposits</span>
          </div>
          <p className="text-3xl font-display font-bold">{stats.pendingDeposits}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <AIBugDetector logs={recentLogs} />
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Recent Reports
          </h2>
          <div className="glass-card overflow-hidden">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="p-4 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-bold">Reported: {report.reported_uid}</p>
                    <p className="text-xs text-white/40">{report.reason}</p>
                  </div>
                  <button className="text-xs text-primary hover:underline">Review</button>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-white/40">No reports found.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/admin/matches')}
              className="glass-card p-6 text-center hover:border-primary/50 transition-all"
            >
              <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-sm font-bold">Create Match</p>
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="glass-card p-6 text-center hover:border-primary/50 transition-all"
            >
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <p className="text-sm font-bold">Manage Users</p>
            </button>
            <button 
              onClick={() => navigate('/admin/wallet')}
              className="glass-card p-6 text-center hover:border-primary/50 transition-all"
            >
              <Wallet className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-bold">Approve Payouts</p>
            </button>
            <button 
              onClick={() => navigate('/admin/logs')}
              className="glass-card p-6 text-center hover:border-primary/50 transition-all"
            >
              <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <p className="text-sm font-bold">System Logs</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
