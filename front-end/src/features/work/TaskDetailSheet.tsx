import {
  Archive,
  CalendarClock,
  Camera,
  CheckCircle2,
  Coins,
  Edit3,
  Flag,
  FolderKanban,
  Milestone as MilestoneIcon,
  Pin,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { Sheet } from '@/components/ui/Sheet'
import { useGoalMilestonesQuery } from '@/hooks/useWorkData'
import type { Goal, Quest } from '@/types/domain'
import {
  classifyDeadline,
  formatFullDateTime,
  getPriorityMeta,
  getProofLabel,
  getQuestStatusLabel
} from './taskUtils'
import styles from './WorkPage.module.css'

interface TaskDetailSheetProps {
  quest: Quest | null
  goals: Goal[]
  onClose: () => void
  onEdit: (quest: Quest) => void
  onTogglePin: (quest: Quest) => void
  onArchive: (quest: Quest) => void
  onRestore: (quest: Quest) => void
  onDelete: (quest: Quest) => void
  busy?: boolean
}

export function TaskDetailSheet({
  quest,
  goals,
  onClose,
  onEdit,
  onTogglePin,
  onArchive,
  onRestore,
  onDelete,
  busy = false
}: TaskDetailSheetProps) {
  const milestonesQuery = useGoalMilestonesQuery(quest?.goalId ?? null)

  if (!quest) {
    return (
      <Sheet open={false} title="Chi tiết nhiệm vụ" onClose={onClose}>
        {null}
      </Sheet>
    )
  }

  const typeMeta = QUEST_TYPE_META[quest.type]
  const TypeIcon = typeMeta.Icon
  const priorityMeta = getPriorityMeta(quest.priority)
  const urgency = classifyDeadline(quest.dueAt)
  const linkedGoal = goals.find((g) => g.id === quest.goalId) ?? null
  const linkedMilestone =
    (milestonesQuery.data ?? []).find((m) => m.id === quest.milestoneId) ?? null
  const estMinutes = quest.estimatedDurationSeconds
    ? Math.max(1, Math.round(quest.estimatedDurationSeconds / 60))
    : null

  return (
    <Sheet open={Boolean(quest)} title="Chi tiết nhiệm vụ" onClose={onClose}>
      <div className={styles.detailStack} data-testid="task-detail-sheet">
        <div className={styles.detailBadges}>
          <span
            className={styles.typePill}
            style={{ background: typeMeta.softBg, color: typeMeta.color }}
          >
            <TypeIcon size={13} aria-hidden="true" />
            {typeMeta.label}
          </span>
          <span className={`${styles.priorityBadge} ${styles[`priority_${priorityMeta.tone}`]}`}>
            <Flag size={11} aria-hidden="true" />
            {priorityMeta.label}
          </span>
          <Chip tone={quest.status === 'ARCHIVED' ? 'danger' : 'success'}>
            {getQuestStatusLabel(quest.status, quest.completedAt)}
          </Chip>
          {quest.isPinned && <Chip tone="accent">Đang ghim</Chip>}
        </div>

        <div>
          <h3 className={styles.detailTitle}>{quest.title}</h3>
          <p className={styles.detailDescription}>
            {quest.description?.trim() || 'Chưa có mô tả chi tiết cho nhiệm vụ này.'}
          </p>
        </div>

        <div className={styles.detailMetaGrid}>
          <div className={styles.detailMetaBox}>
            <span className={styles.detailMetaLabel}>
              <CalendarClock size={13} aria-hidden="true" /> Hạn hoàn thành
            </span>
            <span
              className={`${styles.detailMetaValue} ${
                urgency === 'overdue'
                  ? styles.textDanger
                  : urgency === 'today'
                    ? styles.textAccent
                    : ''
              }`}
            >
              {formatFullDateTime(quest.dueAt)}
            </span>
          </div>

          <div className={styles.detailMetaBox}>
            <span className={styles.detailMetaLabel}>
              <Sparkles size={13} aria-hidden="true" /> Phần thưởng dự kiến
            </span>
            <span className={styles.detailMetaValue}>
              +{quest.xpReward} XP • +{quest.coinReward} <Coins size={12} style={{ display: 'inline' }} />
            </span>
          </div>

          <div className={styles.detailMetaBox}>
            <span className={styles.detailMetaLabel}>
              <FolderKanban size={13} aria-hidden="true" /> Mục tiêu liên kết
            </span>
            <span className={styles.detailMetaValue}>
              {linkedGoal ? linkedGoal.title : 'Không gắn mục tiêu'}
            </span>
          </div>

          <div className={styles.detailMetaBox}>
            <span className={styles.detailMetaLabel}>
              <MilestoneIcon size={13} aria-hidden="true" /> Cột mốc
            </span>
            <span className={styles.detailMetaValue}>
              {linkedMilestone
                ? `#${linkedMilestone.position} ${linkedMilestone.title}`
                : quest.milestoneId
                  ? 'Đang tải cột mốc...'
                  : 'Không gắn cột mốc'}
            </span>
          </div>

          {estMinutes && (
            <div className={styles.detailMetaBox}>
              <span className={styles.detailMetaLabel}>
                <Timer size={13} aria-hidden="true" /> Thời lượng ước tính
              </span>
              <span className={styles.detailMetaValue}>{estMinutes} phút</span>
            </div>
          )}
        </div>

        {/* Honest Evidence / Proof Boundary */}
        <div className={styles.evidenceBox} data-testid="task-evidence-boundary">
          <div className={styles.evidenceHeader}>
            <span className={styles.evidenceTitle}>
              <Camera size={14} aria-hidden="true" /> Ảnh minh chứng ({getProofLabel(quest.proofRequirement)})
            </span>
            <span className={styles.pendingPill}>PENDING API</span>
          </div>
          <p className={styles.evidenceNote}>
            Khu vực đính kèm ảnh minh chứng đã sẵn sàng theo cấu hình nhiệm vụ và sẽ kích hoạt khi
            Backend bổ sung Media Upload API.
          </p>
        </div>

        {/* Honest Completion Boundary */}
        <div className={styles.completionBoundary}>
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Chức năng hoàn thành nhiệm vụ và cộng XP đang chờ Backend Execution API"
            aria-label="Hoàn thành nhiệm vụ (chờ Execution API)"
          >
            <CheckCircle2 size={14} aria-hidden="true" /> Hoàn thành &amp; nhận XP
          </Button>
          <span className={styles.completionHint}>
            Chờ đồng bộ Execution API (không giả lập hoàn thành).
          </span>
        </div>

        {/* Live Verified Actions */}
        <div className={styles.detailActions}>
          {quest.status === 'ACTIVE' && (
            <>
              <Button variant="primary" size="sm" disabled={busy} onClick={() => onEdit(quest)}>
                <Edit3 size={13} /> Chỉnh sửa
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onTogglePin(quest)}
              >
                <Pin size={13} /> {quest.isPinned ? 'Bỏ ghim' : 'Ghim lên thanh trái'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onArchive(quest)}
              >
                <Archive size={13} /> Lưu trữ
              </Button>
            </>
          )}
          {quest.status === 'ARCHIVED' && (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => onRestore(quest)}>
              <RotateCcw size={13} /> Khôi phục
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDelete(quest)}>
            <Trash2 size={13} /> Xóa
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
