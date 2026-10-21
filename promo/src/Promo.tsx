import React from 'react';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AppIcon, Background, BluetoothIcon, BtRemoteScreen, Caption, LaptopIcon, Phone, ProjectorScreen,
  SceneFade, WifiIcon, WifiScreen,
} from './components';
import { AUTHOR, C, FONT } from './theme';

// Durées des scènes (images, 30 i/s)
const SCENES = { intro: 100, demo: 250, bluetooth: 160, wifi: 190, features: 190, outro: 170 };
export const PROMO_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

const useIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

// ---------------------------------------------------------------- 1. Introduction

const Intro: React.FC = () => {
  const icon = useIn(0, 12);
  const title = useIn(12);
  const glow = interpolate(useCurrentFrame(), [0, 100], [0.4, 1]);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ transform: `scale(${icon}) rotate(${(1 - icon) * -20}deg)`, filter: `drop-shadow(0 0 ${60 * glow}px rgba(232,100,60,.7))` }}>
        <AppIcon size={300} />
      </div>
      <div style={{ marginTop: 70, fontSize: 96, fontWeight: 900, color: C.text, opacity: title, transform: `translateY(${(1 - title) * 50}px)` }}>
        Télécommande PPT
      </div>
      <Caption title="تحكّم في عروضك التقديمية من هاتفك" delay={26} style={{ marginTop: 30 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. Démonstration

const DEMO_TAPS = [70, 125, 180];

const Demo: React.FC = () => {
  const screen = useIn(0);
  const phone = useIn(10);
  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <Caption title="انتقل بين الشرائح بلمسة واحدة" sub="بدون الحاجة للوقوف بجانب الحاسوب" style={{ marginTop: 110 }} />
      <div style={{ marginTop: 60, opacity: screen, transform: `translateY(${(1 - screen) * -60}px)` }}>
        <ProjectorScreen taps={DEMO_TAPS} width={900} />
      </div>
      <div style={{ position: 'absolute', top: 975, opacity: phone, transform: `translateY(${(1 - phone) * 300}px)` }}>
        <Phone scale={0.72} style={{ transformOrigin: 'top center' }}>
          <BtRemoteScreen taps={DEMO_TAPS} />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. Bluetooth

const Waves: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = ((frame + i * 20) % 60) / 60;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', width: 260, height: 260, borderRadius: '50%', left: -130, top: -130,
              border: `6px solid ${C.accent}`, transform: `scale(${0.4 + t * 1.6})`, opacity: 1 - t,
            }}
          />
        );
      })}
    </>
  );
};

