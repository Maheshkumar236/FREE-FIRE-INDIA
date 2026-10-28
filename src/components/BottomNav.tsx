import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Trophy, Wallet, User, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Flame, label: 'FF India', path: '/ff-india' },
    { icon: Trophy, label: 'Matches', path: '/matches' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-bg border-t border-white/10 p-2 flex justify-around z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
              isActive ? "text-primary" : "text-white/40 hover:text-white"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
