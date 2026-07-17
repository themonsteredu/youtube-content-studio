import { Composition } from "remotion";
import { defaultDraft, IntroComposition } from "./intro-composition";
import { defaultScene, SceneComposition } from "./scene-composition";

export function RemotionRoot() {
  return (
    <>
      <Composition id="YoutubeIntro" component={IntroComposition} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={defaultDraft} />
      <Composition id="SceneIntro" component={SceneComposition} width={1920} height={1080} fps={30} durationInFrames={180} defaultProps={{ scene: defaultScene }} />
    </>
  );
}
