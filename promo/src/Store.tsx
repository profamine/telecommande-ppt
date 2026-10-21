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
