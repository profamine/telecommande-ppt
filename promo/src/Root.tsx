import { Composition, Still } from 'remotion';
import { Promo, PROMO_DURATION } from './Promo';
import { BtFeatureGraphic, BtShot1, BtShot2, BtShot3, FeatureGraphic, Shot1, Shot2, Shot3, Shot4 } from './Store';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={PROMO_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
    {/* Visuels Google Play */}
    <Still id="PlayBanniere" component={FeatureGraphic} width={1024} height={500} />
    <Still id="PlayCapture1" component={Shot1} width={1080} height={1920} />
    <Still id="PlayCapture2" component={Shot2} width={1080} height={1920} />
    <Still id="PlayCapture3" component={Shot3} width={1080} height={1920} />
    <Still id="PlayCapture4" component={Shot4} width={1080} height={1920} />
    {/* Visuels Google Play de l'application PPT Bluetooth */}
    <Still id="BtBanniere" component={BtFeatureGraphic} width={1024} height={500} />
    <Still id="BtCapture1" component={BtShot1} width={1080} height={1920} />
    <Still id="BtCapture2" component={BtShot2} width={1080} height={1920} />
    <Still id="BtCapture3" component={BtShot3} width={1080} height={1920} />
  </>
);
