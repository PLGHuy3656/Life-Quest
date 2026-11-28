import React, { useState } from 'react'
import { ArrowLeft, LogOut, Check } from 'lucide-react'

interface SettingsScreenProps {
  onBack: () => void
  onLogout: () => void
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'profile' | 'notify'>('custom')
  const [toggles, setToggles] = useState({
    sound: true,
    animation: true,
    foxCheer: true,
    foxLookCursor: false,
    reduceMotion: false
  })
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
        gap: 10
      }}>
        <button
          onClick={onBack}
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
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Cài đặt
        </div>
      </div>

      {/* Tabs: Cài đặt riêng | Hồ sơ | Thông báo */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'custom' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'custom' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'custom' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Cài đặt riêng
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'profile' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'profile' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'profile' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Hồ sơ
        </button>

        <button
          onClick={() => setActiveTab('notify')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: activeTab === 'notify' ? 'var(--lq-accent-soft)' : '#FFFFFF',
            border: activeTab === 'notify' ? '1px solid rgba(242, 107, 58, 0.3)' : '1px solid var(--lq-border)',
            fontWeight: 700,
            fontSize: 13,
            color: activeTab === 'notify' ? 'var(--lq-accent)' : 'var(--lq-ink-secondary)',
            cursor: 'pointer'
          }}
        >
          Thông báo
        </button>
      </div>

      {/* Experience Settings Card with Toggles */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)', marginBottom: 6 }}>
          Trải nghiệm
        </div>

        {[
          { key: 'sound' as const, label: 'Hiệu ứng âm thanh' },
          { key: 'animation' as const, label: 'Hiệu ứng hoạt ảnh' },
          { key: 'foxCheer' as const, label: 'Thông báo khích lệ từ Fox' },
          { key: 'foxLookCursor' as const, label: 'Fox nhìn theo con trỏ' },
          { key: 'reduceMotion' as const, label: 'Giảm chuyển động' }
        ].map((item) => {
          const isOn = toggles[item.key]
          return (
            <div
              key={item.key}
              onClick={() => toggle(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 0',
                cursor: 'pointer'
              }}
            >
              <b style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lq-ink)' }}>
                {item.label}
              </b>

              {/* iOS Style Toggle Switch */}
              <div style={{
                width: 48,
                height: 28,
                borderRadius: 99,
                background: isOn ? 'var(--lq-accent)' : '#CCD3D9',
                position: 'relative',
                transition: 'background 0.2s ease'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: isOn ? 23 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Language & Locale Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Giao diện & Ngôn ngữ
        </div>

        <div style={{
          height: 48,
          borderRadius: 16,
          background: '#FFFFFF',
          border: '2px solid #E8DCCB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--lq-ink)'
        }}>
          Tiếng Việt (Mặc định)
        </div>

        <div style={{
          height: 48,
          borderRadius: 16,
          background: '#FFFFFF',
          border: '2px solid #E8DCCB',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--lq-ink)'
        }}>
          Múi giờ: Asia/Ho_Chi_Minh (GMT+7)
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button
          onClick={handleSave}
          style={{
            height: 52,
            borderRadius: 16,
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 15,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 #C4491F',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          {saved ? <Check size={18} /> : null}
          <span>{saved ? 'Đã lưu cài đặt!' : 'Lưu cài đặt'}</span>
        </button>

        <button
          onClick={onLogout}
          style={{
            height: 48,
            borderRadius: 16,
            background: '#FFFFFF',
            color: 'var(--lq-danger)',
            fontWeight: 700,
            fontSize: 14,
            border: '1px solid var(--lq-border)',
            boxShadow: '0 3px 0 var(--lq-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
export default SettingsScreen
