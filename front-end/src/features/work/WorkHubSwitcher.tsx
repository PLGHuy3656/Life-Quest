import { NavLink } from 'react-router-dom'
import { CheckSquare, Compass, PawPrint } from 'lucide-react'
import styles from './WorkPage.module.css'

const WORK_SUB_NAV = [
  { to: '/work/tasks', label: 'Task', sub: 'Nhiệm vụ', icon: CheckSquare },
  { to: '/work/habits', label: 'Habit', sub: 'Thói quen', icon: PawPrint },
  { to: '/work/quests', label: 'Quest', sub: 'Hành trình', icon: Compass }
] as const

export function WorkHubSwitcher() {
  return (
    <nav className={styles.hubSwitcher} aria-label="Phân khu Công việc" data-testid="work-hub-switcher">
      {WORK_SUB_NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.hubTab} ${isActive ? styles.hubTabActive : ''}`.trim()
            }
          >
            <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>{item.label}</span>
            <span className={styles.hubTabSub}>· {item.sub}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
