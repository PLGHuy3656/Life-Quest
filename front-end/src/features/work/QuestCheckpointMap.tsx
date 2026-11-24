import { useMemo, useState } from 'react'
import { CalendarClock, Check, Compass, Flag, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Milestone, Quest } from '@/types/domain'
import { groupTasksByEpic, type QuestProgressSummary } from './questUtils'
import { formatFullDateTime } from './taskUtils'
import styles from './QuestJourney.module.css'

export type CheckpointStatus = 'completed' | 'active' | 'upcoming'

export interface JourneyCheckpoint {
  id: string
  index: number
  title: string
  description: string | null
  status: CheckpointStatus
  taskCount: number
  completedTaskCount: number
  percent: number
  deadline: string | null
  tasks: Quest[]
  source: 'milestone'
}

/**
 * FE-04C.3 Pure, deterministic Epic Checkpoint derivation (Quest -> Epic -> Task):
 * - Every visual checkpoint represents an ordered Epic (Backend Milestone).
 * - Deduplicates linked Tasks by id so no Task is ever duplicated across Epics.
 * - Computes Epic progress strictly from verified completed Task counts (never fake 100%).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function buildQuestCheckpoints(
  epics: Milestone[],
  linkedTasks: Quest[]
): JourneyCheckpoint[] {
  const { epicGroups } = groupTasksByEpic(epics, linkedTasks)

  let foundActive = false
  return epicGroups.map((group, idx) => {
    const { epic, tasks, completedCount, totalCount, percent } = group
    const isDone =
      totalCount > 0 ? completedCount === totalCount : epic.status === 'COMPLETED'
    let status: CheckpointStatus = 'upcoming'
    if (isDone) {
      status = 'completed'
    } else if (!foundActive) {
      status = 'active'
      foundActive = true
    }

    const earliestDue =
      tasks
        .map((t) => t.dueAt)
        .filter((d): d is string => Boolean(d))
        .sort()[0] ?? null

    return {
      id: epic.id,
      index: idx + 1,
      title: epic.title,
      description: epic.description,
      status,
      taskCount: totalCount,
      completedTaskCount: completedCount,
      percent,
      deadline: earliestDue,
      tasks,
      source: 'milestone'
    }
  })
}

export interface QuestCheckpointMapProps {
  milestones: Milestone[]
  linkedTasks: Quest[]
  progress: QuestProgressSummary
  selectedEpicId?: string | null
  isPreviewData?: boolean
  onSelectEpic?: (epicId: string | null) => void
  onOpenTask: (task: Quest) => void
  onAddTask: (epicId?: string) => void
  onAddEpic?: () => void
}

/**
 * FE-04C.3 Interactive SVG + HTML Epic Checkpoint Journey Map (Quest -> Epic -> Task).
 * - Each checkpoint node represents an Epic; clicking it selects & filters its Tasks.
 * - Horizontally scrollable when >5 Epics so nodes stay readable and never compress.
 * - Synchronized 1:1 with authoritative Task progress across all Epics.
 */
