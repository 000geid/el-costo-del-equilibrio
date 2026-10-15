import { useId } from 'react';
import type { Mode, PortraitSpec } from '../../engine/types';

const SKIN = ['#f3d2b3', '#e3b48f', '#c98d63', '#a0663f', '#6e4428'];
const SKIN_SHADE = ['#dcb08f', '#c9946e', '#a9714a', '#82502f', '#55331d'];
const HAIR: Record<PortraitSpec['hairColor'], string> = {
  black: '#2a1f1a', brown: '#5b3a22', red: '#a8442a', blond: '#d6aa55', grey: '#9a958e', white: '#e6e1d6',
};

/** Oscurece/aclara un color hex. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export interface SceneSpec {
  mode: Mode;
  colors: [string, string, string];
  emblem: string;
}

interface Props {
  spec: PortraitSpec;
  scene: SceneSpec;
  title?: string;
}

/** Retrato ilustrado en SVG: escena de fondo + busto del personaje + objeto que sostiene. */
export function Portrait({ spec, scene, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const skin = SKIN[spec.skin];
  const skinShade = SKIN_SHADE[spec.skin];
  const hair = HAIR[spec.hairColor];
  const hairDark = shade(hair, -0.12);
  const outfit = spec.outfit;
  const trim = spec.trim ?? '#d9b45a';
  const old = spec.age === 'old';
  const young = spec.age === 'young';
  const headCovered = spec.hat === 'hood' || spec.hat === 'scarf';

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className="portrait-svg">
      <defs>
        <radialGradient id={`vig${uid}`} cx="50%" cy="40%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <clipPath id={`frame${uid}`}>
          <rect x="0" y="0" width="200" height="200" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#frame${uid})`}>
        {scene.mode === 'macro' ? <CouncilScene scene={scene} /> : <ShopScene scene={scene} />}

        {/* Pelo largo / trenza por detrás */}
        {!headCovered && spec.hair === 'long' && (
          <path d="M62 92 C58 50 88 44 100 44 C114 44 144 50 138 92 L142 152 C130 158 120 152 117 140 L83 140 C80 152 70 158 58 152 Z" fill={hair} />
        )}
        {spec.hat === 'hood' && (
          <path d="M56 150 C44 70 74 36 100 36 C126 36 156 70 144 150 Z" fill={shade(outfit, -0.18)} />
        )}

        {/* Torso */}
        <path d="M26 200 C28 160 58 138 100 138 C142 138 172 160 174 200 Z" fill={outfit} />
        <path d="M100 138 C142 138 172 160 174 200 L100 200 Z" fill="#000" opacity="0.13" />
        <path d="M40 200 C44 176 56 162 70 156" stroke={shade(outfit, -0.2)} strokeWidth="3" fill="none" opacity="0.6" />
        <path d="M160 200 C156 176 144 162 130 156" stroke={shade(outfit, -0.25)} strokeWidth="3" fill="none" opacity="0.6" />
        {/* Cuello */}
        <path d="M88 116 L88 142 Q100 150 112 142 L112 116 Z" fill={skinShade} />
        {/* Ribete del cuello */}
        <path d="M78 140 L100 168 L122 140" stroke={trim} strokeWidth="6" fill="none" strokeLinejoin="round" />
        <circle cx="100" cy="178" r="4.5" fill={trim} stroke={shade(trim, -0.3)} strokeWidth="1.2" />

        {/* Orejas */}
        <ellipse cx="70" cy="96" rx="6" ry="9" fill={skinShade} />
        <ellipse cx="130" cy="96" rx="6" ry="9" fill={skinShade} />
        {/* Cabeza */}
        <ellipse cx="100" cy="92" rx="30" ry={young ? 34 : 36} fill={skin} />
        <path d="M118 62 C134 74 134 112 116 124 C126 108 128 82 118 62 Z" fill={skinShade} opacity="0.55" />

        {/* Barba completa (antes de la boca) */}
        {spec.beard === 'full' && (
          <path d="M71 98 C72 138 90 150 100 150 C110 150 128 138 129 98 C124 116 114 122 100 122 C86 122 76 116 71 98 Z" fill={hair} />
        )}

        {/* Cara */}
        <g>
          <path d={`M82 ${old ? 84 : 83} Q88 ${old ? 81 : 79} 94 ${old ? 84 : 83}`} stroke={hairDark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d={`M106 ${old ? 84 : 83} Q112 ${old ? 81 : 79} 118 ${old ? 84 : 83}`} stroke={hairDark} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <ellipse cx="88" cy="93" rx="3.4" ry={old ? 2.6 : 4} fill="#2a1f1a" />
          <ellipse cx="112" cy="93" rx="3.4" ry={old ? 2.6 : 4} fill="#2a1f1a" />
          <circle cx="89.2" cy="91.6" r="1" fill="#fff" opacity="0.85" />
          <circle cx="113.2" cy="91.6" r="1" fill="#fff" opacity="0.85" />
          <path d="M100 96 Q105 106 99 108" stroke={skinShade} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="81" cy="106" r="5" fill="#e07a6a" opacity="0.22" />
          <circle cx="119" cy="106" r="5" fill="#e07a6a" opacity="0.22" />
          {spec.beard !== 'full' && (
            <path d="M92 116 Q100 121 108 116" stroke="#7a3b2e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          )}
          {spec.beard === 'full' && <path d="M93 118 Q100 122 107 118" stroke="#3a1f18" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
          {old && (
            <g stroke={skinShade} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.9">
              <path d="M84 70 Q100 66 116 70" />
              <path d="M88 75 Q100 72 112 75" />
              <path d="M82 100 Q85 102 88 101" />
              <path d="M112 101 Q115 102 118 100" />
              <path d="M90 112 Q88 116 90 120" />
              <path d="M110 112 Q112 116 110 120" />
            </g>
          )}
        </g>
        {spec.beard === 'mustache' && <path d="M88 113 Q94 107 100 111 Q106 107 112 113 Q106 116 100 114 Q94 116 88 113 Z" fill={hair} />}
        {spec.beard === 'goatee' && (
          <>
            <path d="M90 112 Q100 108 110 112 Q100 115 90 112 Z" fill={hair} />
            <path d="M94 124 Q100 138 106 124 Z" fill={hair} />
          </>
        )}
        {spec.glasses && (
          <g stroke="#3a2a1a" strokeWidth="1.8" fill="#cfe3ea" fillOpacity="0.25">
            <circle cx="88" cy="93" r="8" />
            <circle cx="112" cy="93" r="8" />
            <path d="M96 93 Q100 90 104 93" fill="none" />
          </g>
        )}

        {/* Pelo frontal */}
        {!headCovered && <HairFront style={spec.hair} color={hair} dark={hairDark} />}
        {/* Sombreros */}
        <Hat kind={spec.hat} outfit={outfit} trim={trim} />

        {/* Mano + objeto */}
        {spec.prop && (
          <path d="M112 204 Q130 200 138 188" stroke={shade(outfit, -0.06)} strokeWidth="17" strokeLinecap="round" fill="none" />
        )}
        {spec.prop && (
          <g transform="translate(128 140)">
            <Prop kind={spec.prop} />
            <ellipse cx="10" cy="46" rx="11" ry="9" fill={skin} stroke={skinShade} strokeWidth="1.5" />
          </g>
        )}
        <rect x="0" y="0" width="200" height="200" fill={`url(#vig${uid})`} />
      </g>
    </svg>
  );
}

function HairFront({ style, color, dark }: { style: PortraitSpec['hair']; color: string; dark: string }) {
  switch (style) {
    case 'short':
      return <path d="M68 94 C64 58 86 50 100 50 C120 50 138 60 132 94 C128 74 116 64 100 66 C86 66 74 74 68 94 Z" fill={color} />;
    case 'long':
      return <path d="M68 96 C64 56 88 50 100 50 C118 50 138 58 132 96 C126 70 110 62 98 64 C88 72 76 78 68 96 Z" fill={color} />;
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="100" cy="48" r="14" />
          <path d="M68 92 C66 60 86 54 100 54 C116 54 136 60 132 92 C126 72 114 66 100 66 C86 66 74 72 68 92 Z" />
          <path d="M90 46 Q100 40 110 46" stroke={dark} strokeWidth="2" fill="none" />
        </g>
      );
    case 'bald':
      return (
        <g fill={color}>
          <path d="M70 100 C66 86 70 78 74 76 L76 98 Z" />
          <path d="M130 100 C134 86 130 78 126 76 L124 98 Z" />
        </g>
      );
    case 'curly': {
      const pts = [[70, 86], [72, 72], [80, 61], [92, 54], [105, 53], [118, 57], [127, 66], [131, 79], [131, 90], [86, 64], [100, 62], [114, 64]];
      return (
        <g fill={color}>
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} />)}
          {pts.slice(0, 9).map(([x, y], i) => <circle key={`d${i}`} cx={x + 2} cy={y + 3} r={3} fill={dark} opacity="0.5" />)}
        </g>
      );
    }
    case 'braid':
      return (
        <g fill={color}>
          <path d="M68 94 C64 58 86 50 100 50 C120 50 138 60 132 94 C128 74 116 64 100 66 C86 66 74 74 68 94 Z" />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={133 + (i % 2)} cy={104 + i * 11} rx="6.5" ry="7" stroke={dark} strokeWidth="1.2" />
          ))}
        </g>
      );
  }
}

