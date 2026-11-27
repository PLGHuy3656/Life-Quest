import { loadEnv, type AiPipelineEnv } from '../config/env.js'
import { GeneratedPlanBodySchema } from '../domain/schemas.js'
import type {
  GeneratedMilestone,
  GeneratedPlan,
  PlanGenerateInput,
  PlanLevel
} from '../domain/types.js'
import { callGeminiStructured } from '../providers/geminiClient.js'

interface DomainProfile {
  category: string
  preferredTime: string
  phase1Quests: [string, string]
  phase2Quests: [string, string]
  phase3Quests: [string, string]
  phase4Quests: [string, string]
}

function detectDomainProfile(prompt: string, explicitCategory?: string): DomainProfile {
  const lower = prompt.toLowerCase()

  if (/(ielts|toeic|tiếng anh|english|nhật|hàn|học|ôn thi|đọc sách|toán|nghiên cứu)/.test(lower)) {
    return {
      category: explicitCategory || 'Học tập & Tri thức',
      preferredTime: '20:00',
      phase1Quests: [
        `Đánh giá trình độ hiện tại và chuẩn bị tài liệu cho: ${prompt}`,
        'Xây dựng bộ từ vựng / khái niệm cốt lõi mỗi ngày'
      ],
      phase2Quests: [
        `Phiên tập trung sâu luyện bài tập thực chiến về ${prompt}`,
        'Ghi chép lỗi sai và ôn lại kiến thức trọng tâm cuối tuần'
      ],
      phase3Quests: [
        'Làm bài kiểm tra mô phỏng theo đúng thời gian thực tế',
        'Rà soát điểm yếu và hoàn thiện mục tiêu cuối lộ trình'
      ],
      phase4Quests: [
        'Tăng cường luyện đề nâng cao và tốc độ xử lý',
        'Tổng kết tiến bộ & thiết lập thói quen duy trì dài hạn'
      ]
    }
  }

  if (/(chạy bộ|gym|tập|giảm cân|sức khỏe|yoga|bơi|thể dục|ngủ sớm|uống nước)/.test(lower)) {
    return {
      category: explicitCategory || 'Sức khỏe & Thể chất',
      preferredTime: '06:30',
      phase1Quests: [
        `Khởi động nhẹ và đo chỉ số nền tảng cho: ${prompt}`,
        'Thiết lập lịch tập cố định & chuẩn bị trang bị cần thiết'
      ],
      phase2Quests: [
        `Buổi tập chính duy trì nhịp độ ổn định cho ${prompt}`,
        'Theo dõi hồi phục, giãn cơ và ghi nhận cảm nhận cơ thể'
      ],
      phase3Quests: [
        'Thử thách nâng ngưỡng cường độ nhẹ và kiểm tra tiến độ',
        'Tổng kết chỉ số thể lực đạt được sau lộ trình'
      ],
      phase4Quests: [
        'Củng cố sức bền với phiên tập phối hợp đa nhóm cơ',
        'Chốt cột mốc thể chất và lên kế hoạch duy trì tuần mới'
      ]
    }
  }

  if (/(code|lập trình|react|node|python|typescript|đồ án|project|backend|frontend|ai|portfolio|công việc)/.test(lower)) {
    return {
      category: explicitCategory || 'Sự nghiệp & Kỹ năng số',
      preferredTime: '20:30',
      phase1Quests: [
        `Phân rã yêu cầu và thiết lập môi trường cho: ${prompt}`,
        'Hoàn thiện khung kiến trúc và danh sách đầu việc ưu tiên'
      ],
      phase2Quests: [
        `Phiên Deep Focus triển khai các hạng mục cốt lõi của ${prompt}`,
        'Viết test tự động & rà soát chất lượng code định kỳ'
      ],
      phase3Quests: [
        'Tích hợp toàn trình, tối ưu hiệu năng và sửa lỗi tồn đọng',
        'Đóng gói sản phẩm, viết tài liệu & demo kết quả'
      ],
      phase4Quests: [
        'Mở rộng tính năng nâng cao và kiểm thử biên',
        'Đánh giá tổng thể & chuẩn bị triển khai thực tế'
      ]
    }
  }

  return {
    category: explicitCategory || 'Phát triển bản thân',
    preferredTime: '19:30',
    phase1Quests: [
      `Xác định tiêu chí thành công và chuẩn bị nền tảng cho: ${prompt}`,
      'Tạo checklist hành động nhỏ dễ bắt đầu trong tuần đầu'
    ],
    phase2Quests: [
      `Thực hành tập trung hằng ngày hướng tới ${prompt}`,
      'Tự kiểm tra tiến độ giữa tuần và điều chỉnh nhịp độ'
    ],
    phase3Quests: [
      'Đo lường kết quả thực tế so với mục tiêu ban đầu',
      'Tổng kết thành tựu và khóa thói quen bền vững'
    ],
    phase4Quests: [
      'Nâng chuẩn chất lượng thực thi với phiên thử thách mở rộng',
      'Ghi lại bài học rút ra và hoạch định chặng kế tiếp'
    ]
  }
}

