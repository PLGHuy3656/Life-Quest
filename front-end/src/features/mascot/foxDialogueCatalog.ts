export type FoxDialogueTrigger =
  | 'APP_GREETING'
  | 'TASK_CREATED'
  | 'BACKEND_ERROR'
  | 'EMPTY_TASKS'

export interface FoxDialogueEntry {
  id: string
  trigger: FoxDialogueTrigger
  text: string
  durationMs: number
}

export function getGreetingDialogue(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Chào buổi sáng! Cùng Fox bắt đầu một bước nhỏ nhé.'
  if (hour < 18) return 'Chào buổi chiều! Giữ nhịp thật nhẹ nhàng cùng Fox nha.'
  return 'Chào buổi tối! Khép lại hôm nay thật trọn vẹn nhé.'
}

export function getDialogueForTrigger(
  trigger: FoxDialogueTrigger,
  options?: { hour?: number; taskTitle?: string }
): FoxDialogueEntry {
  const stamp = `${trigger}-${Date.now()}`
  switch (trigger) {
    case 'APP_GREETING':
      return {
        id: stamp,
        trigger,
        text: getGreetingDialogue(options?.hour),
        durationMs: 7500
      }
    case 'TASK_CREATED': {
      const snippet = options?.taskTitle?.trim()
      const text =
        snippet && snippet.length <= 28
          ? `Fox đã ghi "${snippet}" rồi! Cố lên nhé.`
          : 'Fox đã ghi lại nhiệm vụ mới rồi! Cố lên nhé.'
      return {
        id: stamp,
        trigger,
        text,
        durationMs: 6500
      }
    }
    case 'BACKEND_ERROR':
      return {
        id: stamp,
        trigger,
        text: 'Kết nối máy chủ hơi trục trặc — thử lại một chút nhé.',
        durationMs: 7000
      }
    case 'EMPTY_TASKS':
      return {
        id: stamp,
        trigger,
        text: 'Chưa có nhiệm vụ nào — gõ bên dưới để Fox ghi giúp nhé!',
        durationMs: 7000
      }
  }
}
