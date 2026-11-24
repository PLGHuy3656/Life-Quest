import type { DialogueCollectionFile } from './types'

/**
 * FE-W01 Wardrobe & Cosmetic Preview contextual dialogues.
 * Strictly neutral preview/fitting lines — never claims a purchase succeeded
 * or that equipment was persisted to Backend while Shop/Inventory APIs are pending.
 */
export const WARDROBE_DIALOGUE_COLLECTION: DialogueCollectionFile = {
  category: 'dashboard',
  version: 'fe-w01-1.0',
  entries: [
    {
      id: 'wardrobe_open_01',
      event: 'WARDROBE_OPENED',
      text: 'Chào mừng đến phòng thử đồ! Hôm nay mình phối bộ nào nhỉ?',
      emotion: 'happy',
      weight: 2
    },
    {
      id: 'wardrobe_open_02',
      event: 'WARDROBE_OPENED',
      text: 'Khoan, cho mình xoay một vòng xem nào!',
      emotion: 'playful',
      weight: 2
    },
    {
      id: 'wardrobe_open_03',
      event: 'WARDROBE_OPENED',
      text: 'Đuôi mình vẫn phải được tự do đấy nhé!',
      emotion: 'playful',
      weight: 1
    },
    {
      id: 'wardrobe_preview_01',
      event: 'COSMETIC_PREVIEWED',
      text: 'Chiếc mũ này trông cũng ngầu đấy chứ!',
      emotion: 'happy',
      weight: 2
    },
    {
      id: 'wardrobe_preview_02',
      event: 'COSMETIC_PREVIEWED',
      text: 'Khoan, cho mình xoay một vòng xem thử góc nghiêng nào!',
      emotion: 'playful',
      weight: 2
    },
    {
      id: 'wardrobe_preview_03',
      event: 'COSMETIC_PREVIEWED',
      text: 'Thử món {task} này lên nhìn hợp phong cách lắm luôn!',
      emotion: 'encouraging',
      weight: 2
    },
    {
      id: 'wardrobe_preview_04',
      event: 'COSMETIC_PREVIEWED',
      text: 'Đuôi mình vẫn vẫy thoải mái — phối thêm món khác xem sao nhé!',
      emotion: 'playful',
      weight: 1
    },
    {
      id: 'wardrobe_remove_01',
      event: 'COSMETIC_REMOVED',
      text: 'Tháo {task} ra rồi, gọn gàng nhẹ nhàng hẳn!',
      emotion: 'calm',
      weight: 2
    },
    {
      id: 'wardrobe_remove_02',
      event: 'COSMETIC_REMOVED',
      text: 'Để trống vị trí này cũng thoáng lắm, thử món khác nha!',
      emotion: 'neutral',
      weight: 2
    },
    {
      id: 'wardrobe_reset_01',
      event: 'OUTFIT_RESET',
      text: 'Quay về bộ khăn đỏ và balo quen thuộc rồi nè!',
      emotion: 'calm',
      weight: 2
    },
    {
      id: 'wardrobe_reset_02',
      event: 'OUTFIT_RESET',
      text: 'Trở lại dáng vẻ nguyên bản — sẵn sàng thử bộ phối mới!',
      emotion: 'happy',
      weight: 2
    }
  ]
}
