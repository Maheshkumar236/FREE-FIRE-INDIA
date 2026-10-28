import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, Server, Trophy, ChevronRight, Zap } from 'lucide-react';
import FFIndiaLiveHub from '../components/FFIndiaLiveHub';
import { FF_INDIA_HERO_ART } from '../lib/ffIndiaAssets';

const FFIndiaHubPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Dedicated Free Fire India Hero Header */}
      <section className="relative overflow-hidden rounded-3xl hud-card p-6 md:p-10">
        <img
          src={FF_INDIA_HERO_ART}
          alt="Free Fire India Arena"
          className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080C] via-[#07080C]/85 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="booyah-badge px-3 py-1 rounded-md flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Official Free Fire India Command Center
            </span>
            <span className="text-white/70 font-mono tabular-nums">
              Yotta Mumbai Data Center · 18ms Low-Ping Matchmaking
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wide leading-tight">
            Bharat Booyah <span className="text-primary">Esports &amp; Release</span> Intelligence
          </h1>

          <p className="text-sm md:text-base text-white/70 leading-relaxed">
            Stay ahead of every Garena Free Fire India update, OB weapon balance patch, Free Fire MAX India Cup (FFMIC) leaderboard standing, and daily reward redemption code — powered by live Google Search grounding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono tabular-nums">
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <p className="text-[10px] font-sans uppercase text-white/40 font-bold flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-emerald-400" /> Data Residency
              </p>
              <p className="text-sm font-display font-bold text-white mt-0.5">Yotta Navi Mumbai</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <p className="text-[10px] font-sans uppercase text-white/40 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Premier Circuit
              </p>
              <p className="text-sm font-display font-bold text-amber-400 mt-0.5">FFMIC ₹1 Cr Pool</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <p className="text-[10px] font-sans uppercase text-white/40 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Anti-Cheat &amp; Policy
              </p>
              <p className="text-sm font-display font-bold text-emerald-400 mt-0.5">MeitY Verified</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/matches" className="neon-button flex items-center gap-2 text-xs">
              Join Custom Room Scrims <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/squad"
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" /> 1-Click Squad Registration
            </Link>
          </div>
        </div>
      </section>

      {/* Full Interactive 4-Tab Hub */}
      <FFIndiaLiveHub compact={false} />
    </div>
  );
};

export default FFIndiaHubPage;
