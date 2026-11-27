import type {
  BehavioralSnapshot14d,
  DataSource,
  RecommendationCandidate
} from '../domain/types.js'
import { getMockBehavioralDataset14d } from '../mock/behavioralDataset14d.js'
import { analyzeAlarmDiscipline } from './alarmCoachEngine.js'
import { evaluateProgressNudge } from './progressCoachEngine.js'
import { recommendWardrobeCosmetics } from './wardrobeStylistEngine.js'

function getLocalHour(isoDate: string, timezone: string): number | null {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone
    })
    const hourStr = formatter.format(date)
    const hour = Number.parseInt(hourStr, 10)
    return Number.isFinite(hour) ? hour % 24 : date.getUTCHours()
  } catch {
    return (date.getUTCHours() + 7) % 24
  }
}

function padHour(h: number): string {
  return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`
}

function addHoursIso(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
}

export function analyzeBehavior14d(
  snapshot: BehavioralSnapshot14d,
  now = new Date()
): RecommendationCandidate[] {
  const mockData = snapshot.allowMockFallback
    ? getMockBehavioralDataset14d(snapshot.userId, now)
    : null

  const expiresAt = addHoursIso(now, 24)
  const results: RecommendationCandidate[] = []

  // --- Rule 1: SCHEDULE_OPTIMIZATION (Peak 2-hour completion/focus window) ---
  const liveCompletedTimes = [
    ...snapshot.executions
      .filter((e) => e.status === 'COMPLETED' && Boolean(e.completedAt))
      .map((e) => e.completedAt as string),
    ...snapshot.focusSessions
      .filter((f) => f.status === 'COMPLETED')
      .map((f) => f.startedAt)
  ]

  const useMockSchedule = liveCompletedTimes.length < 3 && Boolean(mockData)
  const completedTimes = useMockSchedule
    ? [
        ...mockData!.executions
          .filter((e) => e.status === 'COMPLETED' && Boolean(e.completedAt))
          .map((e) => e.completedAt as string),
        ...mockData!.focusSessions
          .filter((f) => f.status === 'COMPLETED')
          .map((f) => f.startedAt)
      ]
    : liveCompletedTimes

  if (completedTimes.length >= 3) {
    const hourCounts = new Array<number>(24).fill(0)
    for (const iso of completedTimes) {
      const h = getLocalHour(iso, snapshot.timezone)
      if (h !== null) hourCounts[h] += 1
    }

    let bestStartHour = 20
    let bestWindowCount = 0
    for (let h = 0; h < 24; h++) {
      const count = hourCounts[h] + hourCounts[(h + 1) % 24]
      if (count > bestWindowCount) {
        bestWindowCount = count
        bestStartHour = h
      }
    }

    const sourceSchedules = useMockSchedule ? mockData!.activeSchedules : snapshot.activeSchedules
    const sourceQuests = useMockSchedule ? mockData!.activeQuests : snapshot.activeQuests
    const targetSchedule = sourceSchedules.find((s) => s.scheduleType === 'RECURRING') ?? sourceSchedules[0]
    const targetQuest = targetSchedule
      ? sourceQuests.find((q) => q.questId === targetSchedule.questId)
      : sourceQuests[0]

    const recommendedTimeOfDay = padHour(bestStartHour)
    const endWindow = padHour(bestStartHour + 2)
    const dataSource: DataSource = useMockSchedule ? 'MOCK' : 'LIVE'

    results.push({
      type: 'SCHEDULE_OPTIMIZATION',
      source: 'BEHAVIOR_ENGINE_V1',
      title: `Dời lịch về khung giờ vàng ${recommendedTimeOfDay}–${endWindow}`,
      reason: `14 ngày qua bạn hoàn thành cao nhất (${bestWindowCount} phiên) trong khung ${recommendedTimeOfDay}–${endWindow}.`,
      priorityScore: Math.min(92, 80 + Math.min(12, bestWindowCount)),
      expiresAt,
      dataSource,
      actionPayload: {
        kind: 'RESCHEDULE_QUEST',
        questId: targetQuest?.questId,
        questTitle: targetQuest?.title,
        scheduleId: targetSchedule?.scheduleId,
        currentTimeOfDay: targetSchedule?.timeOfDay ?? null,
        recommendedTimeOfDay
      }
    })
  }

  // --- Rule 2: QUEST_SUGGESTION (Quest skipped/abandoned >= 3 times -> split) ---
  const countSkips = (execs: BehavioralSnapshot14d['executions']) => {
    const map = new Map<string, { questId: string; questTitle: string; count: number }>()
    for (const e of execs) {
      if (e.status === 'SKIPPED' || e.status === 'ABANDONED') {
        const prev = map.get(e.questId)
        if (prev) {
          prev.count += 1
        } else {
          map.set(e.questId, { questId: e.questId, questTitle: e.questTitle, count: 1 })
        }
      }
    }
    return [...map.values()].filter((x) => x.count >= 3).sort((a, b) => b.count - a.count)
  }

  const liveSkipped = countSkips(snapshot.executions)
  const useMockSkip = liveSkipped.length === 0 && Boolean(mockData)
  const skippedTarget = useMockSkip ? countSkips(mockData!.executions)[0] : liveSkipped[0]

  if (skippedTarget) {
    const sourceQuests = useMockSkip ? mockData!.activeQuests : snapshot.activeQuests
    const questMeta = sourceQuests.find((q) => q.questId === skippedTarget.questId)
    const dataSource: DataSource = useMockSkip ? 'MOCK' : 'LIVE'

    results.push({
      type: 'QUEST_SUGGESTION',
      source: 'BEHAVIOR_ENGINE_V1',
      title: `Chia nhỏ nhiệm vụ "${skippedTarget.questTitle}"`,
      reason: `Nhiệm vụ này đã bị bỏ qua ${skippedTarget.count} lần trong 14 ngày. Chia thành 3 chặng 10–15 phút sẽ dễ khởi động hơn.`,
      priorityScore: Math.min(95, 85 + Math.min(10, skippedTarget.count * 2)),
      expiresAt,
      dataSource,
      actionPayload: {
        kind: 'SPLIT_QUEST',
        questId: skippedTarget.questId,
        questTitle: skippedTarget.questTitle,
        goalId: questMeta?.goalId ?? null,
        milestoneId: questMeta?.milestoneId ?? null,
        suggestedSubQuests: [
          {
            title: `[Bước 1] Khởi động 10p: ${skippedTarget.questTitle}`.slice(0, 100),
            estimatedDurationSeconds: 600,
            type: 'SIMPLE'
          },
          {
            title: `[Bước 2] Tập trung 15p: ${skippedTarget.questTitle}`.slice(0, 100),
            estimatedDurationSeconds: 900,
            type: 'FOCUS'
          },
          {
            title: `[Bước 3] Rà soát & chốt: ${skippedTarget.questTitle}`.slice(0, 100),
            estimatedDurationSeconds: 600,
            type: 'SIMPLE'
          }
        ]
      }
    })
  }

  // --- Rule 3: CHALLENGE_MATCH (Friend's active challenge user hasn't joined) ---
  const liveMatch = snapshot.friendChallenges.find((c) => !c.alreadyJoined)
  const useMockChallenge = !liveMatch && Boolean(mockData)
  const challengeTarget = useMockChallenge
    ? mockData!.friendChallenges.find((c) => !c.alreadyJoined)
    : liveMatch

  if (challengeTarget) {
    const friendList =
      challengeTarget.friendNames.length > 0
        ? challengeTarget.friendNames.slice(0, 2).join(', ')
        : 'bạn bè của bạn'
    const dataSource: DataSource = useMockChallenge ? 'MOCK' : 'LIVE'

    results.push({
      type: 'CHALLENGE_MATCH',
      source: 'BEHAVIOR_ENGINE_V1',
      title: `Tham gia thử thách "${challengeTarget.name}"`,
      reason: `${friendList} đang tham gia thử thách này — tham gia cùng sẽ tăng động lực giữ chuỗi.`,
      priorityScore: Math.min(84, 72 + Math.min(12, challengeTarget.friendNames.length * 4)),
      expiresAt,
      dataSource,
      actionPayload: {
        kind: 'JOIN_CHALLENGE',
        challengeId: challengeTarget.challengeId,
        challengeName: challengeTarget.name,
        friendNames: challengeTarget.friendNames
      }
    })
  }

  // --- Rule 4: REWARD_SUGGESTION (Streak >= 5, 0 Freeze, enough Coin) ---
  const checkFreezeCandidate = (snap: BehavioralSnapshot14d) => {
    const freezePrice = snap.freezeRewardItem?.priceCoin ?? 150
    const qualifying = snap.streaks
      .filter((s) => s.currentCount >= 5 && s.freezeCount === 0)
      .sort((a, b) => b.currentCount - a.currentCount)[0]
    if (!qualifying || snap.coinBalance < freezePrice) return null
    return {
      streak: qualifying.currentCount,
      coinBalance: snap.coinBalance,
      freezePrice,
      rewardItemId: snap.freezeRewardItem?.rewardItemId
    }
  }

  const liveFreeze = checkFreezeCandidate(snapshot)
  const useMockFreeze = !liveFreeze && Boolean(mockData)
  const freezeTarget = useMockFreeze ? checkFreezeCandidate(mockData!) : liveFreeze

  if (freezeTarget) {
    const dataSource: DataSource = useMockFreeze ? 'MOCK' : 'LIVE'
    results.push({
      type: 'REWARD_SUGGESTION',
      source: 'BEHAVIOR_ENGINE_V1',
      title: `Bảo vệ chuỗi ${freezeTarget.streak} ngày bằng Streak Freeze`,
      reason: `Bạn đang giữ chuỗi ${freezeTarget.streak} ngày, chưa có Khiên Freeze và đang có ${freezeTarget.coinBalance} Coin (giá ${freezeTarget.freezePrice} Coin).`,
      priorityScore: Math.min(96, 88 + Math.min(8, freezeTarget.streak - 5)),
      expiresAt,
      dataSource,
      actionPayload: {
        kind: 'BUY_STREAK_FREEZE',
        rewardItemId: freezeTarget.rewardItemId,
        priceCoin: freezeTarget.freezePrice,
        currentStreak: freezeTarget.streak,
        coinBalance: freezeTarget.coinBalance,
        targetRoute: '/wardrobe/shop'
      }
    })
  }

  // --- Rule 5: PROGRESS_NUDGE (50% Halfway / 80% Sprint / Behind Pace) ---
  const liveProgress = snapshot.goalProgress ?? []
  const useMockProgress = liveProgress.length === 0 && Boolean(mockData?.goalProgress?.length)
  const progressList = useMockProgress ? (mockData?.goalProgress ?? []) : liveProgress

  for (const gp of progressList) {
    const nudge = evaluateProgressNudge(gp)
    if (nudge.triggered && nudge.stage !== 'ON_TRACK') {
      results.push({
        type: 'PROGRESS_NUDGE',
        source: 'PROGRESS_COACH_V1',
        title: `Đạt mốc ${nudge.progressPercent}%: ${gp.title}`,
        reason: nudge.foxMessage,
        priorityScore: nudge.stage === 'BEHIND_PACE' ? 94 : nudge.stage === 'SPRINT_80' ? 91 : 89,
        expiresAt,
        dataSource: useMockProgress ? 'MOCK' : 'LIVE',
        actionPayload: {
          kind: 'OPEN_NEXT_STEP',
          entityId: gp.entityId,
          progressPercent: nudge.progressPercent,
          milestoneStage: nudge.stage,
          nextStepTitle: gp.nextStepTitle,
          targetRoute: '/work/quests'
        }
      })
      break
    }
  }

  // --- Rule 6: COSMETIC_SUGGESTION (AI Mascot Wardrobe Stylist) ---
  const hasWardrobe = Boolean(snapshot.wardrobeProfile)
  if (hasWardrobe || mockData?.wardrobeProfile) {
    const stylist = recommendWardrobeCosmetics({
      ...(hasWardrobe ? snapshot.wardrobeProfile! : {}),
      useMockIfEmpty: !hasWardrobe && snapshot.allowMockFallback
    })
    const bestCosmetic = stylist.suggestions[0]
    if (bestCosmetic) {
      results.push({
        type: 'COSMETIC_SUGGESTION',
        source: 'WARDROBE_STYLIST_V1',
        title: `Trang trí Fox: Gợi ý mua "${bestCosmetic.displayNameVi}"`,
        reason: bestCosmetic.reason,
        priorityScore: bestCosmetic.completesOutfitSet ? 88 : 81,
        expiresAt,
        dataSource: stylist.dataSource,
        actionPayload: {
          kind: 'PREVIEW_OR_BUY_COSMETIC',
          itemId: bestCosmetic.itemId,
          itemNameVi: bestCosmetic.displayNameVi,
          slot: bestCosmetic.slot,
          outfitThemeId: bestCosmetic.outfitThemeId,
          priceCoin: bestCosmetic.priceCoin,
          coinGap: bestCosmetic.coinGap,
          completesOutfitSet: bestCosmetic.completesOutfitSet,
          targetRoute: '/wardrobe/shop'
        }
      })
    }
  }

  // --- Rule 7: ALARM_OPTIMIZATION (Smart Alarm & Mini-Game Coach — Branch 4) ---
  const hasAlarmData = Boolean(snapshot.alarmTriggers && snapshot.alarmTriggers.length > 0)
  if (hasAlarmData || (mockData?.alarmTriggers && mockData.alarmTriggers.length > 0)) {
    const alarmAdvice = analyzeAlarmDiscipline({
      triggers: hasAlarmData ? snapshot.alarmTriggers : undefined,
      useMockIfEmpty: !hasAlarmData && snapshot.allowMockFallback
    })
    if (alarmAdvice.missedCount >= 2 || alarmAdvice.avgSnoozeCount >= 1.8) {
      results.push({
        type: 'ALARM_OPTIMIZATION',
        source: 'ALARM_COACH_V1',
        title: `Nâng cấp Báo thức ${alarmAdvice.timeOfDay} → ${alarmAdvice.recommendedMiniGame} (${alarmAdvice.recommendedDifficulty})`,
        reason: `${alarmAdvice.reason} ${alarmAdvice.foxAdvice}`,
        priorityScore: 86,
        expiresAt,
        dataSource: alarmAdvice.dataSource,
        actionPayload: {
          kind: 'UPDATE_ALARM_MINIGAME',
          alarmId: alarmAdvice.alarmId,
          recommendedMiniGame: alarmAdvice.recommendedMiniGame,
          recommendedDifficulty: alarmAdvice.recommendedDifficulty,
          suggestedAffirmation: alarmAdvice.suggestedAffirmation
        }
      })
    }
  }

  return results.sort((a, b) => b.priorityScore - a.priorityScore)
}
