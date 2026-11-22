import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

export interface PlaceholderPageProps {
  title: string
  description: string
  plannedMilestone: string
}

export function PlaceholderPage({ title, description, plannedMilestone }: PlaceholderPageProps) {
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <Chip tone="neutral">{plannedMilestone}</Chip>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-primary)' }}>{title}</h1>
        <p style={{ fontSize: 14, color: 'var(--lq-ink-secondary)', maxWidth: 560 }}>
          {description}
        </p>
        <Link to="/">
          <Button variant="primary" size="sm">
            Quay lại Trang chủ
          </Button>
        </Link>
      </div>
    </Card>
  )
}
