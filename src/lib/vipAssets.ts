// 52 Unique 3D Esports Designs: 26 A-Z Avatars (DPs) & 26 A-Z Banners

export interface VipDesign {
  letter: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  avatarUrl: string;
  bannerUrl: string;
}

const LETTER_THEMES: Record<string, { title: string; c1: string; c2: string; c3: string }> = {
  A: { title: 'Apex Assassin', c1: '#FF6B00', c2: '#FF0055', c3: '#FFD700' },
  B: { title: 'Blaze Berserker', c1: '#00F0FF', c2: '#0051FF', c3: '#7000FF' },
  C: { title: 'Cyber Commander', c1: '#00FF87', c2: '#00B8FF', c3: '#0044FF' },
  D: { title: 'Dragon Dominator', c1: '#FF003C', c2: '#9900FF', c3: '#FF8A00' },
  E: { title: 'Elite Enforcer', c1: '#FF6B00', c2: '#FFB800', c3: '#FF0055' },
  F: { title: 'Frost Falcon', c1: '#00E5FF', c2: '#1200FF', c3: '#00FF9D' },
  G: { title: 'Ghost Gladiator', c1: '#9D00FF', c2: '#FF00C7', c3: '#00F0FF' },
  H: { title: 'Hyper Hunter', c1: '#FF3D00', c2: '#FFAB00', c3: '#FF0055' },
  I: { title: 'Inferno Immortal', c1: '#FF0055', c2: '#FF6B00', c3: '#FFEE00' },
  J: { title: 'Jade Juggernaut', c1: '#00FF66', c2: '#00994D', c3: '#CCFF00' },
  K: { title: 'Knight Kingpin', c1: '#FFD700', c2: '#FF6B00', c3: '#FF0033' },
  L: { title: 'Lethal Legend', c1: '#7000FF', c2: '#00F0FF', c3: '#FF00AA' },
  M: { title: 'Mythic Monarch', c1: '#FF007A', c2: '#7928CA', c3: '#FF8A00' },
  N: { title: 'Neon Ninja', c1: '#00FFEA', c2: '#7000FF', c3: '#FF0055' },
  O: { title: 'Omega Overlord', c1: '#FF5500', c2: '#CC00FF', c3: '#00E5FF' },
  P: { title: 'Phantom Predator', c1: '#FF0044', c2: '#5900FF', c3: '#00FFE1' },
  Q: { title: 'Quantum Quake', c1: '#00C8FF', c2: '#0047FF', c3: '#FF00D4' },
  R: { title: 'Rogue Reaper', c1: '#FF1E00', c2: '#990000', c3: '#FFB800' },
  S: { title: 'Shadow Striker', c1: '#FF6B00', c2: '#7000FF', c3: '#00F0FF' },
  T: { title: 'Titan Tempest', c1: '#00B4DB', c2: '#0083B0', c3: '#FFD700' },
  U: { title: 'Ultra Vanguard', c1: '#A800FF', c2: '#FF0066', c3: '#00FFCC' },
  V: { title: 'Venom Viper', c1: '#39FF14', c2: '#008F11', c3: '#00F0FF' },
  W: { title: 'Warlord Wraith', c1: '#FF4500', c2: '#8B0000', c3: '#FFD700' },
  X: { title: 'Xeno X-Calibur', c1: '#FF00AA', c2: '#00F0FF', c3: '#FF6B00' },
  Y: { title: 'Yakuza Ymir', c1: '#FFB800', c2: '#FF0055', c3: '#7000FF' },
  Z: { title: 'Zero-G Zealot', c1: '#00F0FF', c2: '#FF0055', c3: '#FFD700' },
};

