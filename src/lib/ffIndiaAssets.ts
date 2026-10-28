export interface FFIndiaNewsItem {
  id: string;
  title: string;
  category: 'OB Patch' | 'India Launch' | 'Yotta Servers' | 'Cultural Event';
  date: string;
  summary: string;
  highlights: string[];
  badge: string;
}

export interface FFIndiaEsportsStanding {
  rank: number;
  teamName: string;
  tag: string;
  matchesPlayed: number;
  booyahs: number;
  killPoints: number;
  placementPoints: number;
  totalPoints: number;
  recentForm: string;
  mvp: string;
}

export interface FFIndiaRedeemCode {
  code: string;
  reward: string;
  server: string;
  status: 'ACTIVE' | 'LIMITED';
  expiresIn: string;
}

export interface FFIndiaEventItem {
  id: string;
  title: string;
  dateRange: string;
  type: 'Festival Event' | 'Esports LAN' | 'OB Update' | 'Ranked Season';
  rewardHighlight: string;
  status: 'LIVE NOW' | 'UPCOMING';
}

export interface FFIndiaCreatorUpdate {
  id: string;
  creatorName: string;
  handle: string;
  subscribers: string;
  headline: string;
  topic: string;
  timestamp: string;
  verified: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface FFIndiaLivePayload {
  lastUpdated: string;
  patchVersion: string;
  serverRegion: string;
  releaseNews: FFIndiaNewsItem[];
  esportsTournamentName: string;
  esportsVenue: string;
  esportsPrizePool: string;
  esportsStandings: FFIndiaEsportsStanding[];
  redeemCodes: FFIndiaRedeemCode[];
  eventsCalendar: FFIndiaEventItem[];
  creatorPulse: FFIndiaCreatorUpdate[];
  sources: GroundingSource[];
}

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

// High-detail Free Fire India Tiranga Gold & Saffron Arena Hero Banner Artwork
export const FF_INDIA_HERO_ART = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 720" width="1600" height="720">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07080C"/>
      <stop offset="45%" stop-color="#111420"/>
      <stop offset="80%" stop-color="#1F1209"/>
      <stop offset="100%" stop-color="#091512"/>
    </linearGradient>
    <radialGradient id="saffronGlow" cx="68%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.52"/>
      <stop offset="45%" stop-color="#F59E0B" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#07080C" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="emeraldGlow" cx="88%" cy="78%" r="40%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#07080C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldArmor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
    <linearGradient id="tirangaBeam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#F8FAFC" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#10B981" stop-opacity="0.85"/>
    </linearGradient>
    <pattern id="hexGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M24 0 L48 14 L48 34 L24 48 L0 34 L0 14 Z" fill="none" stroke="#F59E0B" stroke-width="0.6" stroke-opacity="0.12"/>
    </pattern>
  </defs>

  <rect width="1600" height="720" fill="url(#bgGrad)"/>
  <rect width="1600" height="720" fill="url(#hexGrid)"/>
  <rect width="1600" height="720" fill="url(#saffronGlow)"/>
  <rect width="1600" height="720" fill="url(#emeraldGlow)"/>

  <!-- Tiranga Tactical Laser Horizon -->
  <path d="M0 540 L1600 410 L1600 416 L0 546 Z" fill="url(#tirangaBeam)" opacity="0.65"/>
  <path d="M250 720 L920 380 L1600 500 L1600 720 Z" fill="#0B0E17" opacity="0.85"/>

  <!-- Tactical Ashoka Chakra HUD Ring behind Squad -->
  <g transform="translate(1090, 310)" opacity="0.32">
    <circle r="230" fill="none" stroke="#F59E0B" stroke-width="2" stroke-dasharray="14 8"/>
    <circle r="195" fill="none" stroke="#FF6B00" stroke-width="3"/>
    <circle r="160" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-opacity="0.6"/>
    <g stroke="#F59E0B" stroke-width="1.5" opacity="0.65">
      <line x1="0" y1="-195" x2="0" y2="195"/>
      <line x1="-195" y1="0" x2="195" y2="0"/>
      <line x1="-138" y1="-138" x2="138" y2="138"/>
      <line x1="138" y1="-138" x2="-138" y2="138"/>
      <line x1="-74" y1="-180" x2="74" y2="180"/>
      <line x1="74" y1="-180" x2="-74" y2="180"/>
      <line x1="-180" y1="-74" x2="180" y2="74"/>
      <line x1="180" y1="-74" x2="-180" y2="74"/>
    </g>
  </g>