export function QuestCheckpointMap({
  milestones,
  linkedTasks,
  progress,
  selectedEpicId = null,
  isPreviewData = false,
  onSelectEpic,
  onOpenTask,
  onAddTask,
  onAddEpic
}: QuestCheckpointMapProps) {
  const checkpoints = useMemo(
    () => buildQuestCheckpoints(milestones, linkedTasks),
    [milestones, linkedTasks]
  )

  const defaultSelectedId =
    checkpoints.find((c) => c.status === 'active')?.id ?? checkpoints[0]?.id ?? null
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(defaultSelectedId)

  const effectiveSelectedId = selectedEpicId ?? internalSelectedId

  const selectedCheckpoint =
    checkpoints.find((c) => c.id === effectiveSelectedId) ??
    checkpoints.find((c) => c.status === 'active') ??
    checkpoints[0] ??
    null

  const handleSelectNode = (epicId: string) => {
    setInternalSelectedId(epicId)
    onSelectEpic?.(epicId)
  }

  const currentStageIndex =
    checkpoints.find((c) => c.status === 'active')?.index ??
    (checkpoints.length > 0 && checkpoints.every((c) => c.status === 'completed')
      ? checkpoints.length
      : 0)

  // Compute SVG trail geometry dynamically from checkpoint count
  const nodeSpacing = 176
  const padX = 74
  const svgWidth = Math.max(540, padX * 2 + Math.max(0, checkpoints.length - 1) * nodeSpacing)
  const svgHeight = 164

  const coords = checkpoints.map((_, i) => {
    const x = checkpoints.length === 1 ? svgWidth / 2 : padX + i * nodeSpacing
    const y = i % 2 === 0 ? 96 : 62
    return { x, y }
  })

  const buildPathD = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const midX = (prev.x + curr.x) / 2
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return d
  }

  const completedCountOnMap = checkpoints.filter((c) => c.status === 'completed').length
  const fullPathD = buildPathD(coords)
  const activeTrailPoints = coords.slice(0, Math.min(coords.length, completedCountOnMap + 1))
  const completedPathD = buildPathD(activeTrailPoints)

  return (
    <section
      className={styles.mapCard}
      aria-label="Bản đồ chặng hành trình"
      data-testid="quest-checkpoint-map"
    >
      <div className={styles.mapHeader}>
        <div>
          <div className={styles.mapHeadingRow}>
            <Compass size={16} className={styles.tealIcon} aria-hidden="true" />
            <h2 className={styles.panelHeading}>Bản đồ hành trình</h2>
            {isPreviewData && <span className={styles.previewBadge}>XEM TRƯỚC</span>}
          </div>
          <p className={styles.mutedSub}>
            {progress.totalCount === 0
              ? 'Chưa có nhiệm vụ — thêm Task đầu tiên để mở chặng khởi hành.'
              : `${progress.completedCount}/${progress.totalCount} nhiệm vụ hoàn thành · Còn ${progress.remainingCount} việc${
                  currentStageIndex > 0 ? ` · Đang ở chặng ${currentStageIndex}/${checkpoints.length}` : ''
                }`}
          </p>
        </div>

        <div className={styles.mapProgressStat}>
          <strong className={styles.mapBigPct} data-testid="quest-progress-pct">
            {progress.percent}%
          </strong>
          <span className={styles.mapStatCaption}>{checkpoints.length} chặng (Epic)</span>
        </div>
      </div>

      {checkpoints.length === 0 ? (
        <div className={styles.mapEmptyCanvas} data-testid="checkpoint-map-empty">
          <div className={styles.mapStartBadge}>
            <Flag size={18} aria-hidden="true" />
          </div>
          <strong style={{ color: '#16324a', fontSize: 14 }}>Chưa có chặng (Epic) nào</strong>
          <p className={styles.mutedSub} style={{ textAlign: 'center', maxWidth: 400 }}>
            {progress.totalCount > 0
              ? `Hành trình đang có ${progress.totalCount} nhiệm vụ chưa gắn chặng. Tạo Epic để phân chia lộ trình rõ ràng hơn.`
              : 'Mỗi Epic bạn thêm sẽ xuất hiện thành một điểm dừng lớn trên bản đồ hành trình này.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onAddEpic && (
              <Button variant="primary" size="sm" onClick={onAddEpic} data-testid="map-add-epic-btn">
                <Plus size={14} aria-hidden="true" /> Thêm Epic đầu tiên
              </Button>
            )}
            <Button variant="accent" size="sm" onClick={() => onAddTask()}>
              <Plus size={14} aria-hidden="true" /> Thêm Task
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Horizontally scrollable RPG SVG + HTML node canvas */}
          <div className={styles.mapScrollViewport} tabIndex={0} aria-label="Đường đi các chặng hành trình">
            <div className={styles.mapCanvasInner} style={{ width: `${svgWidth}px`, height: `${svgHeight}px` }}>
              <svg
                className={styles.mapSvg}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                width={svgWidth}
                height={svgHeight}
                aria-hidden="true"
              >
                {/* Soft LifeQuest warm hills decoration */}
                <path
                  d={`M 0 ${svgHeight} Q ${svgWidth * 0.22} ${svgHeight - 54} ${svgWidth * 0.48} ${svgHeight - 24} T ${svgWidth} ${svgHeight - 30} L ${svgWidth} ${svgHeight} Z`}
                  fill="rgba(22, 140, 120, 0.08)"
                />
                <path
                  d={`M 0 ${svgHeight} Q ${svgWidth * 0.35} ${svgHeight - 36} ${svgWidth * 0.72} ${svgHeight - 16} T ${svgWidth} ${svgHeight - 20} L ${svgWidth} ${svgHeight} Z`}
                  fill="rgba(246, 200, 95, 0.14)"
                />

                {/* Full dashed future trail */}
                {fullPathD && (
                  <path
                    d={fullPathD}
                    fill="none"
                    stroke="rgba(22, 50, 74, 0.16)"
                    strokeWidth="4"
                    strokeDasharray="7 7"
                    strokeLinecap="round"
                  />
                )}

                {/* Completed / active solid emerald-to-orange trail */}
                {completedPathD && (
                  <path
                    d={completedPathD}
                    fill="none"
                    stroke="#168c78"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Interactive semantic HTML checkpoint nodes */}
              {checkpoints.map((cp, i) => {
                const pos = coords[i]
                const isSelected = selectedCheckpoint?.id === cp.id
                return (
                  <button
                    key={cp.id}
                    type="button"
                    className={`${styles.checkpointNode} ${
                      cp.status === 'completed'
                        ? styles.nodeCompleted
                        : cp.status === 'active'
                          ? styles.nodeActive
                          : styles.nodeUpcoming
                    } ${isSelected ? styles.nodeSelected : ''}`}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    onClick={() => handleSelectNode(cp.id)}
                    aria-pressed={isSelected}
                    aria-label={`Epic ${cp.index}: ${cp.title} (${cp.completedTaskCount}/${cp.taskCount} nhiệm vụ)`}
                    data-testid={`checkpoint-node-${cp.index}`}
                    data-epic-id={cp.id}
                    data-status={cp.status}
                  >
                    <span className={styles.nodeCircle}>
                      {cp.status === 'completed' ? (
                        <Check size={15} strokeWidth={3} aria-hidden="true" />
                      ) : cp.status === 'active' ? (
                        <MapPin size={15} strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        <span>{cp.index}</span>
                      )}
                    </span>
                    <span className={styles.nodeCaption} title={cp.title}>
                      {cp.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Epic Checkpoint Inspector Strip */}
          {selectedCheckpoint && (
            <div className={styles.checkpointInspector} data-testid="checkpoint-inspector">
              <div className={styles.inspectorTop}>
                <div>
                  <span className={styles.inspectorBadge}>
                    Epic #{selectedCheckpoint.index} ·{' '}
                    {selectedCheckpoint.status === 'completed'
                      ? 'Đã hoàn thành'
                      : selectedCheckpoint.status === 'active'
                        ? 'Đang thực hiện'
                        : 'Chặng sắp tới'}
                  </span>
                  <h3 className={styles.inspectorTitle}>{selectedCheckpoint.title}</h3>
                </div>

                <div className={styles.inspectorMeta}>
                  <span>
                    {selectedCheckpoint.completedTaskCount}/{selectedCheckpoint.taskCount} nhiệm vụ (
                    {selectedCheckpoint.percent}%)
                  </span>
                  {selectedCheckpoint.deadline && (
                    <span>
                      <CalendarClock size={12} aria-hidden="true" />{' '}
                      {formatFullDateTime(selectedCheckpoint.deadline)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddTask(selectedCheckpoint.id)}
                    data-testid="inspector-add-task-btn"
                  >
                    <Plus size={12} aria-hidden="true" /> Thêm Task
                  </Button>
                </div>
              </div>

              {selectedCheckpoint.tasks.length > 0 ? (
                <div className={styles.inspectorTasks}>
                  {selectedCheckpoint.tasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={styles.inspectorTaskChip}
                      onClick={() => onOpenTask(t)}
                    >
                      <span>{t.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.mutedSub}>
                  Epic này chưa có nhiệm vụ nào — bấm “+ Thêm Task” để tạo việc gắn thẳng vào Epic.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
