import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { generateAppUID } from '../lib/utils';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { getVipDesignByName } from '../lib/vipAssets';

const CompleteProfile: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();

  const vipDesign = getVipDesignByName(username || 'E');

  const generateAvatar = async () => {
    if (!username) {
      toast.error('Please enter a username first');
      return;
    }
    setGeneratingAvatar(true);
    try {
      setAvatarUrl(vipDesign.avatarUrl);
      toast.success(`Equipped 3D [${vipDesign.letter}] VIP Avatar!`);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !username || !phone) return;

    setLoading(true);
    try {
      const chosenVip = getVipDesignByName(username);
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        username,
        email: firebaseUser.email,
        phone,
        app_uid: generateAppUID(),
        wallet_balance: 10,
        winnings: 0,
        deposits: 0,
        total_matches: 0,
        total_wins: 0,
        joined_at: serverTimestamp(),
        is_admin: firebaseUser.email === 'maheshkumae8542@gmail.com',
        is_banned: false,
        avatar_url: avatarUrl || chosenVip.avatarUrl,
        banner_url: chosenVip.bannerUrl,
      });
      toast.success('VIP Profile created with ₹10 Bonus!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-white mb-2">Complete Your VIP Profile</h1>
          <p className="text-white/50 text-sm">Your 3D A-Z Avatar &amp; Banner auto-sync with your name!</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-primary/50 flex items-center justify-center overflow-hidden shadow-lg">
              <img
                src={avatarUrl || vipDesign.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              type="button"
              onClick={generateAvatar}
              disabled={generatingAvatar || !username}
              className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-lg shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100"
              title="Generate AI Avatar"
            >
              {generatingAvatar ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
              placeholder="e.g. ShadowX"
            />
            <p className="text-[10px] text-primary mt-1">
              3D Emblem: [{vipDesign.letter}] {vipDesign.title}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Phone Number</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-all outline-none"
              placeholder="10-digit number"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full neon-button disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete VIP Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
