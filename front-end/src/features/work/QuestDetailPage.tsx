import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Coins,
  Edit3,
  Info,
  Lock,
  MessageSquare,
  Milestone as MilestoneIcon,
  MoreHorizontal,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorBanner, LoadingSkeleton } from '@/components/ui/StateViews'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import {
  useGoalMilestonesQuery,
  useGoalMutations,
  useMilestoneMutations,
  useQuestMutations,
  useWorkGoalByIdQuery,
  useWorkQuestsQuery
} from '@/hooks/useWorkData'
import { ApiClientError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'
import type { Milestone, ProofRequirement, Quest, QuestType } from '@/types/domain'
import { TASK_CATEGORY_OPTIONS, validateCreationTitle } from './creationContract'
import { QuestCheckpointMap } from './QuestCheckpointMap'
import { QuestCreateSheet } from './QuestCreateSheet'
import { QuestMomentsGallery } from './QuestMomentsGallery'
import { QuestNextActionPanel } from './QuestNextActionPanel'
import {
  classifyQuestTimingState,
  COLLAB_PREVIEW_FRIENDS,
  computeQuestProgress,
  findCollaborativePreviewById,
  formatQuestRemaining,
  formatShortDateVi,
  getQuestTimingLabel,
  groupTasksByEpic
} from './questUtils'
import {
  classifyTaskTimeState,
  formatFullDateTime,
  formatRemainingDuration,
  getPriorityMeta,
  sortTasksActionFirst
} from './taskUtils'
import journeyStyles from './QuestJourney.module.css'
import styles from './WorkPage.module.css'

type LinkedTaskFilter = 'all' | 'mine' | 'team' | 'overdue' | 'upcoming' | 'completed'

const BASE_TASK_FILTERS: { key: LinkedTaskFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'mine', label: 'Của tôi' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Hoàn thành' }
]

const MEMBER_STATUS_VI: Record<string, string> = {
  OWNER: 'Chủ hành trình',
  ACCEPTED: 'Đã tham gia',
  PENDING: 'Đang chờ lời mời',
  DECLINED: 'Đã từ chối'
}

/**
 * FE-04C Full Quest Detail Page (/work/quests/:questId).
 * Backed by verified Backend Goal + linked Quests (Tasks) + optional Milestones.
 * Collaborative sections render honest PENDING API boundaries & clearly labeled preview fixtures.
 */
export function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const currentUserId = useAuthStore((s) => s.user?.id ?? '00000000-0000-4000-8000-000000000001')

  const isPreviewDenied = questId === 'collab-preview-denied'
  const collabPreview = findCollaborativePreviewById(questId)

  const goalQuery = useWorkGoalByIdQuery(isPreviewDenied ? undefined : questId)
  const goal = goalQuery.data ?? null

  const tasksQuery = useWorkQuestsQuery(
    goal && !collabPreview ? { goalId: goal.id } : {}
  )
  const milestonesQuery = useGoalMilestonesQuery(goal && !collabPreview ? goal.id : null)
  const epics = useMemo(
    () => (collabPreview ? collabPreview.previewEpics : (milestonesQuery.data ?? [])),
    [collabPreview, milestonesQuery.data]
  )

  const goalMut = useGoalMutations()
  const questMut = useQuestMutations()
  const msMut = useMilestoneMutations(goal?.id ?? null)

  const [taskFilter, setTaskFilter] = useState<LinkedTaskFilter>('all')
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null)
  const [membersExpanded, setMembersExpanded] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [editQuestOpen, setEditQuestOpen] = useState(false)
  const [collabNotice, setCollabNotice] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [assignTaskTarget, setAssignTaskTarget] = useState<Quest | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const menuWrapRef = useRef<HTMLDivElement>(null)

  // Shared Task Creation Sheet preselected with this parent Quest (goalId)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [tTitle, setTTitle] = useState('')
  const [tDesc, setTDesc] = useState('')
  const [tType, setTType] = useState<QuestType>('SIMPLE')
  const [tPriority, setTPriority] = useState<number>(2)
  const [tStartLocal, setTStartLocal] = useState('')
  const [tDueLocal, setTDueLocal] = useState('')
  const [tMilestoneId, setTMilestoneId] = useState('')
  const [tProof, setTProof] = useState<ProofRequirement>('NONE')

  // Milestone Create/Edit Sheet
  const [msSheetOpen, setMsSheetOpen] = useState(false)
  const [editingMs, setEditingMs] = useState<Milestone | null>(null)
  const [msTitle, setMsTitle] = useState('')
  const [msDesc, setMsDesc] = useState('')

  // Fox contextual reaction on opening Quest Detail
  useEffect(() => {
    if (!goal) return
    const timing = classifyQuestTimingState(goal)
    if (timing === 'overdue' || timing === 'due_soon') {
      foxDialogueBus.emit({
        event: 'QUEST_DEADLINE_URGENT',
        dedupeKey: `quest-deadline:${goal.id}`,
        taskTitle: goal.title
      })
    } else {
      foxDialogueBus.emit({ event: 'QUEST_OPENED' })
    }
  }, [goal?.id, goal?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close overflow menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const linkedTasks = useMemo(() => {
    if (collabPreview) return collabPreview.previewTasks
    if (!goal) return []
    return (tasksQuery.data ?? []).filter((t) => t.goalId === goal.id)
  }, [collabPreview, goal, tasksQuery.data])

  const progress = useMemo(() => computeQuestProgress(linkedTasks), [linkedTasks])

  const taskFilters = useMemo(
    () =>
      collabPreview
        ? [
            { key: 'all' as const, label: 'Tất cả' },
            { key: 'mine' as const, label: 'Của tôi' },
            { key: 'team' as const, label: 'Cả nhóm' },
            { key: 'overdue' as const, label: 'Quá hạn' },
            { key: 'upcoming' as const, label: 'Sắp tới' },
            { key: 'completed' as const, label: 'Hoàn thành' }
          ]
        : BASE_TASK_FILTERS,
    [collabPreview]
  )

  const sortedFilteredTasks = useMemo(() => {
    const activeNonDeleted = linkedTasks.filter((t) => !t.deletedAt && t.status !== 'ARCHIVED')
    let filtered = activeNonDeleted
    if (taskFilter === 'completed') {
      filtered = activeNonDeleted.filter((t) => Boolean(t.completedAt))
    } else if (taskFilter === 'overdue') {
      filtered = activeNonDeleted.filter((t) => classifyTaskTimeState(t) === 'overdue')
    } else if (taskFilter === 'upcoming') {
      filtered = activeNonDeleted.filter((t) => {
        const st = classifyTaskTimeState(t)
        return st === 'upcoming' || st === 'today' || st === 'starting_soon' || st === 'due_soon'
      })
    } else if (taskFilter === 'mine') {
      filtered = activeNonDeleted.filter((t) => {
        if (collabPreview) {
          return collabPreview.previewAssignees[t.id] === currentUserId
        }
        return t.userId === currentUserId
      })
    } else if (taskFilter === 'team') {
      filtered = activeNonDeleted.filter((t) => {
        if (collabPreview) return collabPreview.previewAssignees[t.id] !== currentUserId
        return true
      })
    }
    return sortTasksActionFirst(filtered)
  }, [collabPreview, currentUserId, linkedTasks, taskFilter])

  const openLinkedTask = (task: Quest) => {
    if (collabPreview) {
      setCollabNotice(
        'Nhiệm vụ cộng tác mẫu chưa có bản ghi trên máy chủ — nhiệm vụ thật sẽ mở /work/tasks/:taskId.'
      )
      return
    }
    foxDialogueBus.emit({ event: 'QUEST_TASK_VIEWED' })
    navigate(`/work/tasks/${task.id}`)
  }

  const totalExpectedXp = useMemo(
    () => linkedTasks.reduce((sum, t) => sum + (t.xpReward ?? 0), 0),
    [linkedTasks]
  )
  const totalExpectedCoins = useMemo(
    () => linkedTasks.reduce((sum, t) => sum + (t.coinReward ?? 0), 0),
    [linkedTasks]
  )

  const runLiveAction = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    if (collabPreview) {
      setCollabNotice(
        'Hành trình cộng tác mẫu chỉ dùng để xem trước bố cục — lưu thay đổi lên máy chủ đang chờ Backend Collaboration API.'
      )
      return
    }
    if (!isAuthenticated) {
      setActionError('Đang ở chế độ xem trước — đăng nhập tài khoản để lưu thay đổi lên máy chủ.')
      return
    }
    try {
      await fn()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Thao tác thất bại.')
    }
  }

  const handleSubmitLinkedTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!goal || questMut.createQuest.isPending) return
    const err = validateCreationTitle(tTitle)
    if (err) {
      setActionError(err)
      return
    }
    await runLiveAction(async () => {
      await questMut.createQuest.mutateAsync({
        title: tTitle.trim(),
        description: tDesc.trim() || undefined,
        type: tType,
        priority: tPriority,
        startAt: tStartLocal ? new Date(tStartLocal).toISOString() : null,
        dueAt: tDueLocal ? new Date(tDueLocal).toISOString() : null,
        goalId: goal.id,
        milestoneId: tMilestoneId || null,
        proofRequirement: tProof
      })
      foxDialogueBus.emit({ event: 'QUEST_TASK_CREATED' })
      setTTitle('')
      setTDesc('')
      setTStartLocal('')
      setTDueLocal('')
      setTMilestoneId('')
      setAddTaskOpen(false)
    })
  }

  const submitMilestone = async (e: FormEvent) => {
    e.preventDefault()
    if (!msTitle.trim()) {
      setActionError('Vui lòng nhập tên cột mốc.')
      return
    }
    await runLiveAction(async () => {
      if (editingMs) {
        await msMut.updateMilestone.mutateAsync({
          milestoneId: editingMs.id,
          input: { title: msTitle.trim(), description: msDesc.trim() || null }
        })
      } else {
        await msMut.createMilestone.mutateAsync({
          title: msTitle.trim(),
          description: msDesc.trim() || null
        })
      }
      setMsSheetOpen(false)
    })
  }

  const openAddTask = (preselectedEpicId?: string) => {
    setActionError(null)
    setTMilestoneId(preselectedEpicId ?? '')
    setAddTaskOpen(true)
  }

  const openAddEpic = () => {
    setActionError(null)
    setEditingMs(null)
    setMsTitle('')
    setMsDesc('')
    setMsSheetOpen(true)
  }

  const moveMilestone = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= epics.length) return
    const nextOrder = [...epics]
    const [moved] = nextOrder.splice(index, 1)
    nextOrder.splice(target, 0, moved)
    await runLiveAction(() => msMut.reorderMilestones.mutateAsync(nextOrder.map((m) => m.id)))
  }

  const epicGrouping = useMemo(
    () => groupTasksByEpic(epics, sortedFilteredTasks),
    [epics, sortedFilteredTasks]
  )

  const visibleEpicGroups = useMemo(() => {
    if (!selectedEpicId) return epicGrouping.epicGroups
    if (selectedEpicId === '__unassigned__') return []
    return epicGrouping.epicGroups.filter((g) => g.epic.id === selectedEpicId)
  }, [epicGrouping.epicGroups, selectedEpicId])

  const showUnassignedGroup =
    epicGrouping.unassignedTasks.length > 0 &&
    (selectedEpicId === null || selectedEpicId === '__unassigned__')

  // Permission Denied state (403 from Backend or preview denied route) — leaks ZERO private details
  const isForbidden =
    isPreviewDenied ||
    (goalQuery.error instanceof ApiClientError && goalQuery.error.status === 403)

  if (isForbidden) {
    return (
      <div className={styles.stack} data-testid="quest-permission-denied">
        <nav className={styles.breadcrumbBar} aria-label="Điều hướng hành trình">
          <Link to="/work/quests" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Hành trình
          </Link>
        </nav>
        <Card>
          <div className={styles.permissionDeniedBox}>
            <span className={styles.permissionIconWrap} aria-hidden="true">
              <Lock size={22} />
            </span>
            <h1 className={styles.detailPageTitle} style={{ fontSize: 19 }}>
              Không có quyền truy cập hành trình này
            </h1>
            <p className={styles.detailDescription}>
              Hành trình này ở chế độ riêng tư hoặc bạn chưa được mời làm thành viên. Thông tin chi
              tiết và danh sách nhiệm vụ được ẩn để bảo vệ quyền riêng tư.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/work/quests')}>
              <ArrowLeft size={14} aria-hidden="true" /> Quay lại danh sách Hành trình
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (goalQuery.isLoading) {
    return (
      <div className={styles.stack} data-testid="quest-detail-page">
        <LoadingSkeleton height={36} />
        <LoadingSkeleton height={190} />
        <LoadingSkeleton height={160} />
      </div>
    )
  }

  if (goalQuery.error) {
    return (
      <div className={styles.stack} data-testid="quest-detail-page">
        <nav className={styles.breadcrumbBar} aria-label="Điều hướng hành trình">
          <Link to="/work/quests" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Hành trình
          </Link>
        </nav>
        <ErrorBanner error={goalQuery.error} onRetry={() => goalQuery.refetch()} />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className={styles.stack} data-testid="quest-detail-page">
        <nav className={styles.breadcrumbBar} aria-label="Điều hướng hành trình">
          <Link to="/work/quests" className={styles.backLink}>
            <ArrowLeft size={14} aria-hidden="true" /> Hành trình
          </Link>
        </nav>
        <Card>
          <EmptyState
            title="Không tìm thấy hành trình"
            description="Hành trình này không tồn tại hoặc đường dẫn không hợp lệ."
          />
        </Card>
      </div>
    )
  }

  const timingState = classifyQuestTimingState(goal)
  const remainingLabel =
    goal.status === 'COMPLETED' || goal.status === 'ARCHIVED'
      ? null
      : formatQuestRemaining(goal.dueDate)
  const isUrgent = timingState === 'overdue'
  const isSoon = timingState === 'due_soon'

  return (
    <div
      className={journeyStyles.journeyWorkspace}
      data-testid="quest-detail-page"
      data-quest-id={goal.id}
      data-quest-mode={collabPreview ? 'collaborative' : 'personal'}
    >
      {/* Breadcrumb */}
      <nav className={styles.breadcrumbBar} aria-label="Điều hướng chi tiết hành trình">
        <Link to="/work/quests" className={styles.backLink} data-testid="quest-detail-back">
          <ArrowLeft size={14} aria-hidden="true" /> Hành trình
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">
          /
        </span>
        <span className={styles.breadcrumbCurrent}>Chi tiết</span>
      </nav>

      {collabPreview && (
        <div className={styles.pendingNotice} role="status" data-testid="quest-collab-preview-banner">
          <Info size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          <strong>COLLABORATIVE PREVIEW • PENDING API:</strong> Hành trình cộng tác này là dữ liệu
          minh họa giao diện (không phải bản ghi máy chủ). Mời bạn bè, vai trò thành viên và phân
          công Task sẽ hoạt động thật khi Backend bổ sung Quest Collaboration API.
        </div>
      )}

      {actionError && (
        <div className={styles.errorBox} role="alert">
          {actionError}
        </div>
      )}

      {collabNotice && (
        <div className={styles.evidenceActionNotice} role="status" data-testid="quest-collab-notice">
          {collabNotice}
        </div>
      )}

      {/* 1. QUEST OVERVIEW */}
      <Card>
        <div className={styles.detailTopControls}>
          <div className={styles.btnGroup}>
            <span
              className={`${styles.detailStatusIndicator} ${
                isUrgent
                  ? styles.statusDanger
                  : isSoon
                    ? styles.statusWarning
                    : styles.statusNeutral
              }`}
              data-testid="quest-timing-status"
            >
              <span className={styles.summaryDot} aria-hidden="true" />
              {getQuestTimingLabel(timingState)}
            </span>

            <span className={styles.questModeTag} data-testid="quest-mode-badge">
              {collabPreview ? (
                <>
                  <Users size={12} aria-hidden="true" /> Cộng tác
                </>
              ) : (
                <>
                  <User size={12} aria-hidden="true" /> Cá nhân
                </>
              )}
            </span>
          </div>

          <div className={styles.detailTopActions}>
            {collabPreview && (
              <div
                className={styles.avatarStack}
                aria-label={`${collabPreview.members.length} thành viên`}
                data-testid="quest-overview-avatars"
              >
                {collabPreview.members.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    className={styles.avatarStackItem}
                    style={{ background: m.accentColor }}
                    title={`${m.displayName} (${MEMBER_STATUS_VI[m.status] ?? m.status})`}
                  >
                    {m.initials}
                  </span>
                ))}
              </div>
            )}

            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                setActionError(null)
                setAddTaskOpen(true)
              }}
              data-testid="quest-add-task-btn"
            >
              <Plus size={14} aria-hidden="true" /> Thêm Task
            </Button>

            {!collabPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditQuestOpen(true)}
                data-testid="quest-edit-btn"
              >
                <Edit3 size={13} aria-hidden="true" /> Sửa
              </Button>
            )}

            {!collabPreview && (
              <div className={styles.overflowWrap} ref={menuWrapRef}>
                <button
                  type="button"
                  className={styles.iconActionBtn}
                  aria-label="Quản lý hành trình"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  data-testid="quest-overflow-btn"
                >
                  <MoreHorizontal size={16} aria-hidden="true" />
                </button>

                {menuOpen && (
                  <div className={styles.overflowMenu} role="menu">
                    {goal.status === 'ACTIVE' && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.overflowItem}
                          onClick={() => {
                            setMenuOpen(false)
                            void runLiveAction(() => goalMut.pauseGoal.mutateAsync(goal.id))
                          }}
                        >
                          <Pause size={14} aria-hidden="true" /> Tạm dừng hành trình
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.overflowItem}
                          onClick={() => {
                            setMenuOpen(false)
                            void runLiveAction(async () => {
                              await goalMut.completeGoal.mutateAsync(goal.id)
                              foxDialogueBus.emit({ event: 'QUEST_COMPLETED' })
                            })
                          }}
                        >
                          <Check size={14} aria-hidden="true" /> Đánh dấu hoàn thành
                        </button>
                      </>
                    )}
                    {goal.status === 'PAUSED' && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.overflowItem}
                        onClick={() => {
                          setMenuOpen(false)
                          void runLiveAction(() => goalMut.resumeGoal.mutateAsync(goal.id))
                        }}
                      >
                        <Play size={14} aria-hidden="true" /> Tiếp tục hành trình
                      </button>
                    )}
                    {goal.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        role="menuitem"
                        className={`${styles.overflowItem} ${styles.overflowItemDanger}`}
                        onClick={() => {
                          setMenuOpen(false)
                          setConfirmArchive(true)
                        }}
                      >
                        <Archive size={14} aria-hidden="true" /> Lưu trữ hành trình
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <h1 className={styles.detailPageTitle} style={{ marginBottom: 8 }}>
          {goal.title}
        </h1>

        {goal.description?.trim() && (
          <p className={styles.detailDescription} style={{ marginBottom: 12 }}>
            {goal.description}
          </p>
        )}

        {/* Quest Timing Strip (Start Date | Quest Deadline + Remaining | Owner) */}
        <div className={styles.timingHeroStrip} data-testid="quest-timing-strip">
          <div className={styles.timingCell}>
            <span className={styles.timingLabel}>
              <PlayCircle size={13} aria-hidden="true" /> Bắt đầu hành trình
            </span>
            <span className={styles.timingValue}>{formatShortDateVi(goal.startDate)}</span>
          </div>

          <div className={styles.timingDivider} aria-hidden="true" />

          <div className={styles.timingCell}>
            <span className={styles.timingLabel}>
              <CalendarClock size={13} aria-hidden="true" /> Hạn hành trình
            </span>
            <span
              className={`${styles.timingValue} ${
                isUrgent ? styles.textDanger : isSoon ? styles.textAccent : ''
              }`}
            >
              {formatShortDateVi(goal.dueDate)}
              {remainingLabel && (
                <span className={styles.remainingTag}> ({remainingLabel})</span>
              )}
            </span>
          </div>

          <div className={styles.timingDivider} aria-hidden="true" />

          <div className={styles.timingCell}>
            <span className={styles.timingLabel}>
              <User size={13} aria-hidden="true" /> Chủ hành trình
            </span>
            <span className={styles.timingValue}>
              {collabPreview ? collabPreview.ownerName : 'Bạn'}
            </span>
          </div>
        </div>

        {/* Archive Confirmation */}
        {confirmArchive && (
          <div className={styles.focusConfirmBar} role="alertdialog" aria-label="Xác nhận lưu trữ">
            <span>Lưu trữ hành trình &ldquo;{goal.title}&rdquo;?</span>
            <div className={styles.btnGroup}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmArchive(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setConfirmArchive(false)
                  void runLiveAction(() => goalMut.archiveGoal.mutateAsync(goal.id))
                }}
              >
                Xác nhận lưu trữ
              </Button>
            </div>
          </div>
        )}

        {/* Invitation Response Banner (when current user is a PENDING invitee) */}
        {collabPreview?.isInvitationToMe && (
          <div className={styles.focusConfirmBar} role="region" aria-label="Lời mời tham gia hành trình">
            <span>
              <strong>{collabPreview.ownerName}</strong> đã mời bạn tham gia hành trình cộng tác này.
            </span>
            <div className={styles.btnGroup}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCollabNotice(
                    'Từ chối lời mời hành trình đang chờ Backend Quest Collaboration API.'
                  )
                }
              >
                Từ chối
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() =>
                  setCollabNotice(
                    'Chấp nhận lời mời tham gia hành trình đang chờ Backend Quest Collaboration API.'
                  )
                }
              >
                Chấp nhận lời mời
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* B & C. FULL-WIDTH 2-COLUMN HERO: Epic Checkpoint Journey Map + Next Action Panel (Above the Fold!) */}
      <div className={journeyStyles.journeyHeroGrid} data-testid="quest-journey-hero-grid">
        <QuestCheckpointMap
          milestones={epics}
          linkedTasks={linkedTasks}
          progress={progress}
          selectedEpicId={selectedEpicId && selectedEpicId !== '__unassigned__' ? selectedEpicId : null}
          isPreviewData={Boolean(collabPreview || !isAuthenticated)}
          onSelectEpic={(epicId) => setSelectedEpicId(epicId)}
          onOpenTask={openLinkedTask}
          onAddTask={(epicId) => openAddTask(epicId)}
          onAddEpic={!collabPreview ? openAddEpic : undefined}
        />

        <QuestNextActionPanel
          tasks={linkedTasks}
          isCollaborative={Boolean(collabPreview)}
          currentUserId={currentUserId}
          members={collabPreview?.members}
          assigneeMap={collabPreview?.previewAssignees}
          onOpenTask={openLinkedTask}
          onAddTask={() => openAddTask(selectedEpicId && selectedEpicId !== '__unassigned__' ? selectedEpicId : undefined)}
        />
      </div>

      {/* D. TASKS GROUPED BY EPIC (Primary Operational Workspace — Zero Duplicate Tasks) */}
      <Card>
        <div className={styles.itemRow} style={{ alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h2 className={styles.sectionHeading}>
              Nhiệm vụ theo chặng (Epic) · {progress.totalCount} nhiệm vụ
            </h2>
            <p className={styles.itemMeta}>
              Mỗi Epic là một chặng lớn trên bản đồ — tiến độ Epic và Hành trình tính từ nhiệm vụ
              hoàn thành thực tế.
            </p>
          </div>
          <div className={styles.btnGroup}>
            {!collabPreview && (
              <Button variant="ghost" size="sm" onClick={openAddEpic} data-testid="quest-add-epic-btn">
                <MilestoneIcon size={13} aria-hidden="true" /> Thêm Epic
              </Button>
            )}
            <Button
              variant="accent"
              size="sm"
              onClick={() => openAddTask(selectedEpicId && selectedEpicId !== '__unassigned__' ? selectedEpicId : undefined)}
            >
              <Plus size={14} aria-hidden="true" /> Thêm Task
            </Button>
          </div>
        </div>

        {/* Epic Filter Pills (Synced with clicking Epic checkpoints on the Journey Map) */}
        {(epics.length > 0 || epicGrouping.unassignedTasks.length > 0) && (
          <div
            className={styles.filterPills}
            role="group"
            aria-label="Lọc theo chặng Epic"
            style={{ marginBottom: 8 }}
            data-testid="epic-filter-pills"
          >
            <button
              type="button"
              aria-pressed={selectedEpicId === null}
              className={`${styles.filterPill} ${selectedEpicId === null ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedEpicId(null)}
            >
              Tất cả chặng ({epics.length})
            </button>
            {epicGrouping.epicGroups.map((g, idx) => (
              <button
                key={g.epic.id}
                type="button"
                aria-pressed={selectedEpicId === g.epic.id}
                className={`${styles.filterPill} ${selectedEpicId === g.epic.id ? styles.filterPillActive : ''}`}
                onClick={() =>
                  setSelectedEpicId((prev) => (prev === g.epic.id ? null : g.epic.id))
                }
                data-testid={`epic-filter-${idx + 1}`}
              >
                <span>
                  #{idx + 1} {g.epic.title.length > 26 ? `${g.epic.title.slice(0, 25)}…` : g.epic.title}
                </span>
                <span className={styles.filterCount}>
                  {g.completedCount}/{g.totalCount}
                </span>
              </button>
            ))}
            {epicGrouping.unassignedTasks.length > 0 && (
              <button
                type="button"
                aria-pressed={selectedEpicId === '__unassigned__'}
                className={`${styles.filterPill} ${selectedEpicId === '__unassigned__' ? styles.filterPillActive : ''}`}
                onClick={() =>
                  setSelectedEpicId((prev) => (prev === '__unassigned__' ? null : '__unassigned__'))
                }
              >
                Chưa gắn Epic ({epicGrouping.unassignedTasks.length})
              </button>
            )}
          </div>
        )}

        {/* Task Status / Scope Filter Pills */}
        <div className={styles.filterPills} role="group" aria-label="Lọc nhiệm vụ trong hành trình" style={{ marginBottom: 12 }}>
          {taskFilters.map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={taskFilter === opt.key}
              className={`${styles.filterPill} ${taskFilter === opt.key ? styles.filterPillActive : ''}`}
              onClick={() => setTaskFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {tasksQuery.isLoading && !collabPreview ? (
          <LoadingSkeleton height={90} />
        ) : epics.length === 0 && progress.totalCount === 0 ? (
          <EmptyState
            title="Hành trình chưa có Epic và Nhiệm vụ nào"
            description="Tạo Epic đầu tiên để chia giai đoạn trên bản đồ, hoặc bấm + Thêm Task để thêm việc ngay."
          />
        ) : (
          <div className={journeyStyles.epicGroupsStack} data-testid="quest-linked-tasks">
            {visibleEpicGroups.map((group, idx) => {
              const epicIndex = epics.findIndex((e) => e.id === group.epic.id)
              return (
                <section
                  key={group.epic.id}
                  className={journeyStyles.epicGroupCard}
                  data-testid="epic-task-group"
                  data-epic-id={group.epic.id}
                >
                  <div className={journeyStyles.epicGroupHeader}>
                    <div className={journeyStyles.epicGroupTitleBlock}>
                      <span className={journeyStyles.epicGroupIndex}>Epic #{idx + 1}</span>
                      <h3 className={journeyStyles.epicGroupTitle}>{group.epic.title}</h3>
                      <span className={journeyStyles.epicGroupStat}>
                        {group.completedCount}/{group.totalCount} nhiệm vụ · {group.percent}%
                      </span>
                    </div>

                    <div className={styles.btnGroup}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddTask(group.epic.id)}
                        data-testid={`epic-add-task-${idx + 1}`}
                      >
                        <Plus size={12} aria-hidden="true" /> Thêm Task
                      </Button>
                      {!collabPreview && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={epicIndex <= 0}
                            onClick={() => moveMilestone(epicIndex, -1)}
                            aria-label={`Đẩy lên ${group.epic.title}`}
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={epicIndex === epics.length - 1}
                            onClick={() => moveMilestone(epicIndex, 1)}
                            aria-label={`Đẩy xuống ${group.epic.title}`}
                          >
                            <ArrowDown size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMs(group.epic)
                              setMsTitle(group.epic.title)
                              setMsDesc(group.epic.description ?? '')
                              setMsSheetOpen(true)
                            }}
                            aria-label={`Sửa ${group.epic.title}`}
                          >
                            <Edit3 size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              void runLiveAction(() => msMut.deleteMilestone.mutateAsync(group.epic.id))
                            }
                            aria-label={`Xóa ${group.epic.title}`}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Epic Progress Bar */}
                  <div
                    className={styles.progressTrack}
                    style={{ height: 5, marginBottom: 10 }}
                    role="progressbar"
                    aria-valuenow={group.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tiến độ ${group.epic.title}`}
                  >
                    <div className={styles.progressFill} style={{ width: `${group.percent}%` }} />
                  </div>

                  {group.tasks.length === 0 ? (
                    <p className={styles.itemMeta} style={{ margin: 0 }}>
                      {taskFilter === 'all'
                        ? 'Epic này chưa có nhiệm vụ nào — bấm "+ Thêm Task" để gắn việc vào chặng này.'
                        : 'Không có nhiệm vụ nào trong Epic này khớp bộ lọc hiện tại.'}
                    </p>
                  ) : (
                    <div className={styles.linkedTaskList}>
                      {group.tasks.map((task) => {
                        const timing = classifyTaskTimeState(task)
                        const dueCompact = task.dueAt
                          ? formatRemainingDuration(task.dueAt) ?? formatFullDateTime(task.dueAt)
                          : null
                        const priority = getPriorityMeta(task.priority)
                        const assigneeId = collabPreview?.previewAssignees[task.id]
                        const assignee = collabPreview?.members.find((m) => m.id === assigneeId) ?? null
                        const isCompleted = Boolean(task.completedAt)

                        return (
                          <div
                            key={task.id}
                            className={styles.linkedTaskRow}
                            data-testid="quest-linked-task-row"
                          >
                            <button
                              type="button"
                              className={styles.taskMainBtn}
                              onClick={() => openLinkedTask(task)}
                            >
                              <div className={styles.taskTitleRow}>
                                <span
                                  className={`${styles.taskTitle} ${isCompleted ? styles.taskTitleDone : ''}`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              <div className={styles.taskTimingLine}>
                                {isCompleted ? (
                                  <span className={styles.textSuccess}>Đã hoàn thành</span>
                                ) : dueCompact ? (
                                  <span
                                    className={
                                      timing === 'overdue'
                                        ? styles.textDanger
                                        : timing === 'due_soon'
                                          ? styles.textAccent
                                          : ''
                                    }
                                  >
                                    {dueCompact}
                                  </span>
                                ) : (
                                  <span>Chưa đặt hạn</span>
                                )}
                                {task.priority === 1 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className={styles.textDanger}>{priority.label}</span>
                                  </>
                                )}
                              </div>
                            </button>

                            <div className={styles.btnGroup}>
                              {collabPreview && (
                                <button
                                  type="button"
                                  className={styles.assigneeBtn}
                                  onClick={() => setAssignTaskTarget(task)}
                                  title="Phân công thành viên (chờ Backend Assignee API)"
                                  data-testid={`assign-task-${task.id}`}
                                >
                                  {assignee ? (
                                    <>
                                      <span
                                        className={styles.memberAvatarSm}
                                        style={{ background: assignee.accentColor }}
                                        aria-hidden="true"
                                      >
                                        {assignee.initials}
                                      </span>
                                      <span>{assignee.displayName}</span>
                                    </>
                                  ) : (
                                    <span>+ Giao việc</span>
                                  )}
                                </button>
                              )}
                              {!collabPreview && (
                                <button
                                  type="button"
                                  className={styles.iconActionBtn}
                                  onClick={() => openLinkedTask(task)}
                                  aria-label={`Mở chi tiết ${task.title}`}
                                >
                                  <ChevronRight size={15} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}

            {/* Unassigned-to-Epic Tasks (Explicit Backend Gap: milestoneId can be null) */}
            {showUnassignedGroup && (
              <section
                className={journeyStyles.epicGroupCard}
                data-testid="unassigned-epic-group"
              >
                <div className={journeyStyles.epicGroupHeader}>
                  <div className={journeyStyles.epicGroupTitleBlock}>
                    <span className={journeyStyles.epicGroupIndex}>Chưa gắn chặng</span>
                    <h3 className={journeyStyles.epicGroupTitle}>
                      Nhiệm vụ chưa thuộc Epic ({epicGrouping.unassignedTasks.length})
                    </h3>
                  </div>
                </div>
                <div className={styles.linkedTaskList}>
                  {epicGrouping.unassignedTasks.map((task) => {
                    const timing = classifyTaskTimeState(task)
                    const dueCompact = task.dueAt
                      ? formatRemainingDuration(task.dueAt) ?? formatFullDateTime(task.dueAt)
                      : null
                    const isCompleted = Boolean(task.completedAt)
                    return (
                      <div
                        key={task.id}
                        className={styles.linkedTaskRow}
                        data-testid="quest-linked-task-row"
                      >
                        <button
                          type="button"
                          className={styles.taskMainBtn}
                          onClick={() => openLinkedTask(task)}
                        >
                          <div className={styles.taskTitleRow}>
                            <span
                              className={`${styles.taskTitle} ${isCompleted ? styles.taskTitleDone : ''}`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className={styles.taskTimingLine}>
                            {isCompleted ? (
                              <span className={styles.textSuccess}>Đã hoàn thành</span>
                            ) : dueCompact ? (
                              <span className={timing === 'overdue' ? styles.textDanger : ''}>
                                {dueCompact}
                              </span>
                            ) : (
                              <span>Chưa đặt hạn</span>
                            )}
                          </div>
                        </button>
                        {!collabPreview && (
                          <button
                            type="button"
                            className={styles.iconActionBtn}
                            onClick={() => openLinkedTask(task)}
                            aria-label={`Mở chi tiết ${task.title}`}
                          >
                            <ChevronRight size={15} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </Card>

      {/* E. QUEST MOMENTS GALLERY (Local Photo Memories & Lightbox) */}
      <QuestMomentsGallery
        questTitle={goal.title}
        authorName={collabPreview ? collabPreview.ownerName : 'Bạn'}
        relatedLabels={
          epics.length > 0
            ? epics.map((m) => `Epic #${m.position}: ${m.title}`)
            : linkedTasks.slice(0, 6).map((t) => t.title)
        }
      />

      {/* F. QUEST MEMBERS & INVITATIONS (Below Tasks & Moments; Collaborative Only) */}
      {collabPreview && (
        <Card>
          <div className={styles.itemRow} style={{ alignItems: 'center' }}>
            <button
              type="button"
              className={styles.collapseHeaderBtn}
              onClick={() => setMembersExpanded((v) => !v)}
              aria-expanded={membersExpanded}
              data-testid="quest-members-toggle"
            >
              <Users size={15} aria-hidden="true" />
              <h2 className={styles.sectionHeading}>
                Thành viên &amp; Lời mời ({collabPreview.members.length})
              </h2>
              {membersExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            <div className={styles.btnGroup}>
              <span className={styles.pendingPill}>ROLES: UI PROPOSAL</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteOpen(true)}
                data-testid="quest-invite-member-btn"
              >
                <UserPlus size={13} aria-hidden="true" /> Mời bạn bè
              </Button>
            </div>
          </div>

          {membersExpanded && (
            <div className={styles.membersList} data-testid="quest-members-list">
              {collabPreview.members.map((member) => (
                <div key={member.id} className={styles.memberRow}>
                  <div className={styles.memberIdentity}>
                    <span
                      className={styles.memberAvatar}
                      style={{ background: member.accentColor }}
                      aria-hidden="true"
                    >
                      {member.initials}
                    </span>
                    <div className={styles.memberText}>
                      <strong>{member.displayName}</strong>
                      <span>@{member.username}</span>
                    </div>
                  </div>

                  <div className={styles.btnGroup}>
                    <span className={styles.quietBadge}>{member.role}</span>
                    <span
                      className={`${styles.memberStatusPill} ${
                        member.status === 'PENDING'
                          ? styles.memberPending
                          : member.status === 'OWNER'
                            ? styles.memberOwner
                            : styles.memberAccepted
                      }`}
                    >
                      {MEMBER_STATUS_VI[member.status] ?? member.status}
                    </span>
                    {member.status === 'PENDING' && !collabPreview.isInvitationToMe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCollabNotice(
                            `Thu hồi lời mời của ${member.displayName} đang chờ Backend Quest Collaboration API.`
                          )
                        }
                      >
                        Thu hồi
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* G. DISCUSSION & ACTIVITY BOUNDARY + H. REWARDS & METADATA */}
      <Card>
        <div className={styles.itemRow} style={{ alignItems: 'center', marginBottom: 8 }}>
          <div className={styles.evidenceTitleGroup}>
            <MessageSquare size={15} className={styles.focusIcon} aria-hidden="true" />
            <h2 className={styles.sectionHeading}>Thảo luận &amp; Hoạt động hành trình</h2>
          </div>
          <span className={styles.pendingPill}>SOCIAL / ACTIVITY: PENDING API</span>
        </div>
        <p className={styles.itemMeta} style={{ marginBottom: 14 }}>
          Khu vực trao đổi, bình luận nhiệm vụ và dòng hoạt động thành viên sẽ kết nối khi nhánh
          Social Backend được hợp nhất. Không hiển thị tin nhắn hay lịch sử giả lập.
        </p>

        <div className={styles.questRewardsFooter}>
          <span className={styles.metaTerm}>
            <Sparkles size={13} aria-hidden="true" /> Tổng thưởng dự kiến từ nhiệm vụ:{' '}
            <strong style={{ color: '#16324a' }}>
              +{totalExpectedXp} XP · +{totalExpectedCoins}{' '}
              <Coins size={12} style={{ display: 'inline', verticalAlign: '-1px' }} />
            </strong>{' '}
            (chỉ đọc)
          </span>
        </div>

        <div className={styles.activityFooter} style={{ marginTop: 10 }}>
          <span>
            <Clock size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> Tạo lúc:{' '}
            {formatFullDateTime(goal.createdAt)}
          </span>
          <span>Cập nhật: {formatFullDateTime(goal.updatedAt)}</span>
        </div>
      </Card>

      {/* Shared Quest Edit Sheet */}
      <QuestCreateSheet
        open={editQuestOpen}
        editingGoal={goal}
        onClose={() => setEditQuestOpen(false)}
      />

      {/* Shared Task Creation Sheet preselected with current parent Quest */}
      <Sheet
        open={addTaskOpen}
        title={`Thêm Task vào “${goal.title}”`}
        onClose={() => setAddTaskOpen(false)}
      >
        <form className={styles.form} onSubmit={handleSubmitLinkedTask} data-testid="quest-add-task-form">
          <div className={styles.evidenceActionNotice} style={{ fontSize: 12 }}>
            Hành trình liên kết đã chọn sẵn: <strong>{goal.title}</strong>
          </div>

          <div className={styles.field}>
            <label htmlFor="qt-title" className={styles.label}>
              Tên nhiệm vụ (3–100 ký tự)
            </label>
            <input
              id="qt-title"
              className={styles.input}
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="qt-desc" className={styles.label}>
              Mô tả
            </label>
            <textarea
              id="qt-desc"
              className={styles.textarea}
              value={tDesc}
              onChange={(e) => setTDesc(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="qt-start" className={styles.label}>
                Thời gian bắt đầu
              </label>
              <input
                id="qt-start"
                type="datetime-local"
                className={styles.input}
                value={tStartLocal}
                onChange={(e) => setTStartLocal(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="qt-due" className={styles.label}>
                Hạn hoàn thành
              </label>
              <input
                id="qt-due"
                type="datetime-local"
                className={styles.input}
                value={tDueLocal}
                onChange={(e) => setTDueLocal(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="qt-type" className={styles.label}>
                Phân loại
              </label>
              <select
                id="qt-type"
                className={styles.select}
                value={tType}
                onChange={(e) => setTType(e.target.value as QuestType)}
              >
                {TASK_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="qt-priority" className={styles.label}>
                Mức ưu tiên
              </label>
              <select
                id="qt-priority"
                className={styles.select}
                value={tPriority}
                onChange={(e) => setTPriority(Number(e.target.value))}
              >
                <option value={1}>Ưu tiên cao</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Nhẹ nhàng</option>
              </select>
            </div>
          </div>

          {epics.length > 0 && (
            <div className={styles.field}>
              <label htmlFor="qt-milestone" className={styles.label}>
                Thuộc chặng (Epic)
              </label>
              <select
                id="qt-milestone"
                className={styles.select}
                value={tMilestoneId}
                onChange={(e) => setTMilestoneId(e.target.value)}
                data-testid="quest-add-task-epic-select"
              >
                <option value="">Chưa gắn Epic</option>
                {epics.map((m) => (
                  <option key={m.id} value={m.id}>
                    Epic #{m.position}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="qt-proof" className={styles.label}>
              Yêu cầu minh chứng
            </label>
            <select
              id="qt-proof"
              className={styles.select}
              value={tProof}
              onChange={(e) => setTProof(e.target.value as ProofRequirement)}
            >
              <option value="NONE">Không cần minh chứng</option>
              <option value="OPTIONAL">Tùy chọn</option>
              <option value="REQUIRED">Bắt buộc</option>
            </select>
          </div>

          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setAddTaskOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={questMut.createQuest.isPending}
              data-testid="quest-add-task-submit"
            >
              {questMut.createQuest.isPending ? 'Đang tạo...' : 'Tạo Task'}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Invite Friend Boundary Sheet */}
      <Sheet open={inviteOpen} title="Mời bạn bè vào hành trình" onClose={() => setInviteOpen(false)}>
        <div className={styles.stack} data-testid="quest-invite-sheet">
          <div className={styles.pendingNotice}>
            <strong>PENDING API:</strong> Chức năng gửi lời mời thật và kiểm tra tình bạn đang chờ
            Backend Friendship &amp; Quest Collaboration API.
          </div>
          <div className={styles.friendPickerList}>
            {COLLAB_PREVIEW_FRIENDS.map((f) => (
              <div key={f.id} className={styles.friendPickerRow}>
                <span className={styles.memberAvatar} style={{ background: f.accentColor }}>
                  {f.initials}
                </span>
                <span className={styles.friendPickerInfo}>
                  <strong>{f.displayName}</strong>
                  <span>@{f.username}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  title="Chờ Backend Collaboration API"
                >
                  Mời (Pending)
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      {/* Task Assignment Boundary Sheet */}
      <Sheet
        open={Boolean(assignTaskTarget)}
        title="Phân công nhiệm vụ"
        onClose={() => setAssignTaskTarget(null)}
      >
        {assignTaskTarget && (
          <div className={styles.stack} data-testid="quest-assign-sheet">
            <p className={styles.itemMeta}>
              Nhiệm vụ: <strong style={{ color: '#16324a' }}>{assignTaskTarget.title}</strong>
            </p>
            <div className={styles.pendingNotice}>
              <strong>ASSIGNEE API: PENDING:</strong> Backend bảng <code>Quest</code> hiện chưa có
              trường <code>assigneeId</code>. Giao diện này hiển thị ranh giới phân công và không
              lưu giả lập.
            </div>
            <div className={styles.friendPickerList}>
              {(collabPreview?.members ?? [])
                .filter((m) => m.status === 'OWNER' || m.status === 'ACCEPTED')
                .map((m) => (
                  <div key={m.id} className={styles.friendPickerRow}>
                    <span className={styles.memberAvatar} style={{ background: m.accentColor }}>
                      {m.initials}
                    </span>
                    <span className={styles.friendPickerInfo}>
                      <strong>{m.displayName}</strong>
                      <span>{m.role}</span>
                    </span>
                    <Button variant="ghost" size="sm" disabled>
                      Chọn (Pending)
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Sheet>

      {/* Epic (Milestone) Create/Edit Sheet */}
      <Sheet
        open={msSheetOpen}
        title={editingMs ? 'Chỉnh sửa Epic (Chặng)' : 'Thêm Epic mới vào hành trình'}
        onClose={() => setMsSheetOpen(false)}
      >
        <form className={styles.form} onSubmit={submitMilestone} data-testid="quest-epic-form">
          <div className={styles.field}>
            <label htmlFor="qd-ms-title" className={styles.label}>
              Tên Epic / Chặng
            </label>
            <input
              id="qd-ms-title"
              className={styles.input}
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="qd-ms-desc" className={styles.label}>
              Mô tả
            </label>
            <input
              id="qd-ms-desc"
              className={styles.input}
              value={msDesc}
              onChange={(e) => setMsDesc(e.target.value)}
            />
          </div>
          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMsSheetOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              {editingMs ? 'Lưu cột mốc' : 'Thêm cột mốc'}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
