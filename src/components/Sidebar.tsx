import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Trophy, 
  Users, 
  MessageSquare, 
  Globe, 
  Search, 
  BarChart2, 
  Shield, 
  HelpCircle,
  LayoutDashboard,
  Wallet,
  Megaphone,
  Activity,
  Ticket,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Arena Home', path: '/' },
    { icon: Flame, label: 'FF India Live Hub', path: '/ff-india' },
    { icon: Trophy, label: 'Tournaments', path: '/matches' },
    { icon: Users, label: 'Squad', path: '/squad' },
    { icon: MessageSquare, label: 'Private Chat', path: '/chat' },
    { icon: Globe, label: 'Global Chat', path: '/global-chat' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements' },
    { icon: Search, label: 'Find Players', path: '/search' },
    { icon: BarChart2, label: 'Leaderboard', path: '/leaderboard' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin' },
    { icon: Shield, label: 'Manage Matches', path: '/admin/matches' },
    { icon: Wallet, label: 'Wallet Manager', path: '/admin/wallet' },
    { icon: Ticket, label: 'Support Tickets', path: '/admin/tickets' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: Activity, label: 'Admin Logs', path: '/admin/logs' },
  ];

  const staffItems = [
    { icon: Shield, label: 'Manage Matches', path: '/admin/matches' },
  ];

  return (
    <aside className={cn("w-20 md:w-64 border-r border-white/5 bg-dark-bg/50 flex flex-col h-[calc(100vh-64px)] overflow-y-auto", className)}>
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 hidden md:block">Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary text-white shadow-[0_0_15px_var(--color-primary-glow)]" 
                : "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
            <span className="font-medium hidden md:block">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {user?.is_admin && (
        <div className="p-4 mt-4 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest px-4 hidden md:block">Admin</p>
          {adminItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-white border border-white/20" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium hidden md:block">{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {user?.is_staff && !user?.is_admin && (
        <div className="p-4 mt-4 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest px-4 hidden md:block">Staff</p>
          {staffItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-white border border-white/20" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium hidden md:block">{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      <div className="mt-auto p-4">
        <div className="glass-card p-4 hidden md:block">
          <p className="text-xs text-white/40 mb-2">Account UID</p>
          <p className="font-mono font-bold text-primary tracking-wider">{user?.app_uid}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
