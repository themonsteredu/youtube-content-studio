import { Composition } from "remotion";
import { defaultDraft, IntroComposition } from "./intro-composition";

export function RemotionRoot() {
  return <Composition id="YoutubeIntro" component={IntroComposition} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={defaultDraft} />;
}
