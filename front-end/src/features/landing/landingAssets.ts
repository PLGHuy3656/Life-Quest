import foxHeroStatic from '@/assets/landing/fox-hero-static.webp'
import foxHeroAnim from '@/assets/landing/fox-hero-anim.webp'
import foxCp1Static from '@/assets/landing/fox-cp1-static.webp'
import foxCp1Anim from '@/assets/landing/fox-cp1-anim.webp'
import foxCp2Static from '@/assets/landing/fox-cp2-static.webp'
import foxCp2Anim from '@/assets/landing/fox-cp2-anim.webp'
import foxCp3CenterStatic from '@/assets/landing/fox-cp3-center-static.webp'
import foxCp3CenterAnim from '@/assets/landing/fox-cp3-center-anim.webp'
import foxMoodHappyStatic from '@/assets/landing/fox-mood-happy-static.webp'
import foxMoodHappyAnim from '@/assets/landing/fox-mood-happy-anim.webp'
import foxMoodCheerStatic from '@/assets/landing/fox-mood-cheer-static.webp'
import foxMoodCheerAnim from '@/assets/landing/fox-mood-cheer-anim.webp'
import foxMoodCelebrateStatic from '@/assets/landing/fox-mood-celebrate-static.webp'
import foxMoodCelebrateAnim from '@/assets/landing/fox-mood-celebrate-anim.webp'
import foxMoodXpStatic from '@/assets/landing/fox-mood-xp-static.webp'
import foxMoodXpAnim from '@/assets/landing/fox-mood-xp-anim.webp'
import foxCp4Static from '@/assets/landing/fox-cp4-static.webp'
import foxCp4Anim from '@/assets/landing/fox-cp4-anim.webp'
import foxCtaSummitStatic from '@/assets/landing/fox-cta-summit-static.webp'
import foxCtaSummitAnim from '@/assets/landing/fox-cta-summit-anim.webp'
import foxFooterCampStatic from '@/assets/landing/fox-footer-camp-static.webp'
import foxFooterCampAnim from '@/assets/landing/fox-footer-camp-anim.webp'

export interface FoxAssetPair {
  readonly anim: string
  readonly static: string
}

export const LANDING_FOX_ASSETS = {
  hero: { anim: foxHeroAnim, static: foxHeroStatic },
  cp1: { anim: foxCp1Anim, static: foxCp1Static },
  cp2: { anim: foxCp2Anim, static: foxCp2Static },
  cp3Center: { anim: foxCp3CenterAnim, static: foxCp3CenterStatic },
  moodHappy: { anim: foxMoodHappyAnim, static: foxMoodHappyStatic },
  moodCheer: { anim: foxMoodCheerAnim, static: foxMoodCheerStatic },
  moodCelebrate: { anim: foxMoodCelebrateAnim, static: foxMoodCelebrateStatic },
  moodXp: { anim: foxMoodXpAnim, static: foxMoodXpStatic },
  cp4: { anim: foxCp4Anim, static: foxCp4Static },
  ctaSummit: { anim: foxCtaSummitAnim, static: foxCtaSummitStatic },
  footerCamp: { anim: foxFooterCampAnim, static: foxFooterCampStatic },
  railFox: foxCp3CenterStatic,
} as const
