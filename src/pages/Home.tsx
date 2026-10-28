import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  TrendingUp,
  Zap,
  ChevronRight,
  Star,
  Plane,
  Hotel,
  Utensils,
  MapPin,
  ShieldCheck,
  Sparkles,
  Headphones,
  CheckCircle2,
  X,
  Flame,
  Wifi,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  orderBy,
  setDoc,
  doc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Match, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { SoloIcon, DuoIcon, SquadIcon, ClashSquadIcon } from '../components/SquadModeIcons';
import { getVipDesignByName } from '../lib/vipAssets';
import { FF_INDIA_HERO_ART, getMapArtwork } from '../lib/ffIndiaAssets';
import FFIndiaLiveHub from '../components/FFIndiaLiveHub';
import { toast } from 'react-hot-toast';

const LAN_EVENTS = [
  {
    id: 'lan-1',
    week: 'Week 1 • Monthly LAN',
    title: 'ELITESTAR Pro Arena — New Delhi',
    city: 'New Delhi, India',
    prize: '₹2,50,000',
    perks: ['Free Flight Tickets', '5-Star Hotel Stay', 'All Meals Sponsored'],
    slots: '12 Squads Finalist',
  },
  {
    id: 'lan-2',
    week: 'Week 2 • Monthly LAN',
    title: 'ELITESTAR Champions Clash — Mumbai',
    city: 'Mumbai, India',
    prize: '₹3,00,000',
    perks: ['Free Flight Tickets', 'Luxury Resort Stay', 'VIP Dining & Gear'],
    slots: '12 Squads Finalist',
  },
  {
    id: 'lan-3',
    week: 'Week 3 • Monthly LAN',
    title: 'ELITESTAR Masters — Bengaluru',
    city: 'Bengaluru, India',
    prize: '₹2,50,000',
    perks: ['Free Flight Tickets', 'Pro Boot-Camp Stay', 'All Expenses Paid'],
    slots: '12 Squads Finalist',
  },
  {
    id: 'lan-4',
    week: 'Week 4 • Grand Finals LAN',
    title: 'ELITESTAR God-Level National Finale — Hyderabad',
    city: 'Hyderabad, India',
    prize: '₹5,00,000',
    perks: ['Business Class Travel', '5-Star Hospitality', 'Trophy + Contract'],
    slots: 'Top 12 Squads',
  },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [topPlayers, setTopPlayers] = useState<User[]>([]);
  const [registeredLanIds, setRegisteredLanIds] = useState<string[]>([]);
  const [selectedLanEvent, setSelectedLanEvent] = useState<(typeof LAN_EVENTS)[0] | null>(null);
  const [departureCity, setDepartureCity] = useState('');
  const [squadTag, setSquadTag] = useState('');
  const [submittingLan, setSubmittingLan] = useState(false);

  useEffect(() => {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('status', '==', 'upcoming'),
      limit(10)
    );

    const unsubscribeMatches = onSnapshot(
      matchesQuery,
      (snapshot) => {
        const matches = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Match));
        matches.sort((a, b) => {
          const timeA = a.match_time?.toMillis?.() || new Date(a.match_time).getTime() || 0;
          const timeB = b.match_time?.toMillis?.() || new Date(b.match_time).getTime() || 0;
          return timeA - timeB;
        });
        setUpcomingMatches(matches.slice(0, 4));
      },
      (err) => {
        console.warn('Upcoming matches listener error:', err);
      }
    );

    const playersQuery = query(
      collection(db, 'users'),
      orderBy('total_wins', 'desc'),
      limit(5)
    );

    const unsubscribePlayers = onSnapshot(
      playersQuery,
      (snapshot) => {
        const players = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as User));
        setTopPlayers(players);
      },
      (err) => {
        console.warn('Top players listener error:', err);
      }
    );

    return () => {
      unsubscribeMatches();
      unsubscribePlayers();
    };
  }, []);

  // Load user's LAN qualifier registrations
  useEffect(() => {
    if (!user) return;
    const lanQuery = query(
      collection(db, 'lan_registrations'),
      where('user_uid', '==', user.uid)
    );
    const unsubLan = onSnapshot(
      lanQuery,
      (snap) => {
        setRegisteredLanIds(snap.docs.map((d) => d.data().lan_id));
      },
      (err) => console.warn('LAN registrations listener error:', err)
    );
    return () => unsubLan();
  }, [user]);

  const handleLanApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLanEvent) return;
    if (!departureCity.trim()) {
      toast.error('Please enter your departure city for flight booking');
      return;
    }

    setSubmittingLan(true);
    try {
      await setDoc(doc(db, 'lan_registrations', `${selectedLanEvent.id}_${user.uid}`), {
        lan_id: selectedLanEvent.id,
        lan_title: selectedLanEvent.title,
        lan_city: selectedLanEvent.city,
        user_uid: user.uid,
        username: user.username,
        app_uid: user.app_uid,
        departure_city: departureCity.trim(),
        squad_name: squadTag.trim() || 'Solo Pro / Squad',
        total_wins: user.total_wins || 0,
        total_matches: user.total_matches || 0,
        status: 'qualified_tracker',
        created_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        user_uid: user.uid,
        type: 'match_update',
        message: `LAN Qualifier Registered: ${selectedLanEvent.title} (${selectedLanEvent.city}). Flight departure city: ${departureCity.trim()}.`,
        read: false,
        created_at: serverTimestamp(),
      });

      toast.success(`Registered for ${selectedLanEvent.title}!`);
      setSelectedLanEvent(null);
      setDepartureCity('');
      setSquadTag('');
    } catch (error) {
      toast.error('Failed to register for LAN event');
    } finally {
      setSubmittingLan(false);
    }
  };

  const userDesign = getVipDesignByName(user?.username);

  // Compute LAN Qualification Tracker Progress
  const checkMatches = (user?.total_matches || 0) >= 3;
  const checkWins = (user?.total_wins || 0) >= 1;
  const checkLevel = (user?.freefire_level || 50) >= 40;
  const qualificationPercent = Math.round(
    ([checkMatches, checkWins, checkLevel].filter(Boolean).length / 3) * 100
  );

  return (
    <div className="space-y-10">
      {/* Free Fire India Tiranga Gold & Saffron Arena Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl hud-card p-7 md:p-11">
        <img
          src={FF_INDIA_HERO_ART}
          alt="Free Fire India Tiranga Gold & Saffron Arena"
          className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080C] via-[#07080C]/85 to-[#07080C]/35 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-4 text-xs">
                <span className="booyah-badge px-3 py-1 rounded-md flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Free Fire India Official Arena Theme
                </span>
                <span className="text-emerald-400 font-mono tabular-nums flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> Yotta IND 18ms
                </span>
                <span className="text-white/30">·</span>
                <span className="text-amber-300 font-mono tabular-nums">
                  FFMIC ₹1 Cr Circuit &amp; 4 Monthly LANs
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-5 leading-none uppercase tracking-wide">
                Bharat <span className="text-primary">Booyah</span> Battleground
              </h1>

              <p className="text-base md:text-lg text-white/75 mb-7 max-w-2xl leading-relaxed">
                Compete in daily Free Fire India &amp; Free Fire MAX custom rooms, track live Google-grounded OB patch updates &amp; FFMIC esports rankings, and qualify for our 4 monthly all-expenses-paid LAN championships.
              </p>

              <div className="flex flex-wrap gap-3.5">
                <Link to="/matches" className="neon-button flex items-center gap-2 text-sm">
                  Enter Custom Rooms <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ff-india"
                  className="px-5 py-3 rounded-xl tiranga-ribbon hover:border-amber-400 text-amber-300 font-display font-bold uppercase tracking-wider text-sm transition-all flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-primary" /> Live Google FF India Hub
                </Link>
                <Link
                  to="/squad"
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/15 font-display font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-primary" /> 1-Click Squad
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Tactical VIP Identity HUD Card */}
          {user && (
            <div className="lg:col-span-4">
              <div className="hud-card p-5 bg-black/70 relative overflow-hidden">
                <img
                  src={user.banner_url || userDesign.bannerUrl}
                  alt="VIP Banner"
                  className="w-full h-24 object-cover rounded-xl mb-3 border border-amber-500/20"
                />
                <div className="flex items-center gap-4 -mt-10 px-2 relative z-10">
                  <img
                    src={user.profile_photo || user.avatar_url || userDesign.avatarUrl}
                    alt={user.username}
                    className="w-16 h-16 rounded-2xl border-2 border-amber-400 shadow-xl object-cover bg-dark-bg"
                  />
                  <div className="pt-6">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-lg text-white uppercase tracking-wide">
                        {user.username}
                      </p>
                      <span className="booyah-badge px-2 py-0.5 rounded text-[9px]">
                        {user.is_admin ? 'SUPER ADMIN' : 'BOOYAH VIP'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-mono tabular-nums">
                      UID: {user.app_uid} · Lvl {user.freefire_level || 55}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center font-mono tabular-nums">
                  <div className="bg-white/5 rounded-xl p-2">
                    <p className="text-[10px] font-sans text-white/40 uppercase font-bold">Matches</p>
                    <p className="text-base font-display font-bold text-white">{user.total_matches || 0}</p>
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-2 border border-amber-500/25">
                    <p className="text-[10px] font-sans text-amber-400 uppercase font-bold">Booyahs</p>
                    <p className="text-base font-display font-bold text-amber-400">{user.total_wins || 0}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/25">
                    <p className="text-[10px] font-sans text-emerald-400 uppercase font-bold">Wallet</p>
                    <p className="text-base font-display font-bold text-emerald-400">
                      ₹{user.wallet_balance ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Google Search Free Fire India Intelligence Hub */}
      <FFIndiaLiveHub compact={true} />

      {/* Stylized Squad Modes Selector */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide">
              Select Battleground Mode
            </h2>
            <p className="text-xs text-white/45">
              Bermuda · Kalahari · Purgatory · Alpine · 4v4 Clash Squad
            </p>
          </div>
          <Link to="/matches" className="text-xs font-display font-bold uppercase tracking-wider text-amber-400 hover:underline">
            Explore All Modes →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Solo', desc: '1 Player · Survival BR', Comp: SoloIcon },
            { name: 'Duo', desc: '2 Players · Tactical', Comp: DuoIcon },
            { name: 'Squad', desc: '4 Players · FFMIC Rules', Comp: SquadIcon },
            { name: 'Clash Squad', desc: '4v4 · Economy Rounds', Comp: ClashSquadIcon },
          ].map(({ name, desc, Comp }) => (
            <button
              key={name}
              onClick={() => navigate(`/matches?mode=${encodeURIComponent(name)}`)}
              className="hud-card p-5 flex items-center gap-4 text-left hover:border-amber-400/60 transition-all group"
            >
              <Comp />
              <div>
                <p className="font-display font-bold text-lg text-white uppercase group-hover:text-amber-400 transition-colors">
                  {name}
                </p>
                <p className="text-xs text-white/45">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Matches with Custom Map Artwork + Tactical HUD Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Live &amp; Upcoming Custom Lobbies
            </h2>
            <Link to="/matches" className="text-sm font-display font-bold uppercase text-primary hover:underline">
              View All Lobbies →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => {
                const bannerArt = match.poster_url || getMapArtwork(match.map, match.mode);
                return (
                  <Link
                    key={match.id}
                    to={`/match/${match.id}`}
                    className="hud-card overflow-hidden group hover:border-amber-400/60 transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={bannerArt}
                        alt={match.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E15] via-[#0B0E15]/40 to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-[10px] font-display font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                          {match.mode} · {match.map}
                        </span>
                        <span className="booyah-badge px-2.5 py-1 rounded text-xs font-mono tabular-nums">
                          ₹{match.prize_pool}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors truncate">
                          {match.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-white/60 font-mono tabular-nums">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {match.joined_players}/{match.max_players} Slots
                        </span>
                        <span>
                          Per Kill: <strong className="text-emerald-400">₹{match.per_kill_prize || 5}</strong>
                        </span>
                        <span className="text-amber-300">
                          {match.match_time?.toDate?.()
                            ? new Date(match.match_time.toDate()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Open Lobby'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/50">
                          Entry: <strong className="text-white font-mono tabular-nums">₹{match.entry_fee}</strong>
                        </span>
                        <span className="text-xs font-display font-bold uppercase tracking-wider text-amber-400 group-hover:translate-x-0.5 transition-transform">
                          1-Click Join →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-2 hud-card p-12 text-center space-y-3">
                <Trophy className="w-10 h-10 text-amber-400/50 mx-auto" />
                <p className="text-white/70 font-display font-bold text-lg uppercase">
                  No upcoming matches scheduled right now
                </p>
                <p className="text-xs text-white/40">
                  Check the Tournaments tab or join a Squad to prepare for the next Free Fire India battle!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-400" /> Top India Fraggers
          </h2>
          <div className="hud-card overflow-hidden">
            {topPlayers.map((player, index) => {
              const vipAvatar = getVipDesignByName(player.username).avatarUrl;
              return (
                <Link
                  key={player.uid}
                  to={`/profile/${player.uid}`}
                  className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 font-display font-mono tabular-nums font-bold text-amber-400/60 text-xl">
                    0{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-amber-500/30">
                    <img
                      src={player.profile_photo || player.avatar_url || vipAvatar}
                      alt={player.username || 'Player'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-bold text-base truncate">{player.username || 'Player'}</p>
                      {player.is_admin && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-bold uppercase">
                          Staff
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45 font-mono tabular-nums">
                      {player.total_wins || 0} Booyahs · ₹{player.winnings || 0}
                    </p>
                  </div>
                  {index === 0 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                </Link>
              );
            })}
            <Link
              to="/leaderboard"
              className="block p-4 text-center text-xs font-display font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors bg-white/5"
            >
              View Full India Leaderboard →
            </Link>
          </div>

          {/* 24/7 Support Quick Card */}
          <div className="hud-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 text-amber-400 border border-amber-500/30">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase text-white">Direct 24/7 Support</h3>
                <p className="text-xs text-white/50">Instant help for custom rooms &amp; UPI payouts</p>
              </div>
            </div>
            <Link
              to="/support"
              className="block w-full py-2.5 text-center rounded-xl bg-white/10 hover:bg-primary hover:text-black text-xs font-display font-bold uppercase tracking-wider transition-all"
            >
              Open Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* "God Level" LAN & Travel Service + Interactive Qualification Tracker */}
      <section className="hud-card p-8 md:p-10 relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="booyah-badge inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] mb-3">
                <Plane className="w-3.5 h-3.5" /> God-Level LAN &amp; Travel Service
              </span>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-wide">
                4 Monthly Offline <span className="text-primary">India LAN Arenas</span>
              </h2>
              <p className="text-sm text-white/65 max-w-2xl mt-1">
                Top winners and leaderboard qualifiers are flown out to our offline arena events! Flights, 5-Star Hotel Accommodation, and Meals are{' '}
                <strong className="text-amber-300">100% Sponsored by ELITESTAR</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-display font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10">
                <Plane className="w-4 h-4 text-amber-400" /> Free Flights
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10">
                <Hotel className="w-4 h-4 text-amber-400" /> 5-Star Stay
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10">
                <Utensils className="w-4 h-4 text-amber-400" /> VIP Dining
              </div>
            </div>
          </div>

          {/* Interactive Player LAN Qualification Tracker Bar */}
          {user && (
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400">
                    Live LAN Qualification Tracker
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Your All-Expenses-Paid LAN Eligibility:{' '}
                    <span className="text-emerald-400 font-mono tabular-nums">{qualificationPercent}%</span>
                  </h3>
                </div>
                <span className="text-xs font-mono tabular-nums text-white/50">
                  {registeredLanIds.length} / 4 Monthly LANs Applied
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(15, qualificationPercent)}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    checkMatches
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">3+ Matches Played</p>
                    <p className="text-[10px] font-mono tabular-nums opacity-75">
                      Current: {user.total_matches || 0}/3
                    </p>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    checkWins
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">1+ Tournament Win</p>
                    <p className="text-[10px] font-mono tabular-nums opacity-75">
                      Current: {user.total_wins || 0}/1
                    </p>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    checkLevel
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">FF Level 40+ Verified</p>
                    <p className="text-[10px] font-mono tabular-nums opacity-75">
                      Level: {user.freefire_level || 50}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LAN_EVENTS.map((lan) => {
              const isApplied = registeredLanIds.includes(lan.id);
              return (
                <div
                  key={lan.id}
                  className="p-5 rounded-2xl bg-black/55 border border-white/10 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {lan.week}
                      </span>
                      <span className="text-sm font-display font-mono tabular-nums font-bold text-emerald-400">
                        {lan.prize}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-white text-lg leading-snug">{lan.title}</h3>
                    <p className="text-xs text-white/50 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {lan.city}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="space-y-1.5">
                      {lan.perks.map((perk) => (
                        <div key={perk} className="flex items-center gap-1.5 text-[11px] text-white/75">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>

                    {isApplied ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Qualifier Applied
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedLanEvent(lan)}
                        className="w-full py-2 rounded-xl bg-primary/20 hover:bg-primary text-amber-300 hover:text-black border border-primary/30 text-xs font-display font-bold uppercase tracking-wider transition-all"
                      >
                        Apply for LAN Slot →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LAN Qualifier Registration Modal */}
      <AnimatePresence>
        {selectedLanEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md hud-card p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    All-Expenses-Paid LAN Application
                  </span>
                  <h3 className="text-xl font-display font-bold text-white mt-0.5">
                    {selectedLanEvent.title}
                  </h3>
                  <p className="text-xs text-white/50">
                    {selectedLanEvent.city} · Prize Pool {selectedLanEvent.prize}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLanEvent(null)}
                  className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLanApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-1">
                    Your Departure City (For Free Flight Ticket)
                  </label>
                  <input
                    required
                    value={departureCity}
                    onChange={(e) => setDepartureCity(e.target.value)}
                    placeholder="e.g. Jaipur, Lucknow, Patna, Kolkata..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-1">
                    Squad Name (Optional)
                  </label>
                  <input
                    value={squadTag}
                    onChange={(e) => setSquadTag(e.target.value)}
                    placeholder="e.g. TEAM APEX / TOTAL GAMING"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-white/70 leading-relaxed">
                  Top leaderboard winners and qualified squads receive confirmed flight tickets, 5-star hotel rooms, and VIP catering directly from ELITESTAR.
                </div>
                <button
                  type="submit"
                  disabled={submittingLan}
                  className="w-full neon-button py-3 text-sm disabled:opacity-50"
                >
                  {submittingLan ? 'Submitting Application...' : 'Confirm LAN Qualifier Application'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