function levelMultiplier(level: PlanLevel): number {
  if (level === 'ADVANCED') return 1.25
  if (level === 'INTERMEDIATE') return 1.1
  return 1.0
}

function buildDeterministicPlan(
  input: PlanGenerateInput,
  fallbackUsed: boolean,
  modelName = 'lifequest-deterministic-v1'
): GeneratedPlan {
  const profile = detectDomainProfile(input.prompt, input.targetCategory)
  const feedbackLower = (input.feedback || '').toLowerCase()
  const lighterRequested = /(nhẹ hơn|ít thời gian|giảm|ngắn hơn|bận)/.test(feedbackLower)
  const harderRequested = /(nâng cao|khó hơn|tăng tốc|chuyên sâu|nhanh hơn)/.test(feedbackLower)
  const morningRequested = /(sáng|buổi sáng|06:|07:)/.test(feedbackLower)
  const eveningRequested = /(tối|buổi tối|20:|21:)/.test(feedbackLower)

  const preferredTime = morningRequested
    ? '07:00'
    : eveningRequested
      ? '20:30'
      : profile.preferredTime

  const durationScale = lighterRequested ? 0.7 : harderRequested ? 1.2 : 1.0
  const effectiveDailyMinutes = Math.max(
    10,
    Math.min(180, Math.round(input.availableMinutesPerDay * durationScale))
  )
  const xpMult = levelMultiplier(input.level) * (harderRequested ? 1.15 : 1)

  const milestoneCount = input.durationDays <= 7 ? 2 : input.durationDays <= 45 ? 3 : 4

  const phaseDefs: Array<{
    title: string
    description: string
    quests: [string, string]
    primaryType: 'SIMPLE' | 'FOCUS' | 'PROGRESS' | 'DURATION'
  }> = [
    {
      title: 'Giai đoạn 1: Khởi động & Xây dựng nền tảng',
      description: 'Thiết lập thói quen ban đầu không quá tải để vào guồng nhanh.',
      quests: profile.phase1Quests,
      primaryType: 'SIMPLE'
    },
    {
      title: 'Giai đoạn 2: Thực hành tập trung & Tăng tốc',
      description: 'Duy trì các phiên tập trung đều đặn theo khung giờ tối ưu.',
      quests: profile.phase2Quests,
      primaryType: 'FOCUS'
    },
    {
      title: 'Giai đoạn 3: Kiểm chứng & Hoàn thiện mục tiêu',
      description: 'Đối chiếu kết quả thực tế và chốt các cột mốc quan trọng.',
      quests: profile.phase3Quests,
      primaryType: 'PROGRESS'
    },
    {
      title: 'Giai đoạn 4: Nâng chuẩn & Bền vững dài hạn',
      description: 'Củng cố nhịp thực thi dài hạn để giữ vững kết quả sau lộ trình.',
      quests: profile.phase4Quests,
      primaryType: 'DURATION'
    }
  ]

  const milestones: GeneratedMilestone[] = phaseDefs.slice(0, milestoneCount).map((phase, idx) => {
    const mainMinutes = Math.max(10, Math.round(effectiveDailyMinutes * (idx === 0 ? 0.75 : 1)))
    const supportMinutes = Math.max(10, Math.round(effectiveDailyMinutes * 0.5))

    return {
      title: phase.title,
      description: phase.description,
      position: idx + 1,
      quests: [
        {
          title: phase.quests[0].slice(0, 120),
          description: `Thực hiện đều đặn khoảng ${mainMinutes} phút/phiên (mức ${input.level}).`,
          priority: idx === 1 ? 1 : 2,
          type: phase.primaryType,
          estimatedDurationSeconds: mainMinutes * 60,
          xpReward: Math.round((50 + idx * 25) * xpMult),
          coinReward: Math.round((20 + idx * 12) * xpMult),
          scheduleSuggestion: {
            scheduleType: 'RECURRING',
            timeOfDay: preferredTime,
            daysOfWeek: idx === 0 ? [1, 2, 3, 4, 5] : [1, 3, 5, 6]
          }
        },
        {
          title: phase.quests[1].slice(0, 120),
          description: `Phiên bổ trợ ngắn (${supportMinutes} phút) giúp giữ chuỗi và tránh bỏ dở.`,
          priority: 2,
          type: 'SIMPLE',
          estimatedDurationSeconds: supportMinutes * 60,
          xpReward: Math.round((35 + idx * 15) * xpMult),
          coinReward: Math.round((15 + idx * 8) * xpMult),
          scheduleSuggestion: {
            scheduleType: 'RECURRING',
            timeOfDay: preferredTime,
            daysOfWeek: [0, 3, 6]
          }
        }
      ]
    }
  })

  return {
    title: `Lộ trình ${input.durationDays} ngày: ${input.prompt}`,
    category: profile.category,
    timeframeDays: input.durationDays,
    dailyAvailableMinutes: effectiveDailyMinutes,
    level: input.level,
    feedbackNote: input.feedback
      ? `Đã điều chỉnh theo góp ý: ${input.feedback}`
      : undefined,
    goal: {
      title: `Chinh phục: ${input.prompt}`.slice(0, 100),
      description: `Lộ trình tối ưu trong ${input.durationDays} ngày (${effectiveDailyMinutes} phút/ngày, trình độ ${input.level}).`,
      durationDays: input.durationDays
    },
    milestones,
    generationMeta: {
      provider: 'deterministic-fallback',
      model: modelName,
      fallbackUsed
    }
  }
}

