import type {
  DataSource,
  GroupChatAssistRequest,
  GroupChatAssistResponse
} from '../domain/types.js'
import { resolveMockGroupContext } from '../mock/groupChatFixtures.js'

export function buildGroupChatAssist(req: GroupChatAssistRequest): GroupChatAssistResponse {
  const hasLiveContext = Boolean(
    req.groupContext &&
      (req.groupContext.groupTitle ||
        req.groupContext.planTitle ||
        req.groupContext.challengeName ||
        (req.groupContext.pendingMemberNames && req.groupContext.pendingMemberNames.length > 0))
  )

  const fallback = resolveMockGroupContext(req.conversationId)
  const dataSource: DataSource = hasLiveContext ? 'LIVE' : 'MOCK'

  const groupTitle = req.groupContext?.groupTitle || fallback.groupTitle
  const currentStreak = req.groupContext?.currentStreak ?? fallback.currentStreak
  const streakMode = req.groupContext?.streakMode ?? fallback.streakMode
  const thresholdPercent = req.groupContext?.thresholdPercent ?? fallback.thresholdPercent
  const totalMembers = Math.max(1, req.groupContext?.totalMembers ?? fallback.totalMembers)
  const qualifiedCount = Math.max(0, Math.min(totalMembers, req.groupContext?.qualifiedCount ?? fallback.qualifiedCount))
  const freezeCount = req.groupContext?.freezeCount ?? fallback.freezeCount

  const requiredMembers =
    streakMode === 'ALL_MEMBERS'
      ? totalMembers
      : Math.ceil((totalMembers * thresholdPercent) / 100)
  const membersNeededToSaveStreak = Math.max(0, requiredMembers - qualifiedCount)
  const currentCompletionPercent = Math.round((qualifiedCount / totalMembers) * 100)

  const pendingNames = req.groupContext?.pendingMemberNames?.length
    ? req.groupContext.pendingMemberNames
    : fallback.pendingMemberNames
  const pendingIds = req.groupContext?.pendingMemberIds?.length
    ? req.groupContext.pendingMemberIds
    : fallback.pendingMemberIds
  const actor = req.actorName?.trim() || 'Một thành viên'

  if (req.mode === 'STREAK_RISK_NUDGE') {
    const namesText = pendingNames.join(', ')
    const rescueNote =
      membersNeededToSaveStreak > 0
        ? `Hiện đạt ${qualifiedCount}/${totalMembers} (${currentCompletionPercent}%), chỉ cần thêm đúng ${membersNeededToSaveStreak} người nữa là đạt chuẩn ${streakMode === 'ALL_MEMBERS' ? '100%' : `${thresholdPercent}%`} để giữ chuỗi ${currentStreak} ngày!`
        : `Nhóm đã đạt chuẩn hôm nay (${qualifiedCount}/${totalMembers}) — khích lệ ${namesText} cùng về đích 100% nhé!`

    return {
      conversationId: req.conversationId,
      mode: req.mode,
      messageKind: 'STREAK_NOTICE',
      content: `🔥 [${groupTitle}] ${rescueNote} Fox nhắc nhẹ ${namesText} chốt 1 nhiệm vụ ngay nhé!`,
      metadata: {
        type: 'GROUP_STREAK_AT_RISK',
        groupTitle,
        currentStreak,
        streakMode,
        thresholdPercent,
        qualifiedCount,
        totalMembers,
        membersNeededToSaveStreak,
        freezeCount,
        pendingMemberNames: pendingNames,
        generatedBy: 'ai-pipeline'
      },
      targetPendingUserIds: pendingIds,
      membersNeededToSaveStreak,
      currentCompletionPercent,
      dataSource
    }
  }

  if (req.mode === 'SHARED_PLAN_SUMMARY') {
    const planTitle = req.groupContext?.planTitle || fallback.planTitle
    return {
      conversationId: req.conversationId,
      mode: req.mode,
      messageKind: 'QUEST_INVITE',
      content: `🗺️ ${actor} vừa chia sẻ lộ trình AI "${planTitle}" vào ${groupTitle}. Cùng nhận nhiệm vụ đồng hành và giữ chuỗi ${currentStreak} ngày nhé!`,
      metadata: {
        type: 'AI_PLAN_SHARE',
        groupTitle,
        planTitle,
        sharedBy: actor,
        generatedBy: 'ai-pipeline'
      },
      targetPendingUserIds: [],
      membersNeededToSaveStreak,
      currentCompletionPercent,
      dataSource
    }
  }

  const challengeName = req.groupContext?.challengeName || fallback.challengeName
  return {
    conversationId: req.conversationId,
    mode: req.mode,
    messageKind: 'QUEST_INVITE',
    content: `🏆 ${actor} rủ cả nhóm ${groupTitle} tham gia thử thách "${challengeName}"! Ai sẵn sàng bật chế độ tập trung cùng Fox nào?`,
    metadata: {
      type: 'CHALLENGE_GROUP_INVITE',
      groupTitle,
      challengeName,
      invitedBy: actor,
      generatedBy: 'ai-pipeline'
    },
    targetPendingUserIds: pendingIds,
    membersNeededToSaveStreak,
    currentCompletionPercent,
    dataSource
  }
}
