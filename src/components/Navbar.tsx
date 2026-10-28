import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Wallet, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { getVipDesignByName } from '../lib/vipAssets';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('user_uid', '==', user.uid), where('read', '==', false));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (err) => {
        console.warn('Notifications listener error:', err);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const defaultVipAvatar = getVipDesignByName(user?.username).avatarUrl;

  return (
    <nav className={cn("h-16 border-b border-white/5 bg-dark-bg/80 backdrop-blur-lg flex items-center justify-between px-6 sticky top-0 z-50", className)}>
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-amber-500 rounded-lg flex items-center justify-center font-display font-bold text-black shadow-[0_0_12px_var(--color-primary-glow)]">E</div>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xl tracking-tight text-white uppercase">ELITE<span className="text-primary">STAR</span></span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded booyah-badge text-[10px]">
            FF INDIA
          </span>
        </div>
      </Link>

      <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-80">
        <Search className="w-4 h-4 text-white/40" />
        <input 
          type="text" 
          placeholder="Search players by UID or Username..." 
          className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-white placeholder:text-white/25 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/search?uid=${(e.target as HTMLInputElement).value}`);
            }
          }}
        />
      </div>

      <div className="flex items-center gap-2.5 md:gap-3">
        <Link
          to="/ff-india"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full tiranga-ribbon hover:border-amber-400 transition-all text-xs font-display font-bold uppercase tracking-wider text-amber-300"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          FF India Live
        </Link>
        <Link to="/wallet" className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">₹{user?.wallet_balance ?? 0}</span>
        </Link>

        <Link
          to="/support"
          title="24/7 Direct Support"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white/80 hover:text-primary transition-all"
        >
          <Headphones className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold hidden lg:inline">24/7 Help</span>
        </Link>
        
        <Link to="/notifications" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-dark-bg"></span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          <Link to="/profile" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-primary/40 overflow-hidden">
              <img
                src={user?.profile_photo || user?.avatar_url || defaultVipAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors hidden sm:block">{user?.username}</span>
          </Link>
          <button onClick={handleLogout} title="Logout" className="p-2 hover:bg-red-500/10 rounded-full text-white/40 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
