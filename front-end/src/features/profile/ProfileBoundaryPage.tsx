import { Link } from 'react-router-dom'
import { FolderHeart, Lock, ShieldCheck, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useUserMeQuery } from '@/hooks/useDashboardData'
import { FUTURE_PROFILE_BOUNDARIES } from '@/services/api/socialContracts'

/**
 * Future Profile & Album compatibility boundary (FE-03.5I Phase 6).
 * Prepares route & component slots for Personal Posts, Personal Albums,
 * Friends' Albums, Quest Evidence Photos, and Privacy Controls without
 * fabricating unimplemented album storage.
 */
export function ProfileBoundaryPage() {
  const userQuery = useUserMeQuery()
  const user = userQuery.data?.data
  const displayName = user?.profile?.displayName?.trim() || user?.username || 'Tài khoản LifeQuest'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserCircle2 size={36} color="#168C78" aria-hidden="true" />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--lq-primary)' }}>
                {displayName}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--lq-ink-secondary)' }}>
                Trang cá nhân &amp; ranh giới kiến trúc Album / Ảnh minh chứng (chuẩn bị cho giai đoạn tiếp theo).
              </p>
            </div>
          </div>

          <Link to="/settings">
            <Button variant="subtle" size="sm">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Cài đặt quyền riêng tư (LIVE)</span>
            </Button>
          </Link>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {FUTURE_PROFILE_BOUNDARIES.map((section) => (
          <Card key={section.id} compact>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 14, color: 'var(--lq-primary)' }}>
                {section.id === 'privacy-controls' ? (
                  <Lock size={14} color="#168C78" aria-hidden="true" />
                ) : (
                  <FolderHeart size={14} color="#F26B3A" aria-hidden="true" />
                )}
                <span>{section.title}</span>
              </span>
              <Chip
                tone={
                  section.status === 'LIVE'
                    ? 'success'
                    : section.status === 'PENDING'
                      ? 'reward'
                      : 'neutral'
                }
              >
                {section.status}
              </Chip>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--lq-ink-secondary)', lineHeight: 1.45 }}>
              {section.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
