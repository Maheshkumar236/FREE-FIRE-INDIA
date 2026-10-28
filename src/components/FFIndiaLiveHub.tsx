import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  Gift,
  Radio,
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Wifi,
  ChevronRight,
} from 'lucide-react';
import {
  INITIAL_FF_INDIA_LIVE_DATA,
  FFIndiaLivePayload,
  GroundingSource,
} from '../lib/ffIndiaAssets';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface FFIndiaLiveHubProps {
  compact?: boolean;
}

const FFIndiaLiveHub: React.FC<FFIndiaLiveHubProps> = ({ compact = false }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'esports' | 'redeem' | 'creators'>('news');
  const [liveData, setLiveData] = useState<FFIndiaLivePayload>(INITIAL_FF_INDIA_LIVE_DATA);
  const [syncing, setSyncing] = useState(false);
  const [liveSourceMode, setLiveSourceMode] = useState<'live' | 'verified'>('verified');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live Google Search Query State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);

  const syncWithGoogleSearch = async (showToast = false) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/ff-india/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: showToast }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveData(data);
        if (data.liveStatus === 'live_google_grounding') {
          setLiveSourceMode('live');
          if (showToast) toast.success('Synced with Live Google Search data!');
        } else if (showToast) {
          toast.success('Synced with Verified Free Fire India Arena Feed!');
        }
      }
    } catch (_err) {
      if (showToast) toast.success('Using Verified Free Fire India Arena Feed!');
    } finally {
      setSyncing(false);
    }
  };

  const handleLiveQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/ff-india/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      setSearchAnswer(data.answer || 'No results found.');
      setSearchSources(data.sources || []);
    } catch (err) {
      toast.error('Search failed — try again');
    } finally {
      setSearching(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code.replace(/-/g, ''));
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
    toast.success(`Redeem code ${code} copied!`);
  };

  return (
    <section className="hud-card p-6 md:p-8 space-y-6 overflow-hidden">
      {/* Top Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="booyah-badge px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Free Fire India Live Hub
            </span>
            <span className="text-white/60 font-mono tabular-nums flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              {liveData.serverRegion}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-amber-400 font-mono tabular-nums text-[11px]">
              {liveData.patchVersion}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide uppercase">
            Garena Free Fire India <span className="text-primary">Google Live Intelligence</span>
          </h2>
          <p className="text-xs text-white/50">
            Real-time Free Fire India release updates, OB patch meta, FFMIC esports rankings, daily redeem codes &amp; Indian creator feed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => syncWithGoogleSearch(true)}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 text-xs font-bold text-amber-400 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Google Data...' : `Sync Live Google Data · ${liveData.lastUpdated}`}
          </button>
          {compact && (
            <Link
              to="/ff-india"
              className="px-4 py-2.5 rounded-xl bg-primary/15 hover:bg-primary text-primary hover:text-black border border-primary/30 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              Full Command Center <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Live Google Search Bar for Free Fire India Queries */}
      <form onSubmit={handleLiveQuery} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live Google data: e.g. 'Free Fire India latest OB patch notes', 'FFMIC 2026 winner', 'Today FF redeem code'..."
              className="w-full bg-black/50 border border-white/15 focus:border-primary rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="neon-button py-3 px-6 text-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            {searching ? 'Searching Google...' : 'Search Live Intel'}
          </button>
        </div>

        {/* Quick Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-white/40 font-bold uppercase tracking-wider">Quick Search:</span>
          {[
            'Free Fire India OB patch weapon buffs',
            'FFMIC 2026 Grand Finals standings',
            'Yotta Server Free Fire India ping & rules',
            'Total Gaming Ajjubhai latest FF India tournament',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setSearchQuery(preset);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-primary/20 text-white/60 hover:text-amber-300 border border-white/10 transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* Live Google Search Answer Drawer */}
      {searchAnswer && (
        <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Live Google Search Grounded Intelligence
            </span>
            <button
              type="button"
              onClick={() => setSearchAnswer(null)}
              className="text-xs text-white/40 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <div className="text-sm text-white/90 whitespace-pre-line leading-relaxed">
            {searchAnswer}
          </div>
          {searchSources.length > 0 && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-white/40 uppercase text-[10px] font-bold">Verified Web Citations:</span>
              {searchSources.slice(0, 4).map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  {src.title} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4 Tactical Sub-Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
        {[
          { id: 'news', label: 'Release & OB Patch', icon: Flame, count: `${liveData.releaseNews.length} Updates` },
          { id: 'esports', label: 'India Esports & FFMIC', icon: Trophy, count: 'Top 6 Orgs' },
          { id: 'redeem', label: 'Redeem Codes & Events', icon: Gift, count: `${liveData.redeemCodes.length} Active` },
          { id: 'creators', label: 'Creator & Streamer Pulse', icon: Radio, count: 'Live Feed' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                active
                  ? 'bg-gradient-to-r from-primary/25 to-amber-500/20 border border-amber-500/40 text-white shadow-lg'
                  : 'hover:bg-white/5 text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-white/40'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-display font-bold uppercase tracking-wider truncate">{tab.label}</p>
                  <p className="text-[10px] font-mono tabular-nums text-white/40">{tab.count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Live Free Fire India Release News & OB Patch Updates */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveData.releaseNews.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-black/45 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-display font-bold uppercase tracking-wider">
                    {item.category} · {item.badge}
                  </span>
                  <span className="text-white/40 font-mono tabular-nums">{item.date}</span>
                </div>
                <h3 className="text-lg font-display font-bold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-white/65 leading-relaxed">{item.summary}</p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5">
                {item.highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/75">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Live Indian Esports Tournament Scores & Team Rankings */}
      {activeTab === 'esports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl tiranga-ribbon flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Official Garena Tier-1 Indian Circuit
              </p>
              <h3 className="text-lg font-display font-bold text-white">
                {liveData.esportsTournamentName}
              </h3>
              <p className="text-xs text-white/65">
                Venue: {liveData.esportsVenue}
              </p>
            </div>
            <div className="text-left sm:text-right font-mono tabular-nums">
              <p className="text-[10px] font-sans uppercase text-white/50 font-bold">Total Circuit Pool</p>
              <p className="text-xl font-display font-bold text-emerald-400">{liveData.esportsPrizePool}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/5">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Pro Indian Squad</th>
                  <th className="py-3.5 px-4 text-right">Matches</th>
                  <th className="py-3.5 px-4 text-right">Booyahs</th>
                  <th className="py-3.5 px-4 text-right">Elims</th>
                  <th className="py-3.5 px-4 text-right">Total Pts</th>
                  <th className="py-3.5 px-4">Key MVP &amp; Split Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono tabular-nums divide-y divide-white/5">
                {liveData.esportsStandings.map((row) => (
                  <tr key={row.rank} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                          row.rank === 1
                            ? 'booyah-badge'
                            : row.rank <= 3
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/5 text-white/60'
                        }`}
                      >
                        #{row.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <p className="font-bold text-white">{row.teamName}</p>
                      <p className="text-[10px] text-white/40 font-mono">TAG: [{row.tag}]</p>
                    </td>
                    <td className="py-3.5 px-4 text-right text-white/70">{row.matchesPlayed}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">{row.booyahs}</td>
                    <td className="py-3.5 px-4 text-right text-white/80">{row.killPoints}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-base">
                      {row.totalPoints}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs">
                      <span className="text-white font-semibold">{row.mvp}</span>
                      <span className="text-white/30"> · </span>
                      <span className="text-amber-400/90">{row.recentForm}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Daily Free Fire Redeem Codes & Event Calendar Tracker */}
      {activeTab === 'redeem' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" /> Active Indian Server Redeem Codes
              </h3>
              <a
                href="https://reward.ff.garena.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Official Garena Redemption Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2.5">
              {liveData.redeemCodes.map((rc) => (
                <div
                  key={rc.code}
                  className="p-4 rounded-2xl bg-black/50 border border-white/10 hover:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-base text-amber-400 tracking-wider">
                        {rc.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {rc.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">{rc.reward}</p>
                    <p className="text-[11px] text-white/40 font-mono tabular-nums">
                      Server: {rc.server} · {rc.expiresIn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(rc.code)}
                    className="px-4 py-2 rounded-xl bg-primary/20 hover:bg-primary text-amber-300 hover:text-black border border-primary/30 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    {copiedCode === rc.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-base font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" /> Free Fire India Event Tracker
            </h3>
            <div className="space-y-2.5">
              {liveData.eventsCalendar.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-bold uppercase">{ev.type}</span>
                    <span className="text-emerald-400 font-mono tabular-nums font-bold">{ev.status}</span>
                  </div>
                  <h4 className="font-display font-bold text-white text-base">{ev.title}</h4>
                  <p className="text-xs text-white/70">Reward: {ev.rewardHighlight}</p>
                  <p className="text-[11px] text-white/40 font-mono tabular-nums">{ev.dateRange}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Trending Free Fire India Creator & Streamer News Feed */}
      {activeTab === 'creators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveData.creatorPulse.map((creator) => (
            <div
              key={creator.id}
              className="p-5 rounded-2xl bg-black/50 border border-white/10 hover:border-primary/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-lg text-white">{creator.creatorName}</h4>
                    {creator.verified && (
                      <span className="text-[10px] font-bold uppercase text-amber-400">
                        · Verified Partner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-mono tabular-nums">
                    {creator.handle} · {creator.subscribers}
                  </p>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {creator.timestamp}
                </span>
              </div>

              <p className="text-sm font-semibold text-white/90 leading-snug">{creator.headline}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/50">
                <span>Topic: {creator.topic}</span>
                <Link to="/matches" className="text-primary font-bold hover:underline">
                  Join Creator Scrims →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grounding Sources Footer */}
      {liveData.sources && liveData.sources.length > 0 && (
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="uppercase font-bold tracking-wider text-white/50">
              {liveSourceMode === 'live' ? 'Live Google Search Grounding Sources:' : 'Official Garena & Esports References:'}
            </span>
            {liveData.sources.slice(0, 3).map((src, idx) => (
              <a
                key={idx}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1"
              >
                {src.title} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
          <span className="font-mono tabular-nums">Region: IND (Yotta Cloud)</span>
        </div>
      )}
    </section>
  );
};

export default FFIndiaLiveHub;
