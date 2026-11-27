import React from 'react'
import { Settings, Flame, Star, Flag, Shirt, ChevronRight } from 'lucide-react'

interface ProfileScreenProps {
  onOpenSettings: () => void
  onOpenWardrobe: () => void
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenSettings,
  onOpenWardrobe
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '12px 16px 80px',
      gap: 14
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Hồ sơ
        </div>

        <button
          onClick={onOpenSettings}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid var(--lq-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--lq-ink)'
          }}
          title="Mở cài đặt"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* User Hero Card */}
      <div style={{
        background: 'linear-gradient(160deg, #FFE9D6, #FFF6EC)',
        borderRadius: 22,
        padding: '20px 16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 8
      }}>
        <img
          src="/assets/fox/fox-mood-xp-anim.webp"
          alt="Fox XP"
          style={{ width: 130, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-xp.png'
          }}
        />

        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Minh Anh
        </div>

        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lq-ink-muted)' }}>
          @fox_explorer
        </span>

        <div style={{ display: 'flex', gap: 6, margin: '4px 0' }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-reward-soft)',
            color: 'var(--lq-reward-ink)'
          }}>
            Cấp 7
          </span>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)'
          }}>
            12 ngày
          </span>
        </div>

        <button style={{
          width: '100%',
          height: 42,
          borderRadius: 14,
          background: '#FFFFFF',
          color: 'var(--lq-accent)',
          border: '1px solid var(--lq-border)',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          marginTop: 4
        }}>
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <span style={{ fontSize: 11, color: 'var(--lq-ink-muted)', fontWeight: 600 }}>
            Task hoàn thành
          </span>
          <b style={{ fontSize: 20, color: 'var(--lq-ink)' }}>148</b>
        </div>

        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <span style={{ fontSize: 11, color: 'var(--lq-ink-muted)', fontWeight: 600 }}>
            Tổng XP
          </span>
          <b style={{ fontSize: 20, color: 'var(--lq-ink)' }}>3.840</b>
        </div>
      </div>

      {/* Achievement Medals Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Thành tích
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          {/* Flame */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#F26B3A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(242, 107, 58, 0.3)'
          }}>
            <Flame size={26} />
          </div>

          {/* Star */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#F6C85F',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(246, 200, 95, 0.3)'
          }}>
            <Star size={26} />
          </div>

          {/* Flag */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#168C78',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(22, 140, 120, 0.3)'
          }}>
            <Flag size={26} />
          </div>

          {/* Shirt */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#4B2E83',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(75, 46, 131, 0.3)'
          }}>
            <Shirt size={26} />
          </div>
        </div>
      </div>

      {/* Wardrobe Quick Link Card */}
      <div
        onClick={onOpenWardrobe}
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 16px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div>
          <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>Tủ đồ của Fox</b>
          <div style={{ fontSize: 12, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
            18 vật phẩm · 6 bộ trang phục
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--lq-accent)' }}>
          <Shirt size={22} />
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  )
}
export default ProfileScreen
