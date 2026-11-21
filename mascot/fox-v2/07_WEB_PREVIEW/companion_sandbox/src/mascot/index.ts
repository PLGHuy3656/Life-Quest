// Public entry point of the Fox companion runtime (framework-agnostic).
export { FoxController } from './FoxController';
export type { FoxControllerOptions, FoxControllerEvent, FoxEventResult, FoxPlayResult } from './FoxController';
export { FoxEventRegistry, foxEventRegistry, stepsFor } from './FoxEventMap';
export type { FoxEventName, FoxEventPayloads, FoxEventSpec, FoxReactionStep, FoxEventCoverage } from './FoxEventMap';
export { levelToScale, frameFoxCamera, LEVEL_SCALE_ANCHORS, FOX_MIN_SCALE, FOX_MAX_SCALE, FRAMING_MARGIN } from './FoxLevelScale';
export type { FoxPresentation } from './FoxLevelScale';
export { PRIORITY } from './FoxAnimationManager';
export { FoxRenderBinding } from './FoxRenderBinding';
export { FoxEffectsManager } from './effects/FoxEffectsManager';
export { FX_CATEGORIES, type FxCategory } from './effects/fxCore';
export { bindModuleClips, type FoxModuleReport } from './FoxModelLoader';
export { FoxAssetError, foxAssetCacheState, purgeFoxAssetCache, setFoxAssetKeepAlive } from './FoxModelLoader';
export * from './foxContract';
