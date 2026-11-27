import React from 'react'
import { useStore } from '../store/questStore'
import { TabId } from '../types'
import {
  Flame,
  Zap,
  CheckCircle2,
  Play,
  Plus,
  ChevronRight,
  Sparkles,
  Heart,
  Award,
  Clock
} from 'lucide-react'
import { MascotVisual } from '../components/common/MascotVisual'

interface DashboardScreenProps {
  onNavigateTab: (tab: TabId) => void
  onOpenCreate: () => void
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateTab,
  onOpenCreate
}) => {
  const {
    player,
    fox,
    tasks,
    schedules,
    socialPosts,
    toggleTask,
    petFox,
    likeSocialPost,
    cheerSocialPost
  } = useStore()

  const pinnedTasks = tasks.filter((t) => t.isPinned)
  const completedToday = tasks.filter((t) => t.completed).length
  const totalToday = tasks.length
  const percentToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' }}>
      {/* Hero Overview Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
        color: '#FFFFFF',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242, 107, 58, 0.4) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-accent)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Mục Tiêu Hôm Nay
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
              {completedToday === totalToday && totalToday > 0
                ? 'Đã hoàn thành tất cả!'
                : `Đạt ${completedToday}/${totalToday} việc cần làm`}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '5px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Zap size={13} color="#F6C85F" fill="#F6C85F" />
            <span>{percentToday}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 7, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            width: `${percentToday}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #F26B3A 0%, #F6C85F 100%)',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} color="#F6C85F" />
          <span>Giữ chuỗi {player.streak} ngày để nhận thêm 50 Vàng thưởng!</span>
        </div>
      </div>

      {/* Mascot Companion Hero Card with Real 3D Mascot */}
      <div className="card" style={{
        background: 'var(--lq-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 16px'
      }}>
        {/* Fox Speech */}
        <div style={{
          background: 'var(--lq-bg-elevated)',
          border: '1px solid var(--lq-border)',
          borderRadius: '14px 14px 14px 4px',
          padding: '10px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--lq-ink)',
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8
        }}>
          <Sparkles size={15} color="var(--lq-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{fox.speechBubble}</span>
        </div>

        {/* Mascot & Petting Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="animate-mascot" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MascotVisual
                size={48}
                equippedHat={fox.equippedHat}
                equippedAccessory={fox.equippedAccessory}
                onClick={petFox}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)' }}>
                Bé Cáo {fox.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                Thân thiết: {fox.affection}/100 &bull; {fox.mood === 'cheering' ? '🎉 Phấn khởi' : '✨ Vui vẻ'}
              </div>
            </div>
          </div>

          <button
            onClick={petFox}
            style={{
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              borderRadius: 12,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Heart size={14} fill="currentColor" />
            <span>Vuốt ve</span>
          </button>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => onNavigateTab('focus')}
          style={{
            background: 'linear-gradient(135deg, #16324A 0%, #204566 100%)',
            color: '#FFFFFF',
            padding: '12px 14px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Play size={16} fill="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Tập Trung</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Pomodoro 25p</div>
          </div>
        </button>

        <button
          onClick={onOpenCreate}
          style={{
            background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
            color: '#FFFFFF',
            padding: '12px 14px',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Plus size={18} strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Thêm Mục Tiêu</div>
            <div style={{ fontSize: 10, opacity: 0.9 }}>Nhận ngay XP</div>
          </div>
        </button>
      </div>

      {/* Pinned Tasks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Nhiệm Vụ Ưu Tiên
          </h3>
          <button
            onClick={() => onNavigateTab('work')}
            style={{
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>Tất cả ({tasks.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pinnedTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                opacity: task.completed ? 0.6 : 1,
                background: task.completed ? 'var(--lq-bg-elevated)' : 'var(--lq-surface)'
              }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: task.completed ? 'none' : '2px solid var(--lq-border-strong)',
                  background: task.completed
                    ? 'linear-gradient(135deg, #168C78 0%, #116B5C 100%)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {task.completed && <CheckCircle2 size={18} color="#FFFFFF" />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--lq-ink)',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {task.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span>+{task.xpReward} XP</span>
                  <span>&bull;</span>
                  <span>+{task.coinReward} Vàng</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today Schedule Timeline */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Lịch Trình Hôm Nay
          </h3>
          <button
            onClick={() => onNavigateTab('calendar')}
            style={{
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>Lịch chi tiết</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schedules.slice(0, 3).map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--lq-accent)',
                  minWidth: 44,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}>
                  <Clock size={11} />
                  <span>{item.time}</span>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: item.completed ? 'var(--lq-ink-muted)' : 'var(--lq-ink)',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  flex: 1
                }}>
                  {item.title}
                </div>
                <span style={{ fontSize: 10, color: item.completed ? 'var(--lq-success)' : 'var(--lq-ink-muted)' }}>
                  {item.completed ? '✓ Xong' : 'Chờ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Feed Preview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--lq-ink)' }}>
            Cộng Đồng Hiệp Sĩ (Social)
          </h3>
          <button
            onClick={() => onNavigateTab('social')}
            style={{
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--lq-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <span>Bảng tin</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {socialPosts.slice(0, 2).map((post) => (
            <div key={post.id} className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{post.userAvatar}</span>
                <div style={{ fontSize: 12, color: 'var(--lq-ink)' }}>
                  <strong>{post.userName}</strong> {post.actionText}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lq-accent)', marginBottom: 8 }}>
                {post.targetTitle}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                <span>{post.timeAgo}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => likeSocialPost(post.id)}
                    style={{
                      background: post.isLiked ? 'var(--lq-accent-soft)' : 'transparent',
                      color: post.isLiked ? 'var(--lq-accent)' : 'inherit',
                      padding: '3px 8px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Heart size={12} fill={post.isLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes}</span>
                  </button>

                  <button
                    onClick={() => cheerSocialPost(post.id)}
                    style={{
                      background: post.isCheered ? 'var(--lq-reward-soft)' : 'transparent',
                      color: post.isCheered ? 'var(--lq-reward-ink)' : 'inherit',
                      padding: '3px 8px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Award size={12} />
                    <span>{post.cheers} Cổ vũ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
