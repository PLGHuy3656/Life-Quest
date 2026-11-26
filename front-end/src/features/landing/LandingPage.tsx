import { useCallback, useState } from 'react'
import { LandingDesktop } from './LandingDesktop'
import { LandingLegalNotice, type LegalTopic } from './LandingLegalNotice'
import { LandingMobile } from './LandingMobile'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const [legalTopic, setLegalTopic] = useState<LegalTopic>(null)

  const handleScrollTop = useCallback(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
  }, [])

  return (
    <div className={styles.root} data-testid="landing-page">
      <LandingDesktop onOpenLegal={setLegalTopic} onScrollTop={handleScrollTop} />
      <LandingMobile onOpenLegal={setLegalTopic} onScrollTop={handleScrollTop} />
      <LandingLegalNotice topic={legalTopic} onClose={() => setLegalTopic(null)} />
    </div>
  )
}
