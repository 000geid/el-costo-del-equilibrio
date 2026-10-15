import type { StatMeta } from '../../data/stats';

/** Silueta de cada indicador. Se usa como máscara para el relleno vertical (estilo Reigns). */
export function StatGlyph({ icon }: { icon: StatMeta['icon'] }) {
  switch (icon) {
    case 'gear':
      return (
        <path d="M27 5 h6 l1.5 6.5 4.5 1.9 5.7-3.6 4.2 4.2-3.6 5.7 1.9 4.5 6.5 1.5 v6 l-6.5 1.5-1.9 4.5 3.6 5.7-4.2 4.2-5.7-3.6-4.5 1.9-1.5 6.5 h-6 l-1.5-6.5-4.5-1.9-5.7 3.6-4.2-4.2 3.6-5.7-1.9-4.5-6.5-1.5 v-6 l6.5-1.5 1.9-4.5-3.6-5.7 4.2-4.2 5.7 3.6 4.5-1.9 Z M30 21 a9 9 0 1 0 0.01 0 Z"
          fillRule="evenodd" />
      );
    case 'chest':
      return <path d="M8 26 Q8 10 30 10 Q52 10 52 26 Z M8 29 H52 V52 H8 Z M26 30 h8 v10 h-8 Z" fillRule="evenodd" />;
    case 'heart':
      return <path d="M30 52 C8 38 4 26 8 18 C12 9 25 8 30 18 C35 8 48 9 52 18 C56 26 52 38 30 52 Z" />;
    case 'scale':
      return (
        <path d="M28 8 h4 v8 h16 v4 h-2 l7 16 q-7 7-14 0 l7-16 h-11 v26 h8 v4 h-26 v-4 h8 v-26 h-11 l7 16 q-7 7-14 0 l7-16 h-2 v-4 h16 Z" />
      );
    case 'coins':
      return (
        <g>
          <ellipse cx="24" cy="44" rx="16" ry="6" />
          <rect x="8" y="30" width="32" height="14" />
          <ellipse cx="24" cy="30" rx="16" ry="6" />
          <ellipse cx="38" cy="26" rx="14" ry="5" />
          <rect x="24" y="14" width="28" height="12" />
          <ellipse cx="38" cy="14" rx="14" ry="5" />
        </g>
      );
    case 'people':
      return (
        <g>
          <circle cx="30" cy="14" r="8" />
          <circle cx="14" cy="22" r="6.5" />
          <circle cx="46" cy="22" r="6.5" />
          <path d="M16 54 Q16 26 30 26 Q44 26 44 54 Z" />
          <path d="M2 54 Q2 32 14 32 Q22 32 24 38 Q18 44 18 54 Z" />
          <path d="M58 54 Q58 32 46 32 Q38 32 36 38 Q42 44 42 54 Z" />
        </g>
      );
    case 'basket':
      return (
        <path d="M18 24 L26 8 L30 10 L23 24 Z M42 24 L34 8 L30 10 L37 24 Z M4 24 H56 V30 H52 L47 54 H13 L8 30 H4 Z M18 34 V48 H22 V34 Z M28 34 V48 H32 V34 Z M38 34 V48 H42 V34 Z"
          fillRule="evenodd" />
      );
    case 'star':
      return <path d="M30 5 L37 22 L55 23 L41 35 L46 53 L30 43 L14 53 L19 35 L5 23 L23 22 Z" />;
  }
}

/** Indicador con relleno vertical proporcional al valor. */
export function StatMedallion({ meta, value, id }: { meta: StatMeta; value: number; id: string }) {
  const h = 60 * (Math.max(0, Math.min(100, value)) / 100);
  return (
    <svg viewBox="0 0 60 60" className="stat-medallion" aria-hidden="true">
      <defs>
        <mask id={`m-${id}`}>
          <rect width="60" height="60" fill="#000" />
          <g fill="#fff"><StatGlyph icon={meta.icon} /></g>
        </mask>
      </defs>
      <g mask={`url(#m-${id})`}>
        <rect width="60" height="60" fill="#3a2a1c" />
        <rect className="stat-fill" x="0" y={60 - h} width="60" height={h} fill={meta.color} />
      </g>
      <g fill="none" stroke="#e8d7ae" strokeWidth="1.4" opacity="0.65"><StatGlyph icon={meta.icon} /></g>
    </svg>
  );
}