function Hat({ kind, outfit, trim }: { kind?: PortraitSpec['hat']; outfit: string; trim: string }) {
  switch (kind) {
    case 'crown':
      return (
        <g>
          <path d="M70 66 L72 40 L84 54 L92 34 L100 50 L108 34 L116 54 L128 40 L130 66 Z" fill="#d9b45a" stroke="#8a6a2a" strokeWidth="2" strokeLinejoin="round" />
          <rect x="70" y="60" width="60" height="8" rx="2" fill="#c49a3a" />
          <circle cx="100" cy="63" r="3.5" fill="#b4483c" />
          <circle cx="84" cy="64" r="2.5" fill="#4f7a8c" />
          <circle cx="116" cy="64" r="2.5" fill="#4f7a8c" />
        </g>
      );
    case 'circlet':
      return (
        <g>
          <path d="M70 72 Q100 62 130 72" stroke="#d9b45a" strokeWidth="4" fill="none" />
          <path d="M96 66 L100 58 L104 66 L100 70 Z" fill="#4f7a8c" stroke="#8a6a2a" strokeWidth="1.2" />
        </g>
      );
    case 'hood':
      return <path d="M60 130 C54 72 78 44 100 44 C122 44 146 72 140 130 C136 96 124 68 100 68 C76 68 64 96 60 130 Z" fill={shade(outfit, -0.05)} stroke={shade(outfit, -0.3)} strokeWidth="1.5" />;
    case 'scarf':
      return (
        <g>
          <path d="M64 120 C58 64 82 46 100 46 C118 46 142 64 136 120 C130 88 120 70 100 70 C80 70 70 88 64 120 Z" fill={shade(trim, -0.1)} />
          <path d="M66 82 Q100 60 134 82" stroke={shade(trim, -0.3)} strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M128 118 L140 138 L130 140 Z" fill={shade(trim, -0.2)} />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M68 74 C68 52 86 46 100 46 C116 46 132 52 132 74 Z" fill={shade(outfit, 0.05)} />
          <path d="M66 74 Q100 82 140 72 L142 78 Q100 90 64 80 Z" fill={shade(outfit, -0.25)} />
          <circle cx="100" cy="47" r="3" fill={shade(outfit, -0.25)} />
        </g>
      );
    case 'beret':
      return (
        <g>
          <ellipse cx="94" cy="60" rx="38" ry="14" transform="rotate(-8 94 60)" fill={shade(outfit, -0.1)} />
          <path d="M70 68 Q100 74 128 64" stroke={shade(outfit, -0.35)} strokeWidth="3" fill="none" />
          <circle cx="90" cy="47" r="3" fill={shade(outfit, -0.3)} />
        </g>
      );
    case 'helmet':
      return (
        <g>
          <path d="M66 76 C66 46 86 40 100 40 C114 40 134 46 134 76 Z" fill="#a8b0b8" stroke="#6b737a" strokeWidth="2" />
          <path d="M60 76 L140 76 L136 82 L64 82 Z" fill="#8a929a" />
          <path d="M100 40 L100 76" stroke="#6b737a" strokeWidth="2" />
          <path d="M80 50 Q84 46 90 45" stroke="#fff" strokeWidth="2" opacity="0.5" fill="none" />
        </g>
      );
    case 'tophat':
      return (
        <g>
          <rect x="76" y="22" width="48" height="46" rx="3" fill="#2a2420" />
          <rect x="76" y="56" width="48" height="7" fill={trim} />
          <ellipse cx="100" cy="68" rx="38" ry="7" fill="#1d1916" />
        </g>
      );
    case 'chef':
      return (
        <g fill="#f5f1e6" stroke="#cfc6b0" strokeWidth="1.5">
          <circle cx="82" cy="50" r="14" />
          <circle cx="100" cy="42" r="16" />
          <circle cx="118" cy="50" r="14" />
          <rect x="72" y="52" width="56" height="20" rx="3" />
        </g>
      );
    default:
      return null;
  }
}