  <!-- Stadium Spotlights -->
  <polygon points="750,0 980,0 1180,550 580,550" fill="url(#saffronGlow)" opacity="0.45"/>
  <polygon points="1180,0 1380,0 1560,550 980,550" fill="url(#emeraldGlow)" opacity="0.35"/>

  <!-- 4-Player Free Fire India Tactical Squad Silhouettes & Golden Armor -->
  <!-- Flanker Left (Sniper / AWM) -->
  <g transform="translate(790, 235)">
    <path d="M40 70 L78 45 L112 70 L125 180 L105 320 L30 320 L18 180 Z" fill="#131826" stroke="#FF6B00" stroke-width="2"/>
    <circle cx="76" cy="28" r="24" fill="#1E2538" stroke="#F59E0B" stroke-width="2.5"/>
    <path d="M58 24 L94 24 L88 34 L64 34 Z" fill="#FF6B00"/>
    <!-- Sniper Rifle -->
    <rect x="-25" y="105" width="190" height="10" rx="3" transform="rotate(-14 70 110)" fill="#0F172A" stroke="#F59E0B" stroke-width="1.8"/>
  </g>

  <!-- Flanker Right (Rusher / MP40) -->
  <g transform="translate(1220, 225)">
    <path d="M35 65 L75 45 L115 65 L130 175 L112 330 L28 330 L15 175 Z" fill="#111827" stroke="#10B981" stroke-width="2"/>
    <circle cx="75" cy="26" r="24" fill="#1E2538" stroke="#10B981" stroke-width="2.5"/>
    <path d="M58 22 L92 22 L87 32 L63 32 Z" fill="#10B981"/>
    <path d="M45 78 L105 78 L95 135 L55 135 Z" fill="url(#goldArmor)" opacity="0.75"/>
  </g>

  <!-- Support Captain Left-Center -->
  <g transform="translate(915, 195)">
    <path d="M42 75 L90 48 L138 75 L154 205 L132 365 L35 365 L20 205 Z" fill="#171E30" stroke="#F59E0B" stroke-width="2.5"/>
    <circle cx="90" cy="26" r="28" fill="#1E293B" stroke="#F59E0B" stroke-width="2.5"/>
    <path d="M70 22 L110 22 L104 33 L76 33 Z" fill="#FDE047"/>
    <path d="M55 82 L125 82 L112 155 L68 155 Z" fill="url(#goldArmor)" opacity="0.85"/>
  </g>

  <!-- Center Booyah IGL Hero -->
  <g transform="translate(1045, 155)">
    <!-- Hero Cape / Tiranga Scarf -->
    <path d="M45 85 L155 85 L195 340 L15 340 Z" fill="#FF6B00" opacity="0.28"/>
    <!-- Torso & Tactical Gold Chestplate -->
    <path d="M48 80 L105 45 L162 80 L180 230 L152 410 L48 410 L25 230 Z" fill="#0F1422" stroke="url(#goldArmor)" stroke-width="3.5"/>
    <path d="M62 88 L148 88 L134 180 L76 180 Z" fill="url(#goldArmor)"/>
    <!-- Helmet & Visor -->
    <circle cx="105" cy="22" r="32" fill="#182032" stroke="url(#goldArmor)" stroke-width="3.5"/>
    <path d="M80 16 L130 16 L123 30 L87 30 Z" fill="#FF6B00"/>
    <!-- Glowing Booyah Wing Shoulders -->
    <polygon points="15,65 58,82 42,112 0,88" fill="url(#goldArmor)"/>
    <polygon points="195,65 152,82 168,112 210,88" fill="url(#goldArmor)"/>
  </g>

