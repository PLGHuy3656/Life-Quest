import hydrationHabitUrl from './hydration-habit.svg'
import milestoneMomentUrl from './milestone-moment.svg'
import morningRunUrl from './morning-run.svg'
import studyCornerUrl from './study-corner.svg'

export type SocialIllustrationKey =
  | 'study-corner'
  | 'milestone-moment'
  | 'morning-run'
  | 'hydration-habit'

export const SOCIAL_MOCK_ASSETS: Record<
  SocialIllustrationKey,
  { src: string; defaultAlt: string }
> = {
  'study-corner': {
    src: studyCornerUrl,
    defaultAlt: 'Minh họa góc học tập tập trung với sổ tay và bộ đếm 25 phút'
  },
  'milestone-moment': {
    src: milestoneMomentUrl,
    defaultAlt: 'Minh họa hành trình hoàn thành cột mốc trên đỉnh đồi'
  },
  'morning-run': {
    src: morningRunUrl,
    defaultAlt: 'Minh họa cung đường chạy bộ công viên buổi sáng'
  },
  'hydration-habit': {
    src: hydrationHabitUrl,
    defaultAlt: 'Minh họa thói quen uống đủ nước mỗi ngày với lá bạc hà'
  }
}