function Prop({ kind }: { kind: NonNullable<PortraitSpec['prop']> }) {
  switch (kind) {
    case 'scroll':
      return (
        <g>
          <rect x="-6" y="6" width="40" height="34" rx="2" fill="#efe2c2" stroke="#9c7a4a" strokeWidth="1.5" />
          <rect x="-10" y="2" width="48" height="7" rx="3.5" fill="#d8c49a" stroke="#9c7a4a" strokeWidth="1.5" />
          <rect x="-10" y="38" width="48" height="7" rx="3.5" fill="#d8c49a" stroke="#9c7a4a" strokeWidth="1.5" />
          {[16, 22, 28].map((y) => <path key={y} d={`M0 ${y} H28`} stroke="#8a6a4a" strokeWidth="1.3" />)}
          <circle cx="24" cy="34" r="3.5" fill="#a83232" />
        </g>
      );
    case 'plans':
      return (
        <g>
          <rect x="-12" y="4" width="50" height="38" fill="#3f6e9c" stroke="#244a6b" strokeWidth="1.5" transform="rotate(-6 13 23)" />
          <g stroke="#dfeaf2" strokeWidth="1.2" fill="none" transform="rotate(-6 13 23)">
            <path d="M-6 30 Q13 10 32 30" />
            <path d="M-6 30 H32" />
            <path d="M4 30 V20 M13 30 V16 M22 30 V20" />
          </g>
        </g>
      );
    case 'coins':
      return (
        <g fill="#d9b45a" stroke="#8a6a2a" strokeWidth="1.3">
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="12" cy={38 - i * 6} rx="15" ry="5" />)}
          <ellipse cx="30" cy="40" rx="9" ry="4" />
        </g>
      );
    case 'scale':
      return (
        <g stroke="#8a6a2a" strokeWidth="2" fill="#d9b45a">
          <path d="M12 6 V40" fill="none" />
          <path d="M-8 12 H32" fill="none" />
          <path d="M-14 26 Q-8 32 -2 26 Z" />
          <path d="M22 22 Q28 28 34 22 Z" />
          <path d="M-8 12 L-14 26 M-8 12 L-2 26 M28 12 L22 22 M28 12 L34 22" fill="none" strokeWidth="1" />
          <rect x="4" y="38" width="16" height="5" rx="1" />
        </g>
      );
    case 'magnifier':
      return (
        <g>
          <path d="M18 24 L8 44" stroke="#5a3a22" strokeWidth="6" strokeLinecap="round" />
          <circle cx="24" cy="14" r="13" fill="#cfe3ea" fillOpacity="0.5" stroke="#8a6a2a" strokeWidth="3.5" />
        </g>
      );
    case 'calendar':
      return (
        <g>
          <rect x="-8" y="2" width="42" height="40" rx="3" fill="#efe2c2" stroke="#8a6a4a" strokeWidth="1.5" />
          <rect x="-8" y="2" width="42" height="9" rx="3" fill="#a83232" />
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}${c}`} x={-4 + c * 7.6} y={15 + r * 6.5} width="5" height="4" fill={r === 2 && c === 3 ? '#a83232' : '#9c8a6a'} />
          )))}
        </g>
      );
    case 'bag':
      return (
        <g>
          <path d="M-6 14 H30 L34 44 H-10 Z" fill="#b48a5a" stroke="#7a5a3a" strokeWidth="1.5" />
          <path d="M2 14 Q12 2 22 14" stroke="#7a5a3a" strokeWidth="2.5" fill="none" />
          <ellipse cx="6" cy="12" rx="8" ry="5" fill="#d9a35a" />
          <path d="M18 14 L24 0 M20 14 L28 4" stroke="#5a8c3a" strokeWidth="3" />
        </g>
      );
    case 'sack':
      return (
        <g>
          <path d="M0 10 Q-14 40 4 46 H24 Q42 40 28 10 Z" fill="#c9ad7a" stroke="#8a6a4a" strokeWidth="1.5" />
          <path d="M2 10 Q14 4 26 10" stroke="#8a6a4a" strokeWidth="3" fill="none" />
          <g fill="#e0c48a">{[[8, 6], [14, 4], [20, 6]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.5" ry="1.6" />)}</g>
        </g>
      );
    case 'wrench':
      return (
        <g transform="rotate(30 12 24)">
          <rect x="8" y="10" width="8" height="38" rx="3" fill="#8a929a" stroke="#5a6268" strokeWidth="1.5" />
          <path d="M2 2 Q12 -6 22 2 L20 12 L16 8 L8 8 L4 12 Z" fill="#a8b0b8" stroke="#5a6268" strokeWidth="1.5" />
        </g>
      );
    case 'flask':
      return (
        <g>
          <path d="M6 0 H18 V12 L28 38 Q30 44 24 44 H0 Q-6 44 -4 38 L6 12 Z" fill="#cfe3ea" fillOpacity="0.7" stroke="#5a6b7a" strokeWidth="1.5" />
          <path d="M-2 32 L26 32 L28 38 Q30 44 24 44 H0 Q-6 44 -4 38 Z" fill="#b4483c" />
          <rect x="4" y="-4" width="16" height="6" rx="1" fill="#8a6a4a" />
        </g>
      );
    case 'sign':
      return (
        <g transform="translate(-6 -30)">
          <rect x="14" y="20" width="5" height="62" fill="#7a5a3a" />
          <rect x="-8" y="0" width="50" height="30" rx="2" fill="#efe2c2" stroke="#7a5a3a" strokeWidth="2" />
          <text x="17" y="22" textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="700" fontSize="18" fill="#a83232">%</text>
        </g>
      );
    case 'key':
      return (
        <g fill="none" stroke="#c9a03a" strokeWidth="4" strokeLinecap="round">
          <circle cx="12" cy="10" r="8" />
          <path d="M12 18 V44 M12 34 H20 M12 40 H18" />
        </g>
      );
    case 'book':
      return (
        <g>
          <rect x="-8" y="6" width="40" height="38" rx="2" fill="#6b2f2f" stroke="#3a1a1a" strokeWidth="1.5" />
          <rect x="-4" y="6" width="36" height="34" fill="#efe2c2" />
          <rect x="-8" y="6" width="36" height="34" rx="2" fill="#7a3434" />
          <path d="M2 14 H20 M2 18 H16" stroke="#d9b45a" strokeWidth="1.5" />
          <circle cx="10" cy="28" r="5" fill="none" stroke="#d9b45a" strokeWidth="1.5" />
        </g>
      );
    case 'banner':
      return (
        <g>
          <rect x="-10" y="0" width="48" height="40" rx="2" fill="#efe2c2" stroke="#7a5a3a" strokeWidth="1.5" />
          <path d="M-4 32 L6 22 L14 26 L24 12 L32 16" stroke="#3f6e3a" strokeWidth="2.5" fill="none" />
          <path d="M-4 34 H34 M-4 6 V34" stroke="#7a5a3a" strokeWidth="1" />
        </g>
      );
    case 'map':
      return (
        <g>
          <path d="M-12 6 L2 2 L16 6 L32 2 L32 40 L16 44 L2 40 L-12 44 Z" fill="#e8d6a8" stroke="#8a6a4a" strokeWidth="1.5" />
          <path d="M2 2 V40 M16 6 V44" stroke="#8a6a4a" strokeWidth="1" />
          <path d="M-6 30 Q4 18 12 26 T28 14" stroke="#a83232" strokeWidth="1.8" strokeDasharray="3 2" fill="none" />
          <circle cx="28" cy="14" r="2.5" fill="#a83232" />
        </g>
      );
    case 'chest':
      return (
        <g>
          <rect x="-10" y="16" width="46" height="28" rx="2" fill="#7a4a22" stroke="#3a2210" strokeWidth="1.5" />
          <path d="M-10 18 Q13 0 36 18 Z" fill="#8a5a2a" stroke="#3a2210" strokeWidth="1.5" />
          <rect x="-10" y="22" width="46" height="4" fill="#c9a03a" />
          <rect x="9" y="22" width="8" height="10" fill="#d9b45a" stroke="#8a6a2a" />
          <ellipse cx="13" cy="14" rx="10" ry="3" fill="#e8c860" opacity="0.8" />
        </g>
      );
    case 'hourglass':
      return (
        <g>
          <rect x="-4" y="0" width="32" height="5" rx="1" fill="#7a5a3a" />
          <rect x="-4" y="40" width="32" height="5" rx="1" fill="#7a5a3a" />
          <path d="M0 5 H24 L14 22 L24 40 H0 L10 22 Z" fill="#cfe3ea" fillOpacity="0.5" stroke="#7a5a3a" strokeWidth="1.5" />
          <path d="M4 38 H20 L12 30 Z M8 10 H16 L12 16 Z" fill="#d9b45a" />
        </g>
      );
    case 'tablet':
      return (
        <g>
          <rect x="-8" y="0" width="40" height="44" rx="3" fill="#8a5a2a" stroke="#4a2a10" strokeWidth="1.5" />
          <rect x="-4" y="6" width="32" height="34" fill="#efe2c2" />
          <rect x="6" y="-3" width="12" height="6" rx="1" fill="#a8b0b8" />
          {[12, 18, 24, 30].map((y) => <path key={y} d={`M0 ${y} H${y === 30 ? 14 : 24}`} stroke="#8a6a4a" strokeWidth="1.3" />)}
        </g>
      );
    case 'basket':
      return (
        <g>
          <path d="M-10 18 H36 L30 44 H-4 Z" fill="#b4884a" stroke="#7a5a2a" strokeWidth="1.5" />
          <path d="M-6 26 H32 M-4 34 H30" stroke="#7a5a2a" strokeWidth="1" />
          <path d="M-4 18 Q13 -4 30 18" stroke="#7a5a2a" strokeWidth="2.5" fill="none" />
          <circle cx="2" cy="14" r="6" fill="#b4483c" />
          <circle cx="14" cy="12" r="6" fill="#d9a35a" />
          <circle cx="25" cy="15" r="5" fill="#6b8c3a" />
        </g>
      );
    case 'tools':
      return (
        <g transform="rotate(-20 12 24)">
          <rect x="9" y="12" width="6" height="36" rx="2" fill="#8a5a2a" />
          <rect x="-4" y="2" width="32" height="12" rx="2" fill="#8a929a" stroke="#5a6268" strokeWidth="1.5" />
        </g>
      );
    case 'seal':
      return (
        <g>
          <rect x="-10" y="10" width="44" height="34" rx="2" fill="#efe2c2" stroke="#9c7a4a" strokeWidth="1.5" />
          {[18, 24].map((y) => <path key={y} d={`M-4 ${y} H26`} stroke="#8a6a4a" strokeWidth="1.2" />)}
          <circle cx="22" cy="34" r="7" fill="#a83232" stroke="#6b1a1a" strokeWidth="1.2" />
          <path d="M19 34 L22 31 L25 34 L22 37 Z" fill="#6b1a1a" />
        </g>
      );
  }
}

/** Sala del consejo: muro de piedra, ventana en arco, estandarte con los colores del escenario y un mapa. */
function CouncilScene({ scene }: { scene: SceneSpec }) {
  const [c1, c2, c3] = scene.colors;
  return (
    <g>
      <rect width="200" height="200" fill="#6b5640" />
      {/* bloques de piedra */}
      <g stroke="#5a4632" strokeWidth="1.5" opacity="0.8">
        {[22, 50, 78, 106, 134, 162].map((y, r) => (
          <g key={y}>
            <path d={`M0 ${y} H200`} />
            {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${(i * 48 + (r % 2) * 24) % 200} ${y - 28} V${y}`} />)}
          </g>
        ))}
      </g>
      {/* ventana */}
      <path d="M14 120 V54 Q14 30 38 30 Q62 30 62 54 V120 Z" fill="#8fb3c4" stroke="#3a2a1a" strokeWidth="4" />
      <path d="M14 96 Q30 84 44 92 Q54 86 62 92 V120 H14 Z" fill="#6b8c5a" />
      <path d="M38 30 V120 M14 70 H62" stroke="#3a2a1a" strokeWidth="3" />
      {/* estandarte */}
      <g>
        <rect x="150" y="10" width="40" height="4" fill="#3a2a1a" />
        <path d="M154 14 H186 V84 L170 74 L154 84 Z" fill={c1} stroke="#3a2a1a" strokeWidth="1.5" />
        <rect x="154" y="36" width="32" height="14" fill={c2} />
        <circle cx="170" cy="43" r="5" fill={c3} />
      </g>
      {/* mapa en la pared */}
      <g transform="translate(70 18)">
        <rect width="62" height="40" fill="#e3cf9d" stroke="#5a3a1a" strokeWidth="2.5" />
        <path d="M8 30 Q14 10 26 16 T46 10 Q54 20 50 30 Z" fill="#b8a06a" opacity="0.8" />
        <path d="M12 26 L30 20 L44 28" stroke="#a83232" strokeWidth="1.3" strokeDasharray="2 2" fill="none" />
      </g>
      {/* mesa del consejo */}
      <rect x="0" y="170" width="200" height="30" fill="#4a2f1a" />
      <rect x="0" y="168" width="200" height="5" fill="#6b4422" />
    </g>
  );
}