  <!-- Floating Golden Ember Particles -->
  <g fill="#FDE047" opacity="0.8">
    <circle cx="680" cy="180" r="3.5"/>
    <circle cx="740" cy="420" r="2.5"/>
    <circle cx="860" cy="120" r="4"/>
    <circle cx="1020" cy="90" r="3"/>
    <circle cx="1310" cy="140" r="4.5"/>
    <circle cx="1450" cy="280" r="3"/>
    <circle cx="1180" cy="480" r="3.5"/>
    <circle cx="950" cy="520" r="2.5"/>
  </g>

  <!-- HUD Telemetry Corner Crosshairs -->
  <g stroke="#F59E0B" stroke-width="2" fill="none" opacity="0.55">
    <path d="M40 40 L90 40 M40 40 L40 90"/>
    <path d="M1560 40 L1510 40 M1560 40 L1560 90"/>
    <path d="M40 680 L90 680 M40 680 L40 630"/>
    <path d="M1560 680 L1510 680 M1560 680 L1560 630"/>
  </g>
</svg>
`);

// Custom Map Artwork for Tournament Cards
export const FF_MAP_ART: Record<string, string> = {
  Bermuda: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="bermudaSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07131E"/>
          <stop offset="55%" stop-color="#0F293A"/>
          <stop offset="100%" stop-color="#FF6B00" stop-opacity="0.65"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bermudaSky)"/>
      <circle cx="620" cy="130" r="85" fill="#F59E0B" opacity="0.35"/>
      <circle cx="620" cy="130" r="55" fill="#FF6B00" opacity="0.65"/>
      <!-- Clock Tower & Peak Ridges -->
      <polygon points="0,340 190,220 360,310 540,185 730,290 800,250 800,450 0,450" fill="#0B1622"/>
      <rect x="495" y="125" width="38" height="110" fill="#162436" stroke="#F59E0B" stroke-width="2"/>
      <polygon points="488,125 514,85 540,125" fill="#FF6B00"/>
      <circle cx="514" cy="150" r="10" fill="#FDE047"/>
      <!-- HUD Grid Overlay -->
      <path d="M0 390 L800 390" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.5"/>
      <text x="36" y="64" fill="#F59E0B" font-family="monospace" font-weight="bold" font-size="20" letter-spacing="4">SECTOR // BERMUDA PEAK</text>
    </svg>
  `),
  Kalahari: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="kalaSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1A0E07"/>
          <stop offset="55%" stop-color="#431A08"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#kalaSky)"/>
      <circle cx="580" cy="140" r="75" fill="#FDE047" opacity="0.45"/>
      <!-- Refinery Rig & Red Canyon Dunes -->
      <polygon points="0,330 220,210 430,300 640,190 800,270 800,450 0,450" fill="#271107"/>
      <rect x="330" y="155" width="75" height="145" fill="#180C06" stroke="#FF6B00" stroke-width="2"/>
      <line x1="330" y1="155" x2="405" y2="300" stroke="#F59E0B" stroke-width="2"/>
      <line x1="405" y1="155" x2="330" y2="300" stroke="#F59E0B" stroke-width="2"/>
      <text x="36" y="64" fill="#FDE047" font-family="monospace" font-weight="bold" font-size="20" letter-spacing="4">SECTOR // KALAHARI REFINERY</text>
    </svg>
  `),
  Purgatory: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="purgSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07120E"/>
          <stop offset="60%" stop-color="#0D2821"/>
          <stop offset="100%" stop-color="#10B981" stop-opacity="0.55"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#purgSky)"/>
      <!-- Brasilia Suspension Bridge & Ziplines -->
      <path d="M80 310 L720 310" stroke="#F59E0B" stroke-width="5"/>
      <rect x="180" y="160" width="22" height="190" fill="#10B981"/>
      <rect x="590" y="160" width="22" height="190" fill="#10B981"/>
      <path d="M191 165 Q400 295 601 165" fill="none" stroke="#FDE047" stroke-width="3"/>
      <polygon points="0,350 800,350 800,450 0,450" fill="#060D0B"/>
      <text x="36" y="64" fill="#10B981" font-family="monospace" font-weight="bold" font-size="20" letter-spacing="4">SECTOR // PURGATORY BRASILIA</text>
    </svg>
  `),
  Alpine: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="alpSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09111E"/>
          <stop offset="55%" stop-color="#162B47"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#alpSky)"/>
      <polygon points="60,360 260,130 450,360" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <polygon points="330,360 550,110 760,360" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
      <polygon points="0,355 800,355 800,450 0,450" fill="#090D16"/>
      <text x="36" y="64" fill="#38BDF8" font-family="monospace" font-weight="bold" font-size="20" letter-spacing="4">SECTOR // ALPINE SNOWFALL</text>
    </svg>
  `),
  ClashSquad: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <linearGradient id="csSky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09080D"/>
          <stop offset="50%" stop-color="#261008"/>
          <stop offset="100%" stop-color="#FF6B00"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#csSky)"/>
      <circle cx="400" cy="225" r="135" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="16 8"/>
      <polygon points="360,145 455,225 360,305" fill="#FF6B00" opacity="0.8"/>
      <text x="36" y="64" fill="#FF6B00" font-family="monospace" font-weight="bold" font-size="20" letter-spacing="4">ARENA // 4V4 CLASH SQUAD</text>
    </svg>
  `),
};

