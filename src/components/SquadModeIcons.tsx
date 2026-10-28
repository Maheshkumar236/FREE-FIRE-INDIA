import React from 'react';
import { User, Users, Shield, Swords, Zap, Hexagon, Target, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ children, className, glowColor = "rgba(255, 107, 0, 0.4)" }) => (
  <motion.div
    whileHover={{ scale: 1.1, rotate: 5 }}
    className={cn(
      "relative flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden",
      "bg-dark-bg border border-white/10 group transition-all duration-300",
      "hover:border-primary/50 hover:shadow-[0_0_20px_var(--glow-color)]",
      className
    )}
    style={{ "--glow-color": glowColor } as React.CSSProperties}
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary" />
    
    {/* Animated Border Gradient */}
    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10 text-primary group-hover:text-white transition-colors duration-300">
      {children}
    </div>
  </motion.div>
);

export const SoloIcon = () => (
  <IconWrapper>
    <div className="relative">
      <User size={32} strokeWidth={2.5} />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-1 -right-1"
      >
        <Target size={14} className="text-primary-glow" />
      </motion.div>
    </div>
  </IconWrapper>
);

export const DuoIcon = () => (
  <IconWrapper>
    <div className="relative flex items-center justify-center">
      <User size={24} className="translate-x-1.5 translate-y-1" strokeWidth={2.5} />
      <User size={24} className="-translate-x-1.5 -translate-y-1 opacity-70" strokeWidth={2.5} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-[1px] bg-primary/30 rotate-45" />
      </div>
    </div>
  </IconWrapper>
);

export const SquadIcon = () => (
  <IconWrapper>
    <div className="relative">
      <Shield size={32} strokeWidth={2} className="opacity-20" />
      <div className="absolute inset-0 flex items-center justify-center gap-0.5">
        <Users size={28} strokeWidth={2.5} />
      </div>
    </div>
  </IconWrapper>
);

export const ClashSquadIcon = () => (
  <IconWrapper glowColor="rgba(255, 0, 0, 0.4)">
    <div className="relative">
      <Swords size={32} strokeWidth={2.5} className="text-red-500 group-hover:text-white" />
      <motion.div
        animate={{ y: [-2, 2, -2], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute -top-2 -left-2 text-primary"
      >
        <Zap size={16} fill="currentColor" />
      </motion.div>
      <motion.div
        animate={{ y: [2, -2, 2], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }}
        className="absolute -bottom-2 -right-2 text-primary"
      >
        <Flame size={16} fill="currentColor" />
      </motion.div>
    </div>
  </IconWrapper>
);

export const ModeIconsShowcase = () => (
  <div className="flex flex-wrap gap-6 p-8 bg-dark-bg/50 rounded-3xl border border-white/5">
    <div className="flex flex-col items-center gap-3">
      <SoloIcon />
      <span className="text-xs font-display font-bold uppercase tracking-widest text-white/60">Solo</span>
    </div>
    <div className="flex flex-col items-center gap-3">
      <DuoIcon />
      <span className="text-xs font-display font-bold uppercase tracking-widest text-white/60">Duo</span>
    </div>
    <div className="flex flex-col items-center gap-3">
      <SquadIcon />
      <span className="text-xs font-display font-bold uppercase tracking-widest text-white/60">Squad</span>
    </div>
    <div className="flex flex-col items-center gap-3">
      <ClashSquadIcon />
      <span className="text-xs font-display font-bold uppercase tracking-widest text-white/60">Clash Squad</span>
    </div>
  </div>
);