/** Local del negocio: estantes de madera con objetos del rubro y cartel con los colores del negocio. */
function ShopScene({ scene }: { scene: SceneSpec }) {
  const [c1, c2, c3] = scene.colors;
  const item = (x: number, y: number, k: number) => <ShopItem key={`${x}-${y}`} kind={scene.emblem} x={x} y={y} c1={c1} c3={c3} alt={k % 2 === 1} />;
  return (
    <g>
      <rect width="200" height="200" fill={shade(c2, -0.18)} />
      <g opacity="0.25">
        {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 20} y="0" width="10" height="200" fill={shade(c2, -0.3)} />)}
      </g>
      {/* estantes */}
      {[58, 118].map((y) => (
        <g key={y}>
          <rect x="0" y={y} width="56" height="7" fill="#6b4422" />
          <rect x="144" y={y} width="56" height="7" fill="#6b4422" />
          <rect x="0" y={y + 7} width="56" height="3" fill="#3a2210" opacity="0.6" />
          <rect x="144" y={y + 7} width="56" height="3" fill="#3a2210" opacity="0.6" />
        </g>
      ))}
      {[10, 30, 154, 176].map((x, i) => item(x, 58, i))}
      {[12, 34, 156, 178].map((x, i) => item(x, 118, i + 1))}
      {/* cartel colgante */}
      <g>
        <path d="M80 0 V12 M120 0 V12" stroke="#3a2a1a" strokeWidth="2" />
        <rect x="70" y="12" width="60" height="22" rx="3" fill={c1} stroke="#3a2a1a" strokeWidth="2" />
        <rect x="76" y="17" width="48" height="12" rx="2" fill={c3} opacity="0.55" />
      </g>
      {/* mostrador */}
      <rect x="0" y="168" width="200" height="32" fill="#7a4a22" />
      <rect x="0" y="166" width="200" height="6" fill="#9a6232" />
      <path d="M0 184 H200" stroke="#5a3418" strokeWidth="2" />
    </g>
  );
}

