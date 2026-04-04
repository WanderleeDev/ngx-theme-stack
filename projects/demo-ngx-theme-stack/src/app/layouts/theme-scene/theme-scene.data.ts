// Compact star format: [top%, left%, sizePx, delaySec, durationSec, twinkle]
type StarTuple = [number, number, number, number, number, boolean];

// Compact cloud format: [top%, left%, bounceDurationSec, delaySec]
type CloudTuple = [number, number, number, number];

export interface Star {
  top: string;
  left: string;
  size: string;
  delay: string;
  duration: string;
  animation: string;
}

export interface Cloud {
  top: string;
  left: string;
  delay: string;
  animation: string;
}

const STAR_DATA: StarTuple[] = [
  // ── Top quarter ──
  [3,  55, 2, 0.1, 4.5, true ],
  [5,   5, 2, 0,   3,   true ],
  [5,  92, 1, 0.2, 3,   false],
  [8,  35, 2, 0.5, 5,   true ],
  [10, 75, 2, 3.5, 5,   true ],
  [12, 48, 3, 0.8, 6,   true ],
  [15, 12, 1, 1.2, 4,   false],
  [15, 40, 1, 3.9, 4,   false],
  [18, 62, 1, 1.5, 4,   false],
  [22, 80, 2, 3,   4.5, true ],
  // ── Second quarter ──
  [25, 25, 1, 2,   3.5, false],
  [28, 50, 1, 1.9, 4.5, false],
  [30, 65, 2, 0.4, 4,   true ],
  [35, 10, 2, 1,   4,   true ],
  [40, 30, 2, 1.8, 4,   true ],
  [42, 90, 1, 2.7, 3.5, false],
  [45,  5, 1, 2.5, 5.5, false],
  // ── Third quarter ──
  [50, 60, 2, 1.5, 4,   true ],
  [55, 15, 3, 0,   3,   true ],
  [55, 95, 1, 1.2, 3,   false],
  [60, 85, 3, 1.1, 5,   true ],
  [65, 40, 1, 3.2, 5,   false],
  // ── Bottom quarter ──
  [70, 10, 1, 0.5, 3.5, false],
  [72, 78, 1, 2.8, 4,   false],
  [75, 55, 1, 0.9, 4,   false],
  [80, 25, 2, 2.2, 6,   true ],
  [85, 70, 1, 0.3, 3,   false],
  [88, 12, 2, 0.7, 5.5, true ],
  [90, 42, 2, 1.4, 4,   true ],
  [92,  5, 1, 2.1, 3.5, false],
];

const CLOUD_DATA: CloudTuple[] = [
  [12, 18, 12, 0],
  [15, 80, 18, 1],
  [28, 65, 15, 2],
  [45, 12, 10, 4],
  [65, 22, 14, 3],
];

export const STARS: Star[] = STAR_DATA.map(([t, l, s, dl, dr, tw]) => ({
  top: `${t}%`,
  left: `${l}%`,
  size: `${s}px`,
  delay: `${dl}s`,
  duration: `${dr}s`,
  animation: tw ? 'animate-twinkle' : 'animate-pulse',
}));

export const CLOUDS: Cloud[] = CLOUD_DATA.map(([t, l, dr, dl]) => ({
  top: `${t}%`,
  left: `${l}%`,
  delay: `${dl}s`,
  animation: `animate-[bounce_${dr}s_infinite]`,
}));