function create3DAvatarSvg(letter: string, title: string, c1: string, c2: string, c3: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <radialGradient id="bg_${letter}" cx="50%" cy="35%" r="75%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.45"/>
        <stop offset="55%" stop-color="#12121a" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#07070b" stop-opacity="1"/>
      </radialGradient>
      <linearGradient id="grad3d_${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="25%" stop-color="${c3}"/>
        <stop offset="65%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <linearGradient id="rim_${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="50%" stop-color="${c3}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <filter id="glow_${letter}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.85"/>
        <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="${c1}" flood-opacity="0.65"/>
      </filter>
    </defs>
    <rect width="400" height="400" rx="48" fill="url(#bg_${letter})"/>
    <circle cx="200" cy="200" r="170" fill="none" stroke="url(#rim_${letter})" stroke-width="3" opacity="0.35" stroke-dasharray="18 8"/>
    <polygon points="200,26 350,113 350,287 200,374 50,287 50,113" fill="none" stroke="url(#rim_${letter})" stroke-width="6" opacity="0.8"/>
    <polygon points="200,44 334,122 334,278 200,356 66,278 66,122" fill="#0b0b12" fill-opacity="0.7" stroke="${c3}" stroke-width="1.5" opacity="0.6"/>
    <!-- 3D Extrusion Shadow Layer -->
    <text x="206" y="268" text-anchor="middle" font-family="'Space Grotesk', 'Impact', sans-serif" font-weight="900" font-size="210" fill="${c2}" opacity="0.55">${letter}</text>
    <text x="203" y="264" text-anchor="middle" font-family="'Space Grotesk', 'Impact', sans-serif" font-weight="900" font-size="210" fill="#000000" opacity="0.8">${letter}</text>
    <!-- Main 3D Metallic Letter -->
    <text x="200" y="260" text-anchor="middle" font-family="'Space Grotesk', 'Impact', sans-serif" font-weight="900" font-size="210" fill="url(#grad3d_${letter})" stroke="#ffffff" stroke-width="2" filter="url(#glow_${letter})">${letter}</text>
    <!-- VIP Bottom Tag -->
    <rect x="95" y="322" width="210" height="32" rx="16" fill="#09090f" stroke="url(#rim_${letter})" stroke-width="2"/>
    <text x="200" y="343" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="13" fill="#ffffff" letter-spacing="2">${title.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function create3DBannerSvg(letter: string, title: string, c1: string, c2: string, c3: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
    <defs>
      <linearGradient id="b_bg_${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#07070c"/>
        <stop offset="45%" stop-color="#12121e"/>
        <stop offset="100%" stop-color="#08080c"/>
      </linearGradient>
      <linearGradient id="b_accent_${letter}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="${c2}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${c3}" stop-opacity="0.2"/>
      </linearGradient>
      <linearGradient id="b_text_${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="${c3}"/>
        <stop offset="100%" stop-color="${c1}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="400" fill="url(#b_bg_${letter})"/>
    <!-- Cyberpunk Grid & Angled Slashes -->
    <path d="M-100,400 L350,0 L650,0 L200,400 Z" fill="url(#b_accent_${letter})" opacity="0.35"/>
    <path d="M550,400 L950,0 L1100,0 L700,400 Z" fill="url(#b_accent_${letter})" opacity="0.2"/>
    <circle cx="950" cy="200" r="260" fill="${c1}" opacity="0.18"/>
    <circle cx="250" cy="120" r="180" fill="${c2}" opacity="0.15"/>
    <!-- Giant 3D Watermark Letter on Right -->
    <text x="980" y="340" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="360" fill="url(#b_text_${letter})" opacity="0.22">${letter}</text>
    <!-- Center-Right Esports Crest -->
    <g transform="translate(520, 75)">
      <rect x="0" y="0" width="140" height="30" rx="6" fill="${c1}"/>
      <text x="70" y="20" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="13" fill="#ffffff" letter-spacing="3">ELITESTAR VIP</text>
      <text x="0" y="105" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="68" fill="url(#b_text_${letter})" letter-spacing="4">${title.toUpperCase()}</text>
      <text x="4" y="145" font-family="'Inter', sans-serif" font-weight="600" font-size="18" fill="#ffffff" opacity="0.6" letter-spacing="6">PRO SERIES • 3D EDITION [${letter}]</text>
      <line x1="0" y1="170" x2="480" y2="170" stroke="${c1}" stroke-width="3" opacity="0.7"/>
    </g>
    <rect x="0" y="392" width="1200" height="8" fill="url(#b_accent_${letter})"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const VIP_AZ_DESIGNS: VipDesign[] = Object.entries(LETTER_THEMES).map(([letter, t]) => ({
  letter,
  title: t.title,
  primaryColor: t.c1,
  secondaryColor: t.c2,
  accentColor: t.c3,
  avatarUrl: create3DAvatarSvg(letter, t.title, t.c1, t.c2, t.c3),
  bannerUrl: create3DBannerSvg(letter, t.title, t.c1, t.c2, t.c3),
}));

export function getVipDesignByName(username?: string): VipDesign {
  const firstChar = (username?.trim()?.[0] || 'E').toUpperCase();
  const found = VIP_AZ_DESIGNS.find((d) => d.letter === firstChar);
  return found || VIP_AZ_DESIGNS[4]; // Default 'E' for ELITESTAR
}