function ShopItem({ kind, x, y, c1, c3, alt }: { kind: string; x: number; y: number; c1: string; c3: string; alt: boolean }) {
  switch (kind) {
    case 'bread':
      return alt
        ? <g><ellipse cx={x} cy={y - 6} rx="10" ry="6" fill="#c8873a" stroke="#7a4a22" strokeWidth="1.2" /><path d={`M${x - 5} ${y - 9} l3 4 M${x} ${y - 10} l3 4 M${x + 5} ${y - 9} l3 4`} stroke="#f3dfb5" strokeWidth="1.3" /></g>
        : <g><circle cx={x} cy={y - 7} r="7" fill="#d99a4a" stroke="#7a4a22" strokeWidth="1.2" /><circle cx={x - 2} cy={y - 9} r="2" fill="#f3dfb5" opacity="0.6" /></g>;
    case 'icecream':
      return (
        <g>
          <path d={`M${x - 6} ${y - 12} L${x} ${y} L${x + 6} ${y - 12} Z`} fill="#d9a35a" stroke="#8a5a2a" strokeWidth="1" />
          <circle cx={x} cy={y - 15} r="6.5" fill={alt ? c1 : c3} />
          {alt && <circle cx={x} cy={y - 22} r="5" fill="#fff6e8" />}
        </g>
      );
    case 'quill':
      return alt
        ? <g><rect x={x - 9} y={y - 20} width="18" height="20" fill={c1} stroke="#2a3a4a" strokeWidth="1" /><rect x={x - 6} y={y - 20} width="3" height="20" fill="#2a3a4a" opacity="0.4" /></g>
        : <g><rect x={x - 10} y={y - 14} width="20" height="12" rx="1" fill="#3a3a3a" /><rect x={x - 8} y={y - 12} width="16" height="8" fill="#8fb3c4" /><rect x={x - 12} y={y - 2} width="24" height="2" fill="#5a5a5a" /></g>;
    case 'vase':
      return (
        <path d={`M${x - 4} ${y - 20} H${x + 4} L${x + 3} ${y - 16} Q${x + 11} ${y - 10} ${x + 5} ${y} H${x - 5} Q${x - 11} ${y - 10} ${x - 3} ${y - 16} Z`}
          fill={alt ? '#b5603a' : '#5a6b4a'} stroke="#3a2a1a" strokeWidth="1" />
      );
    case 'gear':
      return alt
        ? <g><circle cx={x} cy={y - 9} r="8" fill="none" stroke="#8a929a" strokeWidth="4" strokeDasharray="3 2" /><circle cx={x} cy={y - 9} r="3" fill="#8a929a" /></g>
        : <g><rect x={x - 9} y={y - 10} width="18" height="10" rx="1" fill="#d98c2a" stroke="#7a4a12" strokeWidth="1" /><rect x={x - 3} y={y - 13} width="6" height="3" fill="#5a6b7a" /></g>;
    default:
      return null;
  }
}
