import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Shield, Clock, User as UserIcon, Activity } from 'lucide-react';
import { motion } from 'motion/react';

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Admin <span className="text-primary">Logs</span></h1>
        <p className="text-white/40">System-wide administrative activity tracking</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Recent Activity
          </h2>
          <span className="text-xs text-white/30">{logs.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        <Shield className="w-3 h-3" />
                      </div>
                      <span className="font-bold">{log.admin_name || 'Admin'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-bold uppercase text-white/60">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/40 font-mono text-xs">
                    {log.target || '-'}
                  </td>
                  <td className="px-6 py-4 text-white/20 text-xs">
                    {log.timestamp?.toDate?.() ? log.timestamp.toDate().toLocaleString() : 'Pending'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/40">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