export function getMapArtwork(mapName?: string, mode?: string): string {
  const normalizedMap = (mapName || '').toLowerCase();
  const normalizedMode = (mode || '').toLowerCase();
  if (normalizedMode.includes('cs') || normalizedMode.includes('clash') || normalizedMode.includes('4v4')) {
    return FF_MAP_ART.ClashSquad;
  }
  if (normalizedMap.includes('kalahari')) return FF_MAP_ART.Kalahari;
  if (normalizedMap.includes('purgatory')) return FF_MAP_ART.Purgatory;
  if (normalizedMap.includes('alpine') || normalizedMap.includes('nexterra')) return FF_MAP_ART.Alpine;
  return FF_MAP_ART.Bermuda;
}

export const INITIAL_FF_INDIA_LIVE_DATA: FFIndiaLivePayload = {
  lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  patchVersion: 'OB49 / OB50 India Standalone Build',
  serverRegion: 'Yotta Mumbai & Navi Mumbai Data Center (18ms Ping)',
  releaseNews: [
    {
      id: 'ff-in-launch-1',
      title: 'Free Fire India Standalone Client & Local Yotta Cloud Infrastructure Active',
      category: 'India Launch',
      date: '2026 Official Release Bulletin',
      summary:
        'Garena Free Fire India operates with full local Indian data residency powered by Yotta Cloud servers in Navi Mumbai, delivering ultra-low 15–22ms ping for tournament lobbies alongside MeitY-compliant security.',
      highlights: [
        'Dedicated Indian matchmaking nodes with anti-cheat kernel telemetry',
        'Seamless UID migration between Free Fire MAX & Free Fire India accounts',
        'Hindi, Tamil, Telugu, Marathi & Bengali tactical voice-pack integration',
      ],
      badge: 'VERIFIED RELEASE',
    },
    {
      id: 'ff-in-patch-2',
      title: 'OB Patch Meta Update: Character Reworks, Weapon Balance & Clash Squad Economy',
      category: 'OB Patch',
      date: 'Latest OB Patch Notes',
      summary:
        'Tactical weapon tuning for Indian competitive scrims adjusts Woodpecker armor penetration, buffs MP40 close-range mobility, and refines Alok, Orion, and Tatsuya cooldown timers for 4v4 Clash Squad.',
      highlights: [
        'MP40 & M1887 reload recovery speed increased by +6% in CS-Ranked',
        'Gloo Wall deploy responsiveness improved for sub-30ms Indian server ticks',
        'New Kalahari & Bermuda Peak zip-line rotations for custom esports rooms',
      ],
      badge: 'META PATCH',
    },
    {
      id: 'ff-in-rules-3',
      title: 'Responsible Gaming Playbook: Verification, Break Reminders & Daily Limits',
      category: 'Yotta Servers',
      date: 'Esports Integrity Standard',
      summary:
        'Free Fire India enforces built-in player wellness systems including parent-verified profiles for under-18 competitors, scheduled hydration/break reminders, and transparent daily top-up caps.',
      highlights: [
        'Mandatory OTP parental verification for junior division registrants',
        'Automated match-break alerts during marathon FFMIC qualifier blocks',
        'Zero-tolerance hardware ban waves for third-party GFX/macro scripts',
      ],
      badge: 'INDIA POLICY',
    },
    {
      id: 'ff-in-diwali-4',
      title: 'Bharat Booyah Festival & Tiranga Championship Bundles Revealed',
      category: 'Cultural Event',
      date: 'Seasonal India Exclusive',
      summary:
        'Exclusive Indian cultural bundles featuring Saffron & Gold Mythic armor, MS Dhoni Thala tribute emotes, and stadium LAN qualification tokens across daily Battle Royale missions.',
      highlights: [
        'Free Tiranga Parachute, Gold Awakening Katana & Booyah Day Gloo Wall',
        'Special Bermuda Clock Tower festive lighting in custom tournament rooms',
        'Double Guild Glory points for registered Indian 4-man squads',
      ],
      badge: 'INDIA EXCLUSIVE',
    },
  ],
  esportsTournamentName: 'Free Fire MAX India Cup (FFMIC) Championship Circuit',
  esportsVenue: 'Noida Indoor Stadium & Lucknow LAN Arena',
  esportsPrizePool: '₹1,00,00,000 Official Circuit Pool',
  esportsStandings: [
    {
      rank: 1,
      teamName: 'Team Apex Gaming',
      tag: 'APEX',
      matchesPlayed: 18,
      booyahs: 5,
      killPoints: 134,
      placementPoints: 98,
      totalPoints: 232,
      recentForm: 'FFMIC Fall Split Champions',
      mvp: 'APEX_Pahadi',
    },
    {
      rank: 2,
      teamName: 'Team Hind',
      tag: 'HIND',
      matchesPlayed: 18,
      booyahs: 4,
      killPoints: 126,
      placementPoints: 92,
      totalPoints: 218,
      recentForm: 'FFMIC Spring Split Winners',
      mvp: 'HIND_Killer',
    },
    {
      rank: 3,
      teamName: 'Total Gaming Esports',
      tag: 'TGE',
      matchesPlayed: 18,
      booyahs: 4,
      killPoints: 119,
      placementPoints: 89,
      totalPoints: 208,
      recentForm: 'Lucknow LAN Champions',
      mvp: 'TGE_MafiaBala',
    },
    {
      rank: 4,
      teamName: 'S8UL Esports FF',
      tag: 'S8UL',
      matchesPlayed: 18,
      booyahs: 3,
      killPoints: 115,
      placementPoints: 81,
      totalPoints: 196,
      recentForm: 'Top Fragger Squad',
      mvp: 'S8UL_Iconic',
    },
    {
      rank: 5,
      teamName: 'Orangutan Elite',
      tag: 'OG',
      matchesPlayed: 18,
      booyahs: 2,
      killPoints: 108,
      placementPoints: 76,
      totalPoints: 184,
      recentForm: 'Grand Finals Qualifier',
      mvp: 'OG_Vasiyo',
    },
    {
      rank: 6,
      teamName: 'Revenant XSpark',
      tag: 'RNTX',
      matchesPlayed: 18,
      booyahs: 2,
      killPoints: 99,
      placementPoints: 72,
      totalPoints: 171,
      recentForm: 'Consistent Top-4 Finisher',
      mvp: 'RNTX_Radhethakur',
    },
  ],
  redeemCodes: [
    {
      code: 'FFIN-2026-BOOY-AH99',
      reward: 'Tiranga Gold Gloo Wall + 2x Incubator Vouchers',
      server: 'India (IND)',
      status: 'ACTIVE',
      expiresIn: 'Valid Today (First 500 Claims)',
    },
    {
      code: 'FFMC-IND8-S8UL-APEX',
      reward: 'FFMIC Championship Jersey Bundle + Diamond Royale Crate',
      server: 'India (IND)',
      status: 'ACTIVE',
      expiresIn: '18 Hours Remaining',
    },
    {
      code: 'GARE-NAFF-MAX7-THAL',
      reward: 'MP40 Cobra Loot Crate + 1000 Universal Fragments',
      server: 'India / MAX',
      status: 'LIMITED',
      expiresIn: '12 Hours Remaining',
    },
    {
      code: 'YOTT-AFFI-NDIA-2026',
      reward: 'Bharat Emerald Parachute + Custom Room Card (2 Hrs)',
      server: 'India (IND)',
      status: 'ACTIVE',
      expiresIn: '24 Hours Remaining',
    },
  ],
  eventsCalendar: [
    {
      id: 'ev-1',
      title: 'FFMIC Open Qualifier Scrims & Custom Room Ladder',
      dateRange: 'Daily · 18:00 IST – 22:00 IST',
      type: 'Esports LAN',
      rewardHighlight: 'Direct Slot to Noida LAN Finals + ₹50,000 Weekly',
      status: 'LIVE NOW',
    },
    {
      id: 'ev-2',
      title: 'Tiranga Booyah Pass Season — Golden Chakram Awakening',
      dateRange: 'Active All Month',
      type: 'Festival Event',
      rewardHighlight: 'Mythic Saffron Samurai Bundle & Evo AK47 Tokens',
      status: 'LIVE NOW',
    },
    {
      id: 'ev-3',
      title: 'Clash Squad Ranked Season Split & Grandmaster Push',
      dateRange: 'Weekend Double Star Protection',
      type: 'Ranked Season',
      rewardHighlight: 'Golden Grandmaster Avatar Banner + M1887 Skin',
      status: 'UPCOMING',
    },
  ],
  creatorPulse: [
    {
      id: 'cr-1',
      creatorName: 'Total Gaming (Ajjubhai)',
      handle: '@TotalGaming093',
      subscribers: '44.2M+ Subscribers',
      headline: 'Hosts Free Fire India Custom Room Showmatch & Reviews OB Patch Meta',
      topic: 'Custom Scrims & OB Weapon Tier List',
      timestamp: 'Trending #1 in India Gaming',
      verified: true,
    },
    {
      id: 'cr-2',
      creatorName: 'Pahadi Gaming (Lokesh Karakoti)',
      handle: '@PahadiGaming',
      subscribers: '1.9M+ Subscribers',
      headline: 'Breaks Down FFMIC Grand Finals Double-AWM Sniper Rotations on Bermuda',
      topic: 'Pro Esports Sniper Masterclass',
      timestamp: 'Live Scrim Analysis',
      verified: true,
    },
    {
      id: 'cr-3',
      creatorName: 'Desi Gamers (Amitbhai)',
      handle: '@DesiGamers_',
      subscribers: '17.1M+ Subscribers',
      headline: '1v4 Clash Squad Challenge on Yotta 18ms Indian Server Lobby',
      topic: 'Clash Squad Ranked Challenge',
      timestamp: 'Featured Creator Stream',
      verified: true,
    },
    {
      id: 'cr-4',
      creatorName: 'Tonic & Badge 99',
      handle: '@Badge99ff',
      subscribers: '11.8M+ Subscribers',
      headline: 'Redeem Code Giveaway & Community Guild Wars Registration Open',
      topic: 'Guild Tournament & Giveaways',
      timestamp: 'Community Spotlight',
      verified: true,
    },
  ],
  sources: [
    { title: 'Free Fire MAX India Cup (FFMIC) Official Liquipedia & Garena Esports', uri: 'https://ff.garena.com' },
    { title: 'Garena Official Rewards Redemption Site', uri: 'https://reward.ff.garena.com' },
  ],
};
