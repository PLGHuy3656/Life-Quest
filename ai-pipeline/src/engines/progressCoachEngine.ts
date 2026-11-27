import type { ProgressNudgeRequest, ProgressNudgeResponse } from '../domain/types.js'

/**
 * Proactive Progress & Milestone Coach:
 * Detects 50% (Halfway Momentum), 80% (Finish Line Sprint), 100% (Celebration),
 * and Behind Pace (elapsed >= 60% while progress < 30%) to trigger Fox nudges & FCM payloads.
 */
export function evaluateProgressNudge(req: ProgressNudgeRequest): ProgressNudgeResponse {
  const safeTotal = Math.max(1, req.totalCount)
  const safeCompleted = Math.max(0, Math.min(safeTotal, req.completedCount))
  const progressPercent = Math.round((safeCompleted / safeTotal) * 100)
  const remaining = Math.max(0, safeTotal - safeCompleted)
  const userName = req.userName?.trim() || 'bạn'
  const nextStep = req.nextStepTitle?.trim() || 'hoàn thành 1 bước nhỏ kế tiếp'

  if (progressPercent >= 100) {
    return {
      triggered: true,
      stage: 'COMPLETED_100',
      progressPercent: 100,
      foxMessage: `Xuất sắc ${userName}! "${req.title}" đã cán đích 100% rồi — nhận thưởng XP/Coin và khoe với nhóm ngay nhé!`,
      emotion: 'happy',
      nextActionLabel: req.isGroupShared ? 'Khoe thành tích vào nhóm' : 'Nhận thưởng & tạo chặng mới',
      pushPayload: {
        type: 'ai.progress.completed',
        title: `Hoàn thành 100%: ${req.title}`,
        body: `Chúc mừng ${userName} đã chinh phục trọn vẹn "${req.title}"!`,
        priority: 'HIGH',
        data: { entityType: req.entityType, entityId: req.entityId, stage: 'COMPLETED_100' }
      },
      suggestGroupShare: true
    }
  }

  if (progressPercent >= 80) {
    return {
      triggered: true,
      stage: 'SPRINT_80',
      progressPercent,
      foxMessage: `Nước rút nào ${userName}! "${req.title}" đã đạt ${progressPercent}% (chỉ còn ${remaining} việc nữa) — làm nốt "${nextStep}" là chốt 100%!`,
      emotion: 'encouraging',
      nextActionLabel: `Chốt nốt: ${nextStep}`,
      pushPayload: {
        type: 'ai.progress.sprint80',
        title: `Sắp cán đích ${progressPercent}% — ${req.title}`,
        body: `Chỉ còn ${remaining} bước nữa thôi! Mở app hoàn tất ngay để nhận trọn XP/Coin.`,
        priority: 'HIGH',
        data: { entityType: req.entityType, entityId: req.entityId, stage: 'SPRINT_80' }
      },
      suggestGroupShare: false
    }
  }

  if (progressPercent >= 50) {
    return {
      triggered: true,
      stage: 'HALFWAY_50',
      progressPercent,
      foxMessage: `Tuyệt vời ${userName}! Bạn đã đi được nửa chặng đường (${progressPercent}%) với "${req.title}". Giữ đà bằng bước nhỏ: "${nextStep}" nhé!`,
      emotion: 'happy',
      nextActionLabel: `Tiếp tục nửa sau (${remaining} việc còn lại)`,
      pushPayload: {
        type: 'ai.progress.halfway',
        title: `Đạt mốc 50%: ${req.title}`,
        body: `Bạn đã hoàn thành ${safeCompleted}/${safeTotal} bước (${progressPercent}%). Giữ vững nhịp độ cùng Fox!`,
        priority: 'NORMAL',
        data: { entityType: req.entityType, entityId: req.entityId, stage: 'HALFWAY_50' }
      },
      suggestGroupShare: Boolean(req.isGroupShared)
    }
  }

  if (typeof req.elapsedTimeRatio === 'number' && req.elapsedTimeRatio >= 0.6 && progressPercent < 30) {
    return {
      triggered: true,
      stage: 'BEHIND_PACE',
      progressPercent,
      foxMessage: `Fox nhắc nhẹ nè ${userName}: "${req.title}" đã trôi qua ${Math.round(req.elapsedTimeRatio * 100)}% thời gian nhưng mới đạt ${progressPercent}%. Thử chia nhỏ bước "${nextStep}" làm 10 phút trước nhé!`,
      emotion: 'alert',
      nextActionLabel: 'Chia nhỏ 10 phút để khởi động lại',
      pushPayload: {
        type: 'ai.progress.behind_pace',
        title: `Nhắc nhịp độ: ${req.title}`,
        body: `Mới đạt ${progressPercent}% tiến độ — Fox đã gợi ý chia nhỏ nhiệm vụ để bạn kịp hạn.`,
        priority: 'HIGH',
        data: { entityType: req.entityType, entityId: req.entityId, stage: 'BEHIND_PACE' }
      },
      suggestGroupShare: false
    }
  }

  return {
    triggered: false,
    stage: 'ON_TRACK',
    progressPercent,
    foxMessage: `"${req.title}" đang ở mức ${progressPercent}% (${safeCompleted}/${safeTotal}). Cứ tiếp tục đều đặn, chạm mốc 50% Fox sẽ chúc mừng nhé!`,
    emotion: 'calm',
    nextActionLabel: nextStep,
    pushPayload: {
      type: 'ai.progress.info',
      title: `Tiến độ ${progressPercent}%: ${req.title}`,
      body: `Còn ${remaining} bước để hoàn thành mục tiêu.`,
      priority: 'LOW',
      data: { entityType: req.entityType, entityId: req.entityId, stage: 'ON_TRACK' }
    },
    suggestGroupShare: false
  }
}
