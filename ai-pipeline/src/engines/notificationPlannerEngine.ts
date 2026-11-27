import type {
  NotificationPlanRequest,
  NotificationPlanResponse,
  PlannedNotificationItem
} from '../domain/types.js'

function isHourInQuietWindow(hour: number, start: number, end: number): boolean {
  if (start === end) return false
  if (start < end) {
    return hour >= start && hour < end
  }
  // Overnight quiet window (e.g. 22 -> 06)
  return hour >= start || hour < end
}

/**
 * AI Notification Timing & Anti-Spam Planner (aligned with Branch 3: Push FCM).
 * Deduplicates by event type, respects muted conversations & Quiet Hours
 * (always allowing urgent `alarm.ringing` bypass), and formats FCM multicast payloads.
 */
export function buildNotificationDispatchPlan(
  req: NotificationPlanRequest
): NotificationPlanResponse {
  const quietStart = req.quietHoursStart ?? 22
  const quietEnd = req.quietHoursEnd ?? 6
  const goldenHour = req.preferredGoldenHour ?? 20

  const currentHour =
    typeof req.localHour === 'number'
      ? req.localHour
      : ((new Date().getUTCHours() + 7) % 24)

  const inQuietHours = isHourInQuietWindow(currentHour, quietStart, quietEnd)
  const seenTypes = new Set<string>()
  const items: PlannedNotificationItem[] = []

  let sendNowCount = 0
  let deferredCount = 0
  let suppressedCount = 0

  for (const evt of req.events) {
    const dedupeKey = `${evt.type}:${evt.data?.entityId ?? ''}`
    if (seenTypes.has(dedupeKey)) {
      suppressedCount += 1
      items.push({
        id: evt.id,
        type: evt.type,
        decision: 'DEDUP_DROPPED',
        scheduledLabel: 'Bỏ qua (trùng lặp)',
        reason: 'Đã có thông báo cùng loại trong đợt gửi hiện tại (chống spam).'
      })
      continue
    }
    seenTypes.add(dedupeKey)

    const isAlarmRinging = evt.type === 'alarm.ringing' || evt.priority === 'URGENT'

    if (evt.conversationMuted && !isAlarmRinging) {
      suppressedCount += 1
      items.push({
        id: evt.id,
        type: evt.type,
        decision: 'SUPPRESS_MUTED',
        scheduledLabel: 'Tắt tiếng theo cài đặt phòng',
        reason: 'Phòng chat đang được user bật chế độ Mute (isMuted = true).'
      })
      continue
    }

    if (inQuietHours && !isAlarmRinging) {
      deferredCount += 1
      const wakeLabel = `${String(quietEnd).padStart(2, '0')}:30 sáng mai`
      items.push({
        id: evt.id,
        type: evt.type,
        decision: 'DEFER_UNTIL_MORNING',
        scheduledLabel: `Hoãn tới ${wakeLabel}`,
        reason: `Đang trong Quiet Hours (${quietStart}:00–${quietEnd}:00); dời sang khung giờ sáng để tránh làm phiền.`,
        fcmPayload: {
          notification: { title: evt.title, body: evt.body },
          data: { ...(evt.data ?? {}), type: evt.type, deferred: 'true' }
        }
      })
      continue
    }

    sendNowCount += 1
    items.push({
      id: evt.id,
      type: evt.type,
      decision: 'SEND_NOW',
      scheduledLabel: isAlarmRinging
        ? 'Gửi ngay (Ưu tiên khẩn cấp)'
        : `Gửi ngay (khung giờ vàng ~${String(goldenHour).padStart(2, '0')}:00)`,
      reason: isAlarmRinging
        ? 'Thông báo khẩn cấp được phép vượt Quiet Hours.'
        : 'Ngoài Quiet Hours, khớp điều kiện gửi qua FCM sendEachForMulticast.',
      fcmPayload: {
        notification: { title: evt.title, body: evt.body },
        data: { ...(evt.data ?? {}), type: evt.type, priority: evt.priority }
      }
    })
  }

  return {
    userId: req.userId,
    inQuietHours,
    sendNowCount,
    deferredCount,
    suppressedCount,
    items
  }
}