/** Balanza: símbolo principal del juego. */
export function ScaleLogo({ className, tilt = 0 }: { className?: string; tilt?: number }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bronze" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f0d48a" />
          <stop offset="0.5" stopColor="#c9a04a" />
          <stop offset="1" stopColor="#8a6a2a" />
        </linearGradient>
      </defs>
      <g stroke="#5a3a12" strokeWidth="2">
        <path d="M94 30 h12 v100 h-12 Z" fill="url(#bronze)" />
        <path d="M70 140 h60 l-8 -12 h-44 Z" fill="url(#bronze)" />
        <circle cx="100" cy="24" r="10" fill="url(#bronze)" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '100px 40px', transition: 'transform 600ms ease' }} className="scale-beam">
          <path d="M20 38 h160 v6 h-160 Z" fill="url(#bronze)" />
          <path d="M28 44 L12 92 M28 44 L44 92 M172 44 L156 92 M172 44 L188 92" fill="none" strokeWidth="1.5" />
          <path d="M6 92 Q28 112 50 92 Z" fill="url(#bronze)" />
          <path d="M150 92 Q172 112 194 92 Z" fill="url(#bronze)" />
          <circle cx="20" cy="86" r="5" fill="#f0d48a" stroke="#8a6a2a" />
          <circle cx="30" cy="84" r="5" fill="#f0d48a" stroke="#8a6a2a" />
          <circle cx="25" cy="78" r="5" fill="#f0d48a" stroke="#8a6a2a" />
          <path d="M162 88 l10 -14 l10 14 Z" fill="#b4483c" stroke="#6b1a1a" />
        </g>
      </g>
    </svg>
  );
}

/** Emblema del escenario (escudo para países, cartel para negocios). */
export function Emblem({ colors, emblem, mode, size = 96 }: { colors: [string, string, string]; emblem: string; mode: 'macro' | 'micro'; size?: number }) {
  const [c1, c2, c3] = colors;
  const symbol = (() => {
    switch (emblem) {
      case 'sun':
        return (
          <g fill={c3} stroke="#8a5a0a" strokeWidth="1">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d="M50 26 L53 36 L47 36 Z" transform={`rotate(${i * 30} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="10" />
          </g>
        );
      case 'star':
        return <path d="M50 30 L55 45 L71 45 L58 54 L63 70 L50 60 L37 70 L42 54 L29 45 L45 45 Z" fill={c2} stroke="#1a1a3a" strokeWidth="1" />;
      case 'globe':
        return (
          <g>
            <circle cx="50" cy="50" r="16" fill={c3} />
            <path d="M34 48 Q50 40 66 52" stroke={c2 === '#ffdf00' ? '#f4f1e6' : c2} strokeWidth="4" fill="none" />
          </g>
        );
      case 'tower':
        return <path d="M40 70 V42 h4 v-6 h4 v6 h4 v-6 h4 v6 h4 V70 Z M47 70 v-10 a3 3 0 0 1 6 0 v10 Z" fill={c3} fillRule="evenodd" stroke="#4a0a0a" strokeWidth="1" />;
      case 'castle':
        return <path d="M32 70 V44 h6 v5 h5 v-5 h6 v-8 h4 v8 h6 v5 h5 v-5 h6 V70 Z" fill={c3 === c1 ? '#f1bf00' : c3} stroke="#5a3a0a" strokeWidth="1" />;
      case 'bread':
        return <g><ellipse cx="50" cy="52" rx="20" ry="11" fill="#c8873a" stroke="#5a3418" strokeWidth="1.5" /><path d="M38 48 l5 6 M48 46 l5 6 M58 48 l5 6" stroke="#f3dfb5" strokeWidth="2" /></g>;
      case 'icecream':
        return <g><path d="M40 50 L50 74 L60 50 Z" fill="#d9a35a" stroke="#8a5a2a" /><circle cx="50" cy="44" r="11" fill={c1} /><circle cx="50" cy="32" r="7" fill={c3} /></g>;
      case 'quill':
        return <g><path d="M62 28 Q40 36 40 66 L44 66 Q46 44 62 28 Z" fill="#f4f1e6" stroke="#2a3a4a" strokeWidth="1.5" /><path d="M40 66 L36 72" stroke="#2a3a4a" strokeWidth="2" /></g>;
      case 'vase':
        return <path d="M45 30 H55 L54 36 Q66 46 58 70 H42 Q34 46 46 36 Z" fill={c1} stroke="#3a2a1a" strokeWidth="1.5" />;
      case 'gear':
        return <g><circle cx="50" cy="50" r="14" fill="none" stroke={c3} strokeWidth="7" strokeDasharray="5 3.5" /><circle cx="50" cy="50" r="5" fill={c3} /></g>;
      default:
        return null;
    }
  })();
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true" className="emblem">
      {mode === 'macro' ? (
        <g>
          <path d="M10 8 H90 V52 Q90 88 50 104 Q10 88 10 52 Z" fill={c1} stroke="#5a3a12" strokeWidth="4" />
          <clipPath id={`shield-${emblem}`}><path d="M10 8 H90 V52 Q90 88 50 104 Q10 88 10 52 Z" /></clipPath>
          <path d="M10 36 H90 V64 H10 Z" fill={c2} opacity="0.9" clipPath={`url(#shield-${emblem})`} />
          <path d="M10 8 H90 V52 Q90 88 50 104 Q10 88 10 52 Z" fill="none" stroke="#d9b45a" strokeWidth="2" transform="translate(4 4) scale(0.92)" />
        </g>
      ) : (
        <g>
          <path d="M30 0 V12 M70 0 V12" stroke="#3a2a1a" strokeWidth="3" />
          <rect x="6" y="12" width="88" height="80" rx="8" fill={c2} stroke="#5a3a12" strokeWidth="4" />
          <rect x="12" y="18" width="76" height="68" rx="5" fill="none" stroke={c1} strokeWidth="3" />
        </g>
      )}
      {symbol}
    </svg>
  );
}
