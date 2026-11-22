import { useState, type FormEvent } from 'react'
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Pause,
  Pin,
  Play,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import {
  useGoalMilestonesQuery,
  useGoalMutations,
  useMilestoneMutations,
  useQuestMutations,
  useWorkGoalsQuery,
  useWorkQuestsQuery
} from '@/hooks/useWorkData'
import type { Goal, Milestone, Quest, QuestType } from '@/types/domain'
import { addDaysLocal, getTodayLocalDate } from '@/utils/date'
import styles from './WorkPage.module.css'

type WorkTab = 'goals' | 'quests'

export function WorkPage() {
  const [tab, setTab] = useState<WorkTab>('goals')
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Quest filters (aligned with Backend GET /quests query schema)
  const [questStatus, setQuestStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [filterGoalId, setFilterGoalId] = useState<string>('')
  const [filterMilestoneId, setFilterMilestoneId] = useState<string>('')
  const [questSearch, setQuestSearch] = useState<string>('')

  // Goal Sheet state
  const [goalSheetOpen, setGoalSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [goalStart, setGoalStart] = useState(getTodayLocalDate())
  const [goalDue, setGoalDue] = useState(addDaysLocal(getTodayLocalDate(), 30))

  // Milestone Sheet state
  const [msSheetOpen, setMsSheetOpen] = useState(false)
  const [editingMs, setEditingMs] = useState<Milestone | null>(null)
  const [msTitle, setMsTitle] = useState('')
  const [msDesc, setMsDesc] = useState('')

  // Quest Sheet state
  const [questSheetOpen, setQuestSheetOpen] = useState(false)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [qTitle, setQTitle] = useState('')
  const [qDesc, setQDesc] = useState('')
  const [qType, setQType] = useState<QuestType>('SIMPLE')
  const [qGoalId, setQGoalId] = useState<string>('')

  const goalsQuery = useWorkGoalsQuery()
  const goals = goalsQuery.data ?? []
  const effectiveGoalId = selectedGoalId ?? goals[0]?.id ?? null
  const selectedGoal = goals.find((g) => g.id === effectiveGoalId) ?? null

  const milestonesQuery = useGoalMilestonesQuery(effectiveGoalId)
  const milestones = milestonesQuery.data ?? []

  const filterMilestonesQuery = useGoalMilestonesQuery(filterGoalId || null)

  const questsQuery = useWorkQuestsQuery({
    status: questStatus,
    goalId: filterGoalId || undefined,
    milestoneId: filterMilestoneId || undefined,
    search: questSearch.trim() || undefined
  })
  const quests = questsQuery.data ?? []

  const goalMut = useGoalMutations()
  const msMut = useMilestoneMutations(effectiveGoalId)
  const questMut = useQuestMutations()

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await fn()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Thao tác thất bại.')
    }
  }

  const openCreateGoal = () => {
    setEditingGoal(null)
    setGoalTitle('')
    setGoalDesc('')
    const today = getTodayLocalDate()
    setGoalStart(today)
    setGoalDue(addDaysLocal(today, 30))
    setActionError(null)
    setGoalSheetOpen(true)
  }

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g)
    setGoalTitle(g.title)
    setGoalDesc(g.description ?? '')
    setGoalStart(g.startDate.slice(0, 10))
    setGoalDue(g.dueDate.slice(0, 10))
    setActionError(null)
    setGoalSheetOpen(true)
  }

  const submitGoal = async (e: FormEvent) => {
    e.preventDefault()
    setActionError(null)
    if (goalTitle.trim().length < 3) {
      setActionError('Tiêu đề mục tiêu cần ít nhất 3 ký tự.')
      return
    }
    if (goalDue <= goalStart) {
      setActionError('Ngày hạn (dueDate) phải lớn hơn ngày bắt đầu (startDate).')
      return
    }
    await runAction(async () => {
      if (editingGoal) {
        await goalMut.updateGoal.mutateAsync({
          goalId: editingGoal.id,
          input: {
            title: goalTitle.trim(),
            description: goalDesc.trim(),
            startDate: `${goalStart}T00:00:00.000Z`,
            dueDate: `${goalDue}T23:59:59.000Z`
          }
        })
      } else {
        const created = await goalMut.createGoal.mutateAsync({
          title: goalTitle.trim(),
          description: goalDesc.trim(),
          startDate: `${goalStart}T00:00:00.000Z`,
          dueDate: `${goalDue}T23:59:59.000Z`
        })
        setSelectedGoalId(created.id)
      }
      setGoalSheetOpen(false)
    })
  }

  const openCreateMilestone = () => {
    setEditingMs(null)
    setMsTitle('')
    setMsDesc('')
    setActionError(null)
    setMsSheetOpen(true)
  }

  const openEditMilestone = (m: Milestone) => {
    setEditingMs(m)
    setMsTitle(m.title)
    setMsDesc(m.description ?? '')
    setActionError(null)
    setMsSheetOpen(true)
  }

  const submitMilestone = async (e: FormEvent) => {
    e.preventDefault()
    setActionError(null)
    if (!msTitle.trim()) {
      setActionError('Vui lòng nhập tên cột mốc.')
      return
    }
    await runAction(async () => {
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

  const moveMilestone = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= milestones.length) return
    const nextOrder = [...milestones]
    const [moved] = nextOrder.splice(index, 1)
    nextOrder.splice(target, 0, moved)
    await runAction(() => msMut.reorderMilestones.mutateAsync(nextOrder.map((m) => m.id)))
  }

  const openCreateQuest = () => {
    setEditingQuest(null)
    setQTitle('')
    setQDesc('')
    setQType('SIMPLE')
    setQGoalId(filterGoalId || '')
    setActionError(null)
    setQuestSheetOpen(true)
  }

  const openEditQuest = (q: Quest) => {
    setEditingQuest(q)
    setQTitle(q.title)
    setQDesc(q.description ?? '')
    setQType(q.type)
    setQGoalId(q.goalId ?? '')
    setActionError(null)
    setQuestSheetOpen(true)
  }

  const submitQuest = async (e: FormEvent) => {
    e.preventDefault()
    setActionError(null)
    if (qTitle.trim().length < 3) {
      setActionError('Tên nhiệm vụ cần ít nhất 3 ký tự.')
      return
    }
    await runAction(async () => {
      const payload = {
        title: qTitle.trim(),
        description: qDesc.trim(),
        type: qType,
        goalId: qGoalId || null
      }
      if (editingQuest) {
        await questMut.updateQuest.mutateAsync({ questId: editingQuest.id, input: payload })
      } else {
        await questMut.createQuest.mutateAsync(payload)
      }
      setQuestSheetOpen(false)
    })
  }

  return (
    <div className={styles.stack}>
      <div className={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className={styles.heading}>Công việc &amp; Mục tiêu</h1>
          <SourceBadge source="LIVE" />
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Phân khu công việc">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'goals'}
            className={`${styles.tabBtn} ${tab === 'goals' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('goals')}
          >
            Mục tiêu &amp; Cột mốc ({goals.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'quests'}
            className={`${styles.tabBtn} ${tab === 'quests' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('quests')}
          >
            Nhiệm vụ ({quests.length})
          </button>
        </div>
      </div>

      {actionError && (
        <div className={styles.errorBox} role="alert">
          {actionError}
        </div>
      )}

      {tab === 'goals' ? (
        <div className={styles.split}>
          <Card>
            <div className={styles.itemRow} style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Danh sách mục tiêu</h2>
              <Button variant="accent" size="sm" onClick={openCreateGoal}>
                <Plus size={14} /> Tạo mục tiêu
              </Button>
            </div>

            {goalsQuery.isLoading ? (
              <LoadingSkeleton height={160} />
            ) : goalsQuery.error ? (
              <ErrorBanner error={goalsQuery.error} onRetry={() => goalsQuery.refetch()} />
            ) : goals.length === 0 ? (
              <EmptyState
                title="Chưa có mục tiêu nào"
                description="Tạo mục tiêu đầu tiên để chia nhỏ cột mốc và nhiệm vụ."
              />
            ) : (
              <div className={styles.list}>
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className={`${styles.itemCard} ${g.id === effectiveGoalId ? styles.itemSelected : ''}`}
                  >
                    <div className={styles.itemRow}>
                      <button
                        type="button"
                        onClick={() => setSelectedGoalId(g.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left'
                        }}
                      >
                        <div className={styles.itemTitle}>{g.title}</div>
                        <div className={styles.itemMeta}>
                          {g.startDate.slice(0, 10)} → {g.dueDate.slice(0, 10)}
                        </div>
                      </button>
                      <Chip
                        tone={
                          g.status === 'COMPLETED'
                            ? 'success'
                            : g.status === 'PAUSED'
                              ? 'reward'
                              : g.status === 'ARCHIVED'
                                ? 'danger'
                                : 'neutral'
                        }
                      >
                        {g.status}
                      </Chip>
                    </div>

                    {g.description && <p className={styles.itemMeta}>{g.description}</p>}

                    <div className={styles.btnGroup}>
                      <Button variant="ghost" size="sm" onClick={() => openEditGoal(g)}>
                        <Edit3 size={13} /> Sửa
                      </Button>
                      {g.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => goalMut.pauseGoal.mutateAsync(g.id))}
                        >
                          <Pause size={13} /> Tạm dừng
                        </Button>
                      )}
                      {g.status === 'PAUSED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => goalMut.resumeGoal.mutateAsync(g.id))}
                        >
                          <Play size={13} /> Tiếp tục
                        </Button>
                      )}
                      {g.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => goalMut.completeGoal.mutateAsync(g.id))}
                        >
                          <Check size={13} /> Hoàn thành
                        </Button>
                      )}
                      {g.status !== 'ARCHIVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => goalMut.archiveGoal.mutateAsync(g.id))}
                        >
                          <Archive size={13} /> Lưu trữ
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className={styles.itemRow} style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Cột mốc (Milestones)</h2>
                <p className={styles.itemMeta}>
                  {selectedGoal ? `Thuộc: ${selectedGoal.title}` : 'Chọn một mục tiêu bên trái'}
                </p>
              </div>
              {selectedGoal && (
                <Button variant="primary" size="sm" onClick={openCreateMilestone}>
                  <Plus size={14} /> Thêm cột mốc
                </Button>
              )}
            </div>

            {!selectedGoal ? (
              <EmptyState
                title="Chưa chọn mục tiêu"
                description="Chọn hoặc tạo một mục tiêu để quản lý các cột mốc."
              />
            ) : milestonesQuery.isLoading ? (
              <LoadingSkeleton height={140} />
            ) : milestonesQuery.error ? (
              <ErrorBanner error={milestonesQuery.error} onRetry={() => milestonesQuery.refetch()} />
            ) : milestones.length === 0 ? (
              <EmptyState
                title="Chưa có cột mốc"
                description="Thêm cột mốc để chia nhỏ mục tiêu này."
              />
            ) : (
              <div className={styles.list}>
                {milestones.map((m, idx) => (
                  <div key={m.id} className={styles.itemCard}>
                    <div className={styles.itemRow}>
                      <div>
                        <div className={styles.itemTitle}>
                          #{m.position} {m.title}
                        </div>
                        {m.description && <div className={styles.itemMeta}>{m.description}</div>}
                      </div>
                      <Chip tone={m.status === 'COMPLETED' ? 'success' : 'neutral'}>
                        {m.status}
                      </Chip>
                    </div>

                    <div className={styles.btnGroup}>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => moveMilestone(idx, -1)}
                        aria-label={`Đẩy lên ${m.title}`}
                      >
                        <ArrowUp size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === milestones.length - 1}
                        onClick={() => moveMilestone(idx, 1)}
                        aria-label={`Đẩy xuống ${m.title}`}
                      >
                        <ArrowDown size={13} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditMilestone(m)}>
                        <Edit3 size={13} /> Sửa
                      </Button>
                      {m.status !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => msMut.completeMilestone.mutateAsync(m.id))}
                        >
                          <Check size={13} /> Hoàn thành
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(() => msMut.deleteMilestone.mutateAsync(m.id))}
                      >
                        <Trash2 size={13} /> Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div className={styles.itemRow} style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Danh sách nhiệm vụ (Quests)</h2>
            <Button variant="accent" size="sm" onClick={openCreateQuest}>
              <Plus size={14} /> Tạo nhiệm vụ
            </Button>
          </div>

          <div className={styles.filters}>
            <select
              aria-label="Lọc trạng thái nhiệm vụ"
              className={styles.select}
              value={questStatus}
              onChange={(e) => setQuestStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')}
            >
              <option value="ACTIVE">Trạng thái: ACTIVE</option>
              <option value="ARCHIVED">Trạng thái: ARCHIVED</option>
            </select>

            <select
              aria-label="Lọc theo mục tiêu"
              className={styles.select}
              value={filterGoalId}
              onChange={(e) => {
                setFilterGoalId(e.target.value)
                setFilterMilestoneId('')
              }}
            >
              <option value="">Tất cả mục tiêu</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo cột mốc"
              className={styles.select}
              value={filterMilestoneId}
              onChange={(e) => setFilterMilestoneId(e.target.value)}
              disabled={!filterGoalId}
            >
              <option value="">Tất cả cột mốc</option>
              {(filterMilestonesQuery.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            <input
              aria-label="Tìm nhiệm vụ"
              className={styles.input}
              value={questSearch}
              onChange={(e) => setQuestSearch(e.target.value)}
              placeholder="Tìm theo tên..."
            />
          </div>

          {questsQuery.isLoading ? (
            <LoadingSkeleton height={160} />
          ) : questsQuery.error ? (
            <ErrorBanner error={questsQuery.error} onRetry={() => questsQuery.refetch()} />
          ) : quests.length === 0 ? (
            <EmptyState
              title="Không có nhiệm vụ phù hợp"
              description="Thử đổi bộ lọc hoặc tạo nhiệm vụ mới."
            />
          ) : (
            <div className={styles.list}>
              {quests.map((q) => (
                <div key={q.id} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <div>
                      <div className={styles.itemTitle}>{q.title}</div>
                      <div className={styles.itemMeta}>
                        {q.type} • +{q.xpReward} XP • +{q.coinReward} Coin
                      </div>
                    </div>
                    <div className={styles.btnGroup}>
                      {q.isPinned && <Chip tone="accent">Đã ghim</Chip>}
                      <Chip tone={q.status === 'ARCHIVED' ? 'danger' : 'neutral'}>{q.status}</Chip>
                    </div>
                  </div>

                  <div className={styles.btnGroup}>
                    {q.status === 'ACTIVE' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditQuest(q)}>
                          <Edit3 size={13} /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            runAction(() =>
                              q.isPinned
                                ? questMut.unpinQuest.mutateAsync(q.id)
                                : questMut.pinQuest.mutateAsync(q.id)
                            )
                          }
                        >
                          <Pin size={13} /> {q.isPinned ? 'Bỏ ghim' : 'Ghim'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runAction(() => questMut.archiveQuest.mutateAsync(q.id))}
                        >
                          <Archive size={13} /> Lưu trữ
                        </Button>
                      </>
                    )}
                    {q.status === 'ARCHIVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => runAction(() => questMut.restoreQuest.mutateAsync(q.id))}
                      >
                        <RotateCcw size={13} /> Khôi phục
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runAction(() => questMut.deleteQuest.mutateAsync(q.id))}
                    >
                      <Trash2 size={13} /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Goal Create/Edit Sheet */}
      <Sheet
        open={goalSheetOpen}
        title={editingGoal ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}
        onClose={() => setGoalSheetOpen(false)}
      >
        <form className={styles.form} onSubmit={submitGoal}>
          <div className={styles.field}>
            <label htmlFor="goal-title" className={styles.label}>
              Tiêu đề (3–100 ký tự)
            </label>
            <input
              id="goal-title"
              className={styles.input}
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="goal-desc" className={styles.label}>
              Mô tả
            </label>
            <input
              id="goal-desc"
              className={styles.input}
              value={goalDesc}
              onChange={(e) => setGoalDesc(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="goal-start" className={styles.label}>
              Ngày bắt đầu
            </label>
            <input
              id="goal-start"
              type="date"
              className={styles.input}
              value={goalStart}
              onChange={(e) => setGoalStart(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="goal-due" className={styles.label}>
              Ngày hạn
            </label>
            <input
              id="goal-due"
              type="date"
              className={styles.input}
              value={goalDue}
              onChange={(e) => setGoalDue(e.target.value)}
            />
          </div>
          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setGoalSheetOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              {editingGoal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Milestone Create/Edit Sheet */}
      <Sheet
        open={msSheetOpen}
        title={editingMs ? 'Chỉnh sửa cột mốc' : 'Thêm cột mốc mới'}
        onClose={() => setMsSheetOpen(false)}
      >
        <form className={styles.form} onSubmit={submitMilestone}>
          <div className={styles.field}>
            <label htmlFor="ms-title" className={styles.label}>
              Tên cột mốc
            </label>
            <input
              id="ms-title"
              className={styles.input}
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="ms-desc" className={styles.label}>
              Mô tả
            </label>
            <input
              id="ms-desc"
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

      {/* Quest Create/Edit Sheet */}
      <Sheet
        open={questSheetOpen}
        title={editingQuest ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
        onClose={() => setQuestSheetOpen(false)}
      >
        <form className={styles.form} onSubmit={submitQuest}>
          <div className={styles.field}>
            <label htmlFor="work-q-title" className={styles.label}>
              Tên nhiệm vụ (3–100 ký tự)
            </label>
            <input
              id="work-q-title"
              className={styles.input}
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="work-q-desc" className={styles.label}>
              Mô tả
            </label>
            <input
              id="work-q-desc"
              className={styles.input}
              value={qDesc}
              onChange={(e) => setQDesc(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="work-q-type" className={styles.label}>
              Loại nhiệm vụ
            </label>
            <select
              id="work-q-type"
              className={styles.select}
              value={qType}
              onChange={(e) => setQType(e.target.value as QuestType)}
            >
              <option value="SIMPLE">SIMPLE</option>
              <option value="FOCUS">FOCUS</option>
              <option value="DURATION">DURATION</option>
              <option value="QUANTITY">QUANTITY</option>
              <option value="PROGRESS">PROGRESS</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="work-q-goal" className={styles.label}>
              Gắn với mục tiêu (tùy chọn)
            </label>
            <select
              id="work-q-goal"
              className={styles.select}
              value={qGoalId}
              onChange={(e) => setQGoalId(e.target.value)}
            >
              <option value="">Không gắn mục tiêu</option>
              {goals
                .filter((g) => g.status === 'ACTIVE')
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
            </select>
          </div>
          <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setQuestSheetOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="accent">
              {editingQuest ? 'Lưu nhiệm vụ' : 'Tạo nhiệm vụ'}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