const Bluetooth: React.FC = () => {
  const a = useIn(0);
  const b = useIn(20);
  const frame = useCurrentFrame();
  // Paquet qui voyage du téléphone vers le PC
  const k = (frame % 45) / 45;
  return (
    <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT }}>
      <div style={{ marginTop: 150, width: 170, height: 170, borderRadius: 50, background: '#2f6bff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${a})`, boxShadow: '0 0 80px rgba(47,107,255,.6)' }}>
        <BluetoothIcon size={110} />
      </div>
      <Caption title="وضع البلوتوث" sub="بدون إنترنت وبدون تثبيت أي برنامج على الحاسوب" delay={8} style={{ marginTop: 50 }} />

      <div style={{ position: 'absolute', top: 1000, left: 0, right: 0, height: 500, opacity: b }}>
        {/* Téléphone stylisé */}
        <div style={{ position: 'absolute', left: 170, top: 60, width: 200, height: 380, borderRadius: 40, background: C.panel, border: `5px solid ${C.panel2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}><Waves /></div>
          <div style={{ width: 120, height: 120, borderRadius: 28, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 70, fontWeight: 900 }}>›</div>
        </div>
        {/* Paquet */}
        <div style={{ position: 'absolute', top: 230, left: 400 + k * 260, width: 34, height: 34, borderRadius: 17, background: C.accent2, opacity: Math.sin(k * Math.PI), boxShadow: `0 0 30px ${C.accent}` }} />
        {/* PC */}
        <div style={{ position: 'absolute', right: 120, top: 70 }}>
          <LaptopIcon size={330} color={C.text} />
        </div>
      </div>
      <div dir="rtl" style={{ position: 'absolute', bottom: 190, fontSize: 44, fontWeight: 700, color: C.accent, opacity: useIn(40) }}>
        الهاتف يعمل كلوحة مفاتيح لاسلكية
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. Wi-Fi

const WIFI_TAPS = [80, 135];

const Wifi: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useIn(0);
  const phone = useIn(12);
  const slide = WIFI_TAPS.filter((t) => frame >= t + 2).length;
  return (
    <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT }}>
      <div style={{ marginTop: 120, display: 'flex', alignItems: 'center', gap: 30, direction: 'rtl', opacity: a }}>
        <div style={{ width: 130, height: 130, borderRadius: 40, background: C.ok, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WifiIcon size={84} />
        </div>
      </div>
      <Caption title="وضع الواي فاي" sub="ملاحظات المقدّم ومعاينة الشرائح مباشرة على هاتفك" delay={6} style={{ marginTop: 40 }} />
      <div style={{ position: 'absolute', top: 720, opacity: phone, transform: `translateY(${(1 - phone) * 300}px)` }}>
        <Phone scale={0.94} style={{ transformOrigin: 'top center' }}>
          <WifiScreen slide={slide} taps={WIFI_TAPS} />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. Fonctionnalités

const FEATURES = [
  { icon: '🔊', t: 'أزرار الصوت', s: 'للتنقل بين الشرائح' },
  { icon: '⏱', t: 'مؤقّت العرض', s: 'تحكّم في وقتك' },
  { icon: '⬛', t: 'شاشة سوداء', s: 'أو بيضاء بلمسة' },
  { icon: '🔒', t: 'رمز PIN', s: 'اتصال آمن' },
  { icon: '▦', t: 'كل الشرائح', s: 'انتقل إلى أي شريحة' },
  { icon: '📱', t: 'هاتف أو لوحي', s: 'Android 9 أو أحدث' },
];

const Features: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT }}>
    <Caption title="كل ما تحتاجه لعرض ناجح" style={{ marginTop: 170 }} />
    <div dir="rtl" style={{ marginTop: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 34, padding: '0 70px', width: '100%' }}>
      {FEATURES.map((f, i) => (
        <FeatureCard key={f.t} {...f} delay={14 + i * 9} />
      ))}
    </div>
  </AbsoluteFill>
);

const FeatureCard: React.FC<{ icon: string; t: string; s: string; delay: number }> = ({ icon, t, s, delay }) => {
  const p = useIn(delay, 14);
  return (
    <div style={{ background: C.panel, borderRadius: 36, padding: '40px 36px', border: `2px solid ${C.panel2}`, opacity: Math.min(1, p * 1.5), transform: `scale(${0.6 + p * 0.4})` }}>
      <div style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(232,100,60,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, color: C.accent }}>{icon}</div>
      <div style={{ color: C.text, fontSize: 48, fontWeight: 900, marginTop: 24 }}>{t}</div>
      <div style={{ color: C.muted, fontSize: 32, fontWeight: 600, marginTop: 6 }}>{s}</div>
    </div>
  );
};

// ---------------------------------------------------------------- 6. Conclusion

const Outro: React.FC = () => {
  const icon = useIn(0, 12);
  const a = useIn(14);
  const b = useIn(30);
  const c = useIn(50);
  const pulse = 1 + Math.sin(useCurrentFrame() / 6) * 0.025;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ transform: `scale(${icon})` }}>
        <AppIcon size={240} />
      </div>
      <div style={{ marginTop: 50, fontSize: 84, fontWeight: 900, color: C.text, opacity: a }}>Télécommande PPT</div>
      <div dir="rtl" style={{ marginTop: 50, opacity: b, transform: `scale(${pulse})`, background: C.accent, color: '#fff', fontSize: 58, fontWeight: 900, padding: '26px 70px', borderRadius: 999, boxShadow: '0 20px 60px rgba(232,100,60,.5)' }}>
        حمّل التطبيق الآن
      </div>
      <div style={{ marginTop: 34, fontSize: 38, color: C.muted, fontWeight: 600, opacity: b, direction: 'ltr' }}>
        Telecommande-PPT.apk · Android
      </div>
      <div style={{ position: 'absolute', bottom: 200, textAlign: 'center', opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
        <div dir="rtl" style={{ fontSize: 40, color: C.muted, fontWeight: 600 }}>من إنجاز</div>
        <div style={{ fontSize: 76, color: C.text, fontWeight: 900, letterSpacing: 4, marginTop: 4 }}>{AUTHOR}</div>
        <div style={{ width: 200, height: 6, borderRadius: 3, background: C.accent, margin: '18px auto 0' }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- montage

const ORDER: [keyof typeof SCENES, React.FC][] = [
  ['intro', Intro], ['demo', Demo], ['bluetooth', Bluetooth], ['wifi', Wifi], ['features', Features], ['outro', Outro],
];

export const Promo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Background />
      {ORDER.map(([key, Scene]) => {
        const start = from;
        from += SCENES[key];
        return (
          <Sequence key={key} from={start} durationInFrames={SCENES[key]} name={key}>
            <SceneFade duration={SCENES[key]}>
              <Scene />
            </SceneFade>
          </Sequence>
        );
      })}
      {/* Signature discrète pendant toute la vidéo (sauf conclusion) */}
      <Sequence durationInFrames={PROMO_DURATION - SCENES.outro}>
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 46, fontFamily: FONT }}>
          <div style={{ color: 'rgba(238,240,245,.45)', fontSize: 26, fontWeight: 600 }}>Réalisé par : {AUTHOR}</div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
