import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { EmptyState, ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import {
  useCalendarQuestsQuery,
  useCalendarTodayQuery,
  useQuestSchedulesQuery,
  useScheduleMutations
} from '@/hooks/useCalendarData'
import type { RecurrenceRule, ScheduleType } from '@/types/domain'
import {
  addDaysLocal,
  addMonthsLocal,
  combineLocalDateAndTimeToIso,
  getBrowserTimezone,
  getMonthCalendarGrid,
  getTodayLocalDate,
  getWeekDatesLocal,
  parseLocalDate
} from '@/utils/date'
import styles from './CalendarPage.module.css'

type CalendarView = 'month' | 'week' | 'day'

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const DOW_OPTIONS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' }
]

export function CalendarPage() {
  const todayYmd = getTodayLocalDate()
  const [selectedDate, setSelectedDate] = useState(todayYmd)
  const [view, setView] = useState<CalendarView>('month')
  const [selectedQuestId, setSelectedQuestId] = useState<string>('')

  // Schedule create sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<ScheduleType>('ONE_TIME')
  const [startDate, setStartDate] = useState(todayYmd)
  const [endDate, setEndDate] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('08:30')
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5])
  const [timezone, setTimezone] = useState(getBrowserTimezone())
  const [formError, setFormError] = useState<string | null>(null)

  const todayQuery = useCalendarTodayQuery(selectedDate)
  const questsQuery = useCalendarQuestsQuery()
  const activeQuests = questsQuery.data ?? []
  const effectiveQuestId = selectedQuestId || activeQuests[0]?.id || null

  const schedulesQuery = useQuestSchedulesQuery(effectiveQuestId)
  const schedMut = useScheduleMutations(effectiveQuestId)

  const parsedSelected = parseLocalDate(selectedDate)
  const monthLabel = `Tháng ${parsedSelected.getMonth() + 1} / ${parsedSelected.getFullYear()}`
  const gridCells =
    view === 'month'
      ? getMonthCalendarGrid(parsedSelected.getFullYear(), parsedSelected.getMonth(), todayYmd)
      : view === 'week'
        ? getWeekDatesLocal(selectedDate, todayYmd)
        : [
            {
              ymd: selectedDate,
              dayOfMonth: parsedSelected.getDate(),
              inCurrentMonth: true,
              isToday: selectedDate === todayYmd
            }
          ]

  const stepPeriod = (dir: -1 | 1) => {
    if (view === 'month') {
      setSelectedDate((d) => addMonthsLocal(d, dir))
    } else if (view === 'week') {
      setSelectedDate((d) => addDaysLocal(d, dir * 7))
    } else {
      setSelectedDate((d) => addDaysLocal(d, dir))
    }
  }

  const toggleDow = (dow: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort()
    )
  }

  const handleCreateSchedule = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!effectiveQuestId) {
      setFormError('Vui lòng chọn một nhiệm vụ trước khi tạo lịch.')
      return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)) {
      setFormError('Giờ thực hiện phải đúng định dạng HH:mm (ví dụ 08:30).')
      return
    }
    if (endDate && endDate <= startDate) {
      setFormError('Ngày kết thúc (endAt) phải lớn hơn ngày bắt đầu (startAt).')
      return
    }
    if (scheduleType === 'RECURRING' && frequency === 'WEEKLY' && daysOfWeek.length === 0) {
      setFormError('Chọn ít nhất 1 thứ trong tuần cho lịch lặp hàng tuần.')
      return
    }

    const startAt = combineLocalDateAndTimeToIso(startDate, timeOfDay)
    const endAt = endDate ? combineLocalDateAndTimeToIso(endDate, '23:59') : null

    const recurrenceRule: RecurrenceRule | undefined =
      scheduleType === 'RECURRING'
        ? {
            frequency,
            interval: 1,
            timeOfDay,
            ...(frequency === 'WEEKLY' ? { daysOfWeek } : {})
          }
        : undefined

    try {
      await schedMut.createSchedule.mutateAsync({
        scheduleType,
        timezone: timezone.trim() || 'Asia/Ho_Chi_Minh',
        startAt,
        endAt,
        ...(recurrenceRule ? { recurrenceRule } : {})
      })
      setSheetOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo lịch trình.')
    }
  }

  return (
    <div className={styles.stack}>
      <div className={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className={styles.heading}>Lịch &amp; Today</h1>
          <SourceBadge source="LIVE" />
        </div>

        <div className={styles.viewSwitch} role="group" aria-label="Chế độ xem lịch">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.viewBtn} ${view === mode ? styles.viewBtnActive : ''}`}
              onClick={() => setView(mode)}
            >
              {mode === 'month' ? 'Tháng' : mode === 'week' ? 'Tuần' : 'Ngày'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <Card>
          <div className={styles.navRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Button variant="ghost" size="icon" onClick={() => stepPeriod(-1)} aria-label="Kỳ trước">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => stepPeriod(1)} aria-label="Kỳ sau">
                <ChevronRight size={16} />
              </Button>
              <span className={styles.monthLabel}>{monthLabel}</span>
            </div>
            <Button variant="subtle" size="sm" onClick={() => setSelectedDate(todayYmd)}>
              Hôm nay
            </Button>
          </div>

          {view !== 'day' && (
            <div className={styles.weekdays} aria-hidden="true">
              {WEEKDAY_HEADERS.map((d) => (
                <div key={d} className={styles.weekday}>
                  {d}
                </div>
              ))}
            </div>
          )}

          <div
            className={styles.daysGrid}
            style={view === 'day' ? { gridTemplateColumns: '1fr' } : undefined}
          >
            {gridCells.map((cell) => (
              <button
                key={cell.ymd}
                type="button"
                onClick={() => setSelectedDate(cell.ymd)}
                aria-pressed={cell.ymd === selectedDate}
                data-date={cell.ymd}
                className={[
                  styles.dayCell,
                  !cell.inCurrentMonth ? styles.dayMuted : '',
                  cell.isToday ? styles.dayToday : '',
                  cell.ymd === selectedDate ? styles.daySelected : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span>{view === 'day' ? cell.ymd : cell.dayOfMonth}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className={styles.stack}>
          <Card>
            <div className={styles.navRow}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Ngày {selectedDate}</h2>
                <p style={{ fontSize: 12, color: 'var(--lq-ink-secondary)' }}>
                  Từ <code>GET /api/v1/today?date={selectedDate}</code>
                </p>
              </div>
              {todayQuery.data && (
                <Chip tone="success">
                  {todayQuery.data.summary.completedTasks}/{todayQuery.data.summary.totalTasks} hoàn
                  thành
                </Chip>
              )}
            </div>

            {todayQuery.isLoading ? (
              <LoadingSkeleton height={110} />
            ) : todayQuery.error ? (
              <ErrorBanner error={todayQuery.error} onRetry={() => todayQuery.refetch()} />
            ) : (todayQuery.data?.schedules.length ?? 0) === 0 ? (
              <EmptyState
                title="Không có lịch trình trong ngày này"
                description="Chọn nhiệm vụ bên dưới để gắn lịch ONE_TIME hoặc RECURRING."
              />
            ) : (
              <div className={styles.list}>
                {todayQuery.data!.schedules.map((item) => (
                  <div key={item.id} className={styles.rowCard}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.quest.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--lq-ink-secondary)' }}>
                        {item.timeOfDay} • {item.scheduleType} • +{item.quest.xpReward} XP
                      </div>
                    </div>
                    <Chip tone="neutral">Chờ Execution API</Chip>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className={styles.navRow}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Quản lý lịch nhiệm vụ</h2>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setStartDate(selectedDate)
                  setFormError(null)
                  setSheetOpen(true)
                }}
                disabled={!effectiveQuestId}
              >
                <Plus size={14} /> Tạo lịch
              </Button>
            </div>

            <div className={styles.field} style={{ marginBottom: 12 }}>
              <label htmlFor="cal-quest-select" className={styles.label}>
                Chọn nhiệm vụ (ACTIVE)
              </label>
              <select
                id="cal-quest-select"
                className={styles.select}
                value={effectiveQuestId ?? ''}
                onChange={(e) => setSelectedQuestId(e.target.value)}
              >
                {activeQuests.length === 0 ? (
                  <option value="">Chưa có nhiệm vụ ACTIVE</option>
                ) : (
                  activeQuests.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {schedulesQuery.isLoading ? (
              <LoadingSkeleton height={80} />
            ) : schedulesQuery.error ? (
              <ErrorBanner error={schedulesQuery.error} onRetry={() => schedulesQuery.refetch()} />
            ) : (schedulesQuery.data?.length ?? 0) === 0 ? (
              <EmptyState
                title="Nhiệm vụ chưa có lịch trình"
                description="Tạo lịch ONE_TIME hoặc RECURRING qua POST /api/v1/quests/:id/schedules."
              />
            ) : (
              <div className={styles.list}>
                {schedulesQuery.data!.map((s) => (
                  <div key={s.id} className={styles.rowCard}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {s.scheduleType}{' '}
                        {s.recurrenceRule ? `(${s.recurrenceRule.frequency})` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--lq-ink-secondary)' }}>
                        Bắt đầu {s.startAt.slice(0, 10)} • {s.timezone}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Chip tone={s.isActive ? 'success' : 'danger'}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Chip>
                      {s.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => schedMut.deactivateSchedule.mutate(s.id)}
                        >
                          <PowerOff size={13} /> Tắt
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        title="Tạo lịch trình nhiệm vụ"
        subtitle="Tuân thủ Joi schema POST /api/v1/quests/:questId/schedules."
        onClose={() => setSheetOpen(false)}
      >
        <form className={styles.form} onSubmit={handleCreateSchedule}>
          <div className={styles.field}>
            <label htmlFor="sched-type" className={styles.label}>
              Loại lịch (scheduleType)
            </label>
            <select
              id="sched-type"
              className={styles.select}
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
            >
              <option value="ONE_TIME">ONE_TIME — Một lần</option>
              <option value="RECURRING">RECURRING — Lặp lại</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="sched-start" className={styles.label}>
              Ngày bắt đầu
            </label>
            <input
              id="sched-start"
              type="date"
              className={styles.input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sched-time" className={styles.label}>
              Giờ thực hiện (HH:mm)
            </label>
            <input
              id="sched-time"
              type="time"
              className={styles.input}
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sched-end" className={styles.label}>
              Ngày kết thúc (tùy chọn)
            </label>
            <input
              id="sched-end"
              type="date"
              className={styles.input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {scheduleType === 'RECURRING' && (
            <>
              <div className={styles.field}>
                <label htmlFor="sched-freq" className={styles.label}>
                  Tần suất (frequency)
                </label>
                <select
                  id="sched-freq"
                  className={styles.select}
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
                >
                  <option value="DAILY">DAILY — Hằng ngày</option>
                  <option value="WEEKLY">WEEKLY — Hằng tuần</option>
                  <option value="MONTHLY">MONTHLY — Hằng tháng</option>
                </select>
              </div>

              {frequency === 'WEEKLY' && (
                <div className={styles.field}>
                  <span className={styles.label}>Các ngày trong tuần</span>
                  <div className={styles.daysRow}>
                    {DOW_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleDow(opt.value)}
                        aria-pressed={daysOfWeek.includes(opt.value)}
                        className={`${styles.dowBtn} ${daysOfWeek.includes(opt.value) ? styles.dowBtnActive : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.field}>
            <label htmlFor="sched-tz" className={styles.label}>
              Múi giờ (IANA timezone)
            </label>
            <input
              id="sched-tz"
              className={styles.input}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>

          {formError && (
            <div className={styles.errorBox} role="alert">
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setSheetOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="accent" disabled={schedMut.createSchedule.isPending}>
              Lưu lịch trình
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