const GEMINI_PLAN_SCHEMA: Record<string, unknown> = {
  type: 'OBJECT',
  required: ['title', 'category', 'goal', 'milestones'],
  properties: {
    title: { type: 'STRING' },
    category: { type: 'STRING' },
    goal: {
      type: 'OBJECT',
      required: ['title', 'description', 'durationDays'],
      properties: {
        title: { type: 'STRING' },
        description: { type: 'STRING' },
        durationDays: { type: 'INTEGER' }
      }
    },
    milestones: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['title', 'description', 'position', 'quests'],
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          position: { type: 'INTEGER' },
          quests: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: [
                'title',
                'description',
                'priority',
                'type',
                'estimatedDurationSeconds',
                'xpReward',
                'coinReward'
              ],
              properties: {
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                priority: { type: 'INTEGER' },
                type: {
                  type: 'STRING',
                  enum: ['SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS']
                },
                estimatedDurationSeconds: { type: 'INTEGER' },
                xpReward: { type: 'INTEGER' },
                coinReward: { type: 'INTEGER' },
                scheduleSuggestion: {
                  type: 'OBJECT',
                  properties: {
                    scheduleType: { type: 'STRING', enum: ['ONE_TIME', 'RECURRING'] },
                    timeOfDay: { type: 'STRING' },
                    daysOfWeek: { type: 'ARRAY', items: { type: 'INTEGER' } }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export async function generateAiPlan(
  input: PlanGenerateInput,
  options: {
    allowLlm?: boolean
    env?: AiPipelineEnv
    fetchImpl?: typeof fetch
  } = {}
): Promise<GeneratedPlan> {
  const env = options.env ?? loadEnv()
  const allowLlm = options.allowLlm ?? true

  if (!allowLlm) {
    return buildDeterministicPlan(input, false, 'lifequest-preview-deterministic-v1')
  }

  if (!env.aiApiKey) {
    return buildDeterministicPlan(input, true)
  }

  const systemInstruction =
    'Bạn là kiến trúc sư lập kế hoạch mục tiêu của ứng dụng LifeQuest. ' +
    'Luôn trả về JSON hợp lệ tiếng Việt theo đúng schema: 1 Goal, 2-4 Milestones tăng dần theo position (1..n), ' +
    'mỗi Milestone có 2-3 Quests cụ thể, thực tế theo số phút/ngày và trình độ người dùng.'

  const userPrompt = [
    `Mục tiêu: ${input.prompt}`,
    `Thời hạn: ${input.durationDays} ngày`,
    `Thời gian mỗi ngày: ${input.availableMinutesPerDay} phút`,
    `Trình độ: ${input.level}`,
    input.targetCategory ? `Danh mục ưu tiên: ${input.targetCategory}` : null,
    input.feedback ? `Yêu cầu điều chỉnh từ người dùng: ${input.feedback}` : null
  ]
    .filter(Boolean)
    .join('\n')

  const llmRes = await callGeminiStructured<unknown>({
    prompt: userPrompt,
    systemInstruction,
    responseSchema: GEMINI_PLAN_SCHEMA,
    env,
    fetchImpl: options.fetchImpl
  })

  if (!llmRes.ok) {
    return buildDeterministicPlan(input, true)
  }

  const validated = GeneratedPlanBodySchema.safeParse(llmRes.data)
  if (!validated.success) {
    return buildDeterministicPlan(input, true)
  }

  return {
    title: validated.data.title,
    category: validated.data.category,
    timeframeDays: input.durationDays,
    dailyAvailableMinutes: input.availableMinutesPerDay,
    level: input.level,
    feedbackNote: input.feedback
      ? `Đã điều chỉnh theo góp ý: ${input.feedback}`
      : undefined,
    goal: validated.data.goal,
    milestones: validated.data.milestones,
    generationMeta: {
      provider: 'gemini',
      model: llmRes.model,
      fallbackUsed: false,
      tokenUsage: llmRes.tokenUsage
    }
  }
}
