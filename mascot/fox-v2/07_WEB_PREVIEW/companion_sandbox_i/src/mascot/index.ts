// Public entry point of the Fox companion runtime (framework-agnostic).
export { FoxController } from './FoxController';
export type { FoxControllerOptions, FoxControllerEvent, FoxEventResult, FoxPlayResult } from './FoxController';
export { FoxEventRegistry, foxEventRegistry, stepsFor } from './FoxEventMap';
export type { FoxEventName, FoxEventPayloads, FoxEventSpec, FoxReactionStep, FoxEventCoverage } from './FoxEventMap';
export { levelToScale, frameFoxCamera, LEVEL_SCALE_ANCHORS, FOX_MIN_SCALE, FOX_MAX_SCALE, FRAMING_MARGIN } from './FoxLevelScale';
export type { FoxPresentation } from './FoxLevelScale';
export { PRIORITY } from './FoxAnimationManager';
export { FoxRenderBinding } from './FoxRenderBinding';
export { FoxEffectsManager, STATE_FX } from './effects/FoxEffectsManager';
export { FoxDailyLife } from './FoxDailyLife';
export type { FoxDailyEvent, FoxCooldownData, FoxStatePhase } from './FoxDailyLife';
export { PROP_LAYOUT, type PropId } from './effects/fxLibraryG2';
export { FX_CATEGORIES, type FxCategory } from './effects/fxCore';
export { bindModuleClips, type FoxModuleReport } from './FoxModelLoader';
export { FoxAssetError, foxAssetCacheState, purgeFoxAssetCache, setFoxAssetKeepAlive } from './FoxModelLoader';
export * from './foxContract';
// Gate G3: props / VFX + multi-mascot choreography
export { PROP_LAYOUT_G3, G3_PROPS, type G3PropId } from './effects/fxLibraryG3';
export { FoxChoreographyManager, type FoxCoordinator, type FoxParticipantInfo } from './choreography/FoxChoreographyManager';
export { FoxDuoCoordinator, DUO_CONTACT_LOCAL, DUO_PAW_GAP, type DuoReport, type DuoOptions } from './choreography/FoxDuoCoordinator';
export { FoxGroupEffectCoordinator, type GroupMode, type GroupOptions, type GroupReport } from './choreography/FoxGroupEffectCoordinator';
export type { FoxGroupData } from './FoxEventMap';
// Gate H1: persistent cosmetics (slot contract + runtime manager)
export * from './cosmetics/cosmeticContract';
export { FoxCosmeticManager, cosmeticCacheState, purgeCosmeticCache, setCosmeticKeepAlive, type FoxCosmeticEvent } from './cosmetics/FoxCosmeticManager';
