// Visuels de la fiche Google Play : bannière (1024x500) et captures d'écran (1080x1920).
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { AppIcon, Background, BtRemoteScreen, Phone, WifiScreen } from './components';
import { AUTHOR, C, FONT } from './theme';

// ---------------------------------------------------------------- bannière

export const FeatureGraphic: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, overflow: 'hidden' }}>
    <Background />
    <div style={{ position: 'absolute', left: 64, top: 0, bottom: 0, width: 560, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <AppIcon size={84} />
        <div style={{ color: C.text, fontSize: 50, fontWeight: 900, lineHeight: 1.05 }}>Télécommande<br />PPT</div>
      </div>
      <div style={{ color: C.text, fontSize: 34, fontWeight: 700, lineHeight: 1.25, marginTop: 30 }}>
        Pilotez <span style={{ color: C.accent }}>PowerPoint</span><br />depuis votre téléphone
      </div>
      <div style={{ color: C.muted, fontSize: 22, fontWeight: 600, marginTop: 16 }}>Bluetooth · Wi-Fi · Notes · Pointeur laser</div>
    </div>
    <div style={{ position: 'absolute', right: 70, top: 46 }}>
      <Phone scale={0.62} style={{ transformOrigin: 'top right' }}>
        <BtRemoteScreen taps={[]} />
      </Phone>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------- application PPT Bluetooth

const BLUE = '#2F6BFF';

const BtAppIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill={BLUE} />
    <rect x="12" y="14" width="40" height="26" rx="3" fill="none" stroke="#fff" strokeWidth="4" />
    <path d="M27 22l10 8-5 4V18l5 4-10 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 48h16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    <circle cx="46" cy="46" r="6" fill={C.accent} />
  </svg>
);

export const BtFeatureGraphic: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, overflow: 'hidden' }}>
    <Background />
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 75% 40%, rgba(47,107,255,.35), transparent 55%)' }} />
    <div style={{ position: 'absolute', left: 64, top: 0, bottom: 0, width: 580, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <BtAppIcon size={84} />
        <div style={{ color: C.text, fontSize: 46, fontWeight: 900, lineHeight: 1.05 }}>Télécommande PPT<br /><span style={{ color: '#7FA6FF' }}>Bluetooth</span></div>
      </div>
      <div style={{ color: C.text, fontSize: 32, fontWeight: 700, lineHeight: 1.25, marginTop: 28 }}>
        Pilotez <span style={{ color: C.accent }}>PowerPoint</span><br />sans Wi-Fi, sans logiciel
      </div>
      <div style={{ color: C.muted, fontSize: 21, fontWeight: 600, marginTop: 14 }}>Clavier + souris Bluetooth · Pointeur laser · Chrono</div>
    </div>
    <div style={{ position: 'absolute', right: 70, top: 46 }}>
      <Phone scale={0.62} style={{ transformOrigin: 'top right' }}>
        <BtRemoteScreen taps={[]} btOnly />
      </Phone>
    </div>
  </AbsoluteFill>
);

const PairStep: React.FC<{ n: number; title: string; text: string }> = ({ n, title, text }) => (
  <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', background: C.panel, border: `2px solid ${C.panel2}`, borderRadius: 36, padding: '38px 40px', width: 900 }}>
    <div style={{ flex: 'none', width: 92, height: 92, borderRadius: 46, background: BLUE, color: '#fff', fontSize: 50, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
    <div>
      <div style={{ color: C.text, fontSize: 44, fontWeight: 900 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 32, fontWeight: 600, marginTop: 8, lineHeight: 1.35 }}>{text}</div>
    </div>
  </div>
);

// ---------------------------------------------------------------- captures

const Shot: React.FC<{ title: string; sub: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, alignItems: 'center', overflow: 'hidden' }}>
    <Background />
    <div style={{ position: 'relative', marginTop: 110, textAlign: 'center', padding: '0 70px' }}>
      <div style={{ color: C.text, fontSize: 72, fontWeight: 900, lineHeight: 1.12 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 38, fontWeight: 600, marginTop: 22, lineHeight: 1.35 }}>{sub}</div>
    </div>
    <div style={{ position: 'absolute', top: 560, display: 'flex', justifyContent: 'center', width: '100%' }}>{children}</div>
    <div style={{ position: 'absolute', bottom: 40, color: 'rgba(238,240,245,.5)', fontSize: 28, fontWeight: 600 }}>
      Réalisé par : {AUTHOR}
    </div>
  </AbsoluteFill>
);

export const Shot1: React.FC = () => (
  <Shot title="Changez de diapo d'un geste" sub="Gros boutons, touches de volume, chrono intégré">
    <Phone scale={1.08} style={{ transformOrigin: 'top center' }}><BtRemoteScreen taps={[]} /></Phone>
  </Shot>
);

export const Shot2: React.FC = () => (
  <Shot title="Vos notes sous les yeux" sub="Aperçu de la diapositive en direct, en Wi-Fi">
    <Phone scale={1.08} style={{ transformOrigin: 'top center' }}><WifiScreen slide={1} taps={[]} /></Phone>
  </Shot>
);

export const Shot3: React.FC = () => (
  <Shot title="Un vrai pointeur laser" sub="Au doigt ou en visant l'écran avec le gyroscope">
    <Phone scale={1.08} style={{ transformOrigin: 'top center' }}><BtRemoteScreen taps={[]} laser /></Phone>
  </Shot>
);

export const BtShot1: React.FC = () => (
  <Shot title="Sans Wi-Fi, en Bluetooth" sub="Changez de diapo d'un geste, même quand le réseau est saturé">
    <Phone scale={1.08} style={{ transformOrigin: 'top center' }}><BtRemoteScreen taps={[]} btOnly /></Phone>
  </Shot>
);

export const BtShot2: React.FC = () => (
  <Shot title="Un vrai pointeur laser" sub="Au doigt ou en visant l'écran avec le gyroscope">
    <Phone scale={1.08} style={{ transformOrigin: 'top center' }}><BtRemoteScreen taps={[]} btOnly laser /></Phone>
  </Shot>
);

export const BtShot3: React.FC = () => (
  <Shot title="Rien à installer sur le PC" sub="Le téléphone devient un clavier et une souris Bluetooth">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, alignItems: 'center', marginTop: 40 }}>
      <PairStep n={1} title="Rendre visible" text="Dans l'application, touchez « Rendre visible »." />
      <PairStep n={2} title="Associer depuis le PC" text="Paramètres › Bluetooth › Ajouter un appareil, puis choisissez le téléphone." />
      <PairStep n={3} title="Présentez" text="Diapos, laser, écran noir, chrono : tout se pilote du téléphone." />
    </div>
  </Shot>
);

export const Shot4: React.FC = () => (
  <Shot title="Bluetooth ou Wi-Fi" sub="Sans réseau, le téléphone devient clavier et souris du PC">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50 }}>
      <Img src={staticFile('interface-windows.jpg')} style={{ width: 940, borderRadius: 26, border: `2px solid ${C.panel2}`, boxShadow: '0 40px 100px rgba(0,0,0,.6)' }} />
      <div style={{ color: C.text, fontSize: 40, fontWeight: 700, textAlign: 'center', lineHeight: 1.35, padding: '0 80px' }}>
        En Wi-Fi, l'application Windows<br /><span style={{ color: C.accent }}>se connecte en un scan</span>
      </div>
    </div>
  </Shot>
);
