import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AUTHOR, C, FONT } from './theme';

// ---------------------------------------------------------------- fond animé

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const x = 50 + Math.sin(frame / 90) * 25;
  const y = 30 + Math.cos(frame / 110) * 15;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(232,100,60,.35), transparent 45%),
          radial-gradient(circle at ${100 - x}% ${100 - y}%, rgba(80,110,255,.18), transparent 50%), ${C.bg}`,
      }}
    />
  );
};

// ---------------------------------------------------------------- icônes

export const AppIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill={C.accent} />
    <rect x="12" y="16" width="40" height="26" rx="3" fill="none" stroke="#fff" strokeWidth="4" />
    <path d="M28 24l8 5-8 5z" fill="#fff" />
    <path d="M24 50h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const BluetoothIcon: React.FC<{ size: number; color?: string }> = ({ size, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7l10 10-5 5V2l5 5L7 17" />
  </svg>
);

export const WifiIcon: React.FC<{ size: number; color?: string }> = ({ size, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
    <path d="M2 8.8a15 15 0 0 1 20 0" />
    <path d="M5 12.5a10 10 0 0 1 14 0" />
    <path d="M8.5 16a5 5 0 0 1 7 0" />
    <circle cx="12" cy="19.5" r="1.2" fill={color} />
  </svg>
);

export const LaptopIcon: React.FC<{ size: number; color?: string }> = ({ size, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="11" rx="1.5" />
    <path d="M2 19h20" />
    <path d="M10 8l4 2.5-4 2.5z" fill={color} />
  </svg>
);

const Chevron: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
  <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'right' ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
  </svg>
);

// ---------------------------------------------------------------- téléphone

export const Phone: React.FC<{ children: React.ReactNode; scale?: number; style?: React.CSSProperties }> = ({
  children,
  scale = 1,
  style,
}) => (
  <div
    style={{
      width: 560,
      height: 1140,
      borderRadius: 72,
      background: '#05060a',
      padding: 18,
      boxShadow: '0 40px 120px rgba(0,0,0,.6), 0 0 0 3px #2c313c, inset 0 0 0 2px #000',
      transform: `scale(${scale})`,
      ...style,
    }}
  >
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 56, overflow: 'hidden', background: C.bg }}>
      {children}
      <div style={{ position: 'absolute', top: 16, left: '50%', marginLeft: -60, width: 120, height: 32, borderRadius: 20, background: '#000' }} />
    </div>
  </div>
);

const StatusBar: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px 0', color: C.text, fontSize: 20, fontWeight: 600, height: 60 }}>
    <span>9:41</span>
    <span>●●● ▮</span>
  </div>
);

// « btonly » : en-tête de l'application PPT Bluetooth (pas d'onglets, badge bleu)
const AppHeader: React.FC<{ tab: 'bt' | 'wifi' | 'btonly' }> = ({ tab }) => tab === 'btonly' ? (
  <div style={{ padding: '6px 26px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: C.text }}>Télécommande PPT</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', background: '#2F6BFF', borderRadius: 99, padding: '3px 12px' }}>Bluetooth</div>
    </div>
    <div style={{ fontSize: 17, fontWeight: 700, color: C.accent, marginTop: -2 }}>Réalisé par : {AUTHOR}</div>
    <div style={{ fontSize: 16, color: C.muted, marginTop: 6 }}>Fonctionne sans Wi-Fi et sans rien installer sur le PC.</div>
  </div>
) : (
  <div style={{ padding: '6px 26px 0' }}>
    <div style={{ fontSize: 32, fontWeight: 700, color: C.text }}>Télécommande PPT</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: C.accent, marginTop: -4 }}>Réalisé par : {AUTHOR}</div>
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      {(['bt', 'wifi'] as const).map((t) => (
        <div
          key={t}
          style={{
            flex: 1, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 21, fontWeight: 600, color: C.text, background: tab === t ? C.accent : C.panel2,
          }}
        >
          {t === 'bt' ? 'Bluetooth' : 'Wi-Fi'}
        </div>
      ))}
    </div>
  </div>
);

const Pill: React.FC<{ label: string; bg?: string; color?: string }> = ({ label, bg = C.panel2, color = C.text }) => (
  <div style={{ flex: 'none', padding: '0 18px', height: 54, borderRadius: 14, background: bg, color, display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600 }}>
    {label}
  </div>
);

/** Effet d'appui : 0 = repos, 1 = enfoncé. */
const pressStyle = (p: number): React.CSSProperties => ({
  transform: `scale(${1 - p * 0.06})`,
  filter: `brightness(${1 + p * 0.35})`,
});

const Ripple: React.FC<{ t: number }> = ({ t }) =>
  t <= 0 || t >= 1 ? null : (
    <div
      style={{
        position: 'absolute', left: '50%', top: '50%', width: 300, height: 300, borderRadius: '50%',
        marginLeft: -150, marginTop: -150, background: 'rgba(255,255,255,.35)',
        transform: `scale(${0.2 + t * 1.4})`, opacity: 1 - t,
      }}
    />
  );

/** Progression d'un appui autour des images `taps` (valeur 0..1 et ondulation). */
export const usePress = (taps: number[]) => {
  const frame = useCurrentFrame();
  let press = 0;
  let ripple = -1;
  for (const t of taps) {
    const d = frame - t;
    if (d >= -3 && d <= 8) press = Math.max(press, interpolate(d, [-3, 0, 8], [0, 1, 0]));
    if (d >= 0 && d < 18) ripple = d / 18;
  }
  return { press, ripple };
};

export const BtRemoteScreen: React.FC<{ taps: number[]; timerFrom?: number; laser?: boolean; gyro?: boolean; btOnly?: boolean }> = ({
  taps, timerFrom = 0, laser = false, gyro = false, btOnly = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { press, ripple } = usePress(taps);
  const secs = Math.max(0, Math.floor((frame - timerFrom) / fps)) + 754;
  const timer = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div style={{ fontFamily: FONT, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader tab={btOnly ? 'btonly' : 'bt'} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 26px 30px', gap: 14 }}>
        <div style={{ background: C.panel, borderRadius: 18, padding: '12px 18px', color: C.ok, fontSize: 17, fontWeight: 600 }}>
          ● Connecté — PowerPoint au premier plan
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LaptopIcon size={34} color={C.text} />
          <div style={{ flex: 1, color: C.text, fontSize: 22, fontWeight: 700 }}>PC-SALLE-A</div>
          <Pill label="Déconnecter" bg={C.danger} color="#ff9a9a" />
        </div>
        <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
          <Pill label="▶ Lancer" bg={C.accent} />
          <Pill label="▶ Depuis ici" />
          <Pill label="Écran noir" />
          <Pill label="Écran blanc" />
        </div>
        {/* Chrono + choix de visée, puis pavé laser (comme dans l'application) */}
        <div style={{ display: 'flex', gap: 12, height: 76 }}>
          <div style={{ flex: 1, background: C.panel, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ok, fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {timer}
          </div>
          <div style={{ flex: 1, background: C.panel2, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 18, fontWeight: 600 }}>
            {gyro ? 'Visée : gyroscope' : 'Visée : doigt'}
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, borderRadius: 22, background: laser ? '#4A1A1C' : '#2A1416', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: laser ? '#FF5A5A' : '#FF9A9A', fontSize: 22, fontWeight: 600, textAlign: 'center', lineHeight: 1.35, overflow: 'hidden' }}>
          <div>● {laser ? 'Laser actif' : 'LASER'}</div>
          <div style={{ fontSize: 17, fontWeight: 400 }}>{laser ? (gyro ? "visez l'écran avec le téléphone" : 'glissez le doigt') : 'maintenez et glissez le doigt'}</div>
          {laser && !gyro && (
            <div style={{ position: 'absolute', left: '62%', top: '58%', width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: '50%', background: 'rgba(255,255,255,.18)', boxShadow: '0 0 0 10px rgba(255,255,255,.06)' }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, height: 190 }}>
          <div style={{ flex: 1, borderRadius: 24, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chevron dir="left" />
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', flex: 2, borderRadius: 24, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...pressStyle(press) }}>
            <Chevron dir="right" />
            <Ripple t={ripple} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const WifiScreen: React.FC<{ slide: number; taps: number[] }> = ({ slide, taps }) => {
  const { press, ripple } = usePress(taps);
  const s = SLIDES[slide % SLIDES.length];
  return (
    <div style={{ fontFamily: FONT, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader tab="wifi" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 26px 30px', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.text, fontSize: 19, fontWeight: 700 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: C.ok }} /> Bilan annuel 2026
          <div style={{ flex: 1 }} />
          <span style={{ color: C.muted, fontWeight: 400 }}>10:24</span>
        </div>
        <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '16 / 9' }}>
          <SlideContent index={slide} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#ef5350', color: '#fff', fontSize: 14, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>● En direct</div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>{slide + 1} / {SLIDES.length}</div>
        </div>
        <div style={{ background: C.panel, borderRadius: 18, padding: '10px 16px' }}>
          <div style={{ color: C.text, fontSize: 19, fontWeight: 700 }}>{s.fr}</div>
          <div style={{ color: C.muted, fontSize: 15 }}>Suivante : {SLIDES[(slide + 1) % SLIDES.length].fr}</div>
        </div>
        <div style={{ flex: 1, background: C.panel, borderRadius: 18, padding: '12px 16px', overflow: 'hidden' }}>
          <div style={{ color: C.muted, fontSize: 13, letterSpacing: 1.5 }}>NOTES</div>
          <div style={{ color: C.text, fontSize: 20, lineHeight: 1.4, marginTop: 6 }}>{s.notes}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, height: 150 }}>
          <div style={{ flex: 1, borderRadius: 22, background: C.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chevron dir="left" />
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', flex: 2, borderRadius: 22, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...pressStyle(press) }}>
            <Chevron dir="right" />
            <Ripple t={ripple} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- diapositives

export const SLIDES = [
  { fr: 'Bilan annuel 2026', ar: 'التقرير السنوي', color: '#e8643c', notes: 'Accueillir le public et présenter les objectifs de la réunion.' },
  { fr: 'Résultats', ar: 'النتائج', color: '#3c8ce8', notes: 'Insister sur la croissance de +42 % au second semestre.' },
  { fr: 'Plan d’action', ar: 'خطة العمل', color: '#3ccf7a', notes: 'Trois priorités : clients, équipe, innovation.' },
  { fr: 'Merci !', ar: 'شكراً', color: '#a35cff', notes: 'Ouvrir la séance de questions.' },
];

export const SlideContent: React.FC<{ index: number }> = ({ index }) => {
  const s = SLIDES[index % SLIDES.length];
  const bars = [40, 55, 48, 72, 88];
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT, containerType: 'size' } as React.CSSProperties}>
      <div style={{ height: '6%', background: s.color }} />
      <div style={{ flex: 1, padding: '6cqh 7cqw', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11cqh', fontWeight: 900, color: '#1c1f26' }}>{s.fr}</div>
        <div style={{ width: '14cqw', height: '1.6cqh', background: s.color, borderRadius: 99, margin: '2cqh 0 4cqh' }} />
        {index % 4 === 1 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3cqw' }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i === bars.length - 1 ? s.color : '#c9d3e3', borderRadius: '1cqh 1cqh 0 0' }} />
            ))}
          </div>
        ) : index % 4 === 2 ? (
          ['Clients', 'Équipe', 'Innovation'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '2cqw', fontSize: '7cqh', color: '#39404f', marginBottom: '2.5cqh' }}>
              <div style={{ width: '6cqh', height: '6cqh', borderRadius: '50%', background: s.color, color: '#fff', fontSize: '4cqh', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              {t}
            </div>
          ))
        ) : (
          <div style={{ fontSize: '6.5cqh', color: '#5a6274' }}>
            {index % 4 === 0 ? 'Direction générale · Octobre 2026' : 'Des questions ?'}
          </div>
        )}
      </div>
    </div>
  );
};

/** Écran de projection avec transition glissée entre diapositives. */
export const ProjectorScreen: React.FC<{ taps: number[]; width: number }> = ({ taps, width }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const passed = taps.filter((t) => frame >= t + 2);
  const slide = passed.length;
  const last = passed[passed.length - 1];
  const p = last === undefined ? 1 : spring({ frame: frame - last - 2, fps, config: { damping: 200 }, durationInFrames: 14 });
  return (
    <div style={{ width, aspectRatio: '16 / 9', borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 90px rgba(0,0,0,.55), 0 0 0 6px #22262f' }}>
      {slide > 0 && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-p * 100}%)` }}>
          <SlideContent index={slide - 1} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - p) * 100}%)` }}>
        <SlideContent index={slide} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- textes

export const Caption: React.FC<{ title: string; sub?: string; delay?: number; style?: React.CSSProperties }> = ({
  title,
  sub,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const p2 = spring({ frame: frame - delay - 8, fps, config: { damping: 200 } });
  return (
    <div dir="rtl" style={{ fontFamily: FONT, textAlign: 'center', color: C.text, padding: '0 70px', ...style }}>
      <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.25, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{title}</div>
      {sub && (
        <div style={{ fontSize: 40, fontWeight: 600, color: C.muted, marginTop: 18, lineHeight: 1.4, opacity: p2, transform: `translateY(${(1 - p2) * 30}px)` }}>
          {sub}
        </div>
      )}
    </div>
  );
};

/** Fondu d'entrée et de sortie d'une scène. */
export const SceneFade: React.FC<{ children: React.ReactNode; duration: number }> = ({ children, duration }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
