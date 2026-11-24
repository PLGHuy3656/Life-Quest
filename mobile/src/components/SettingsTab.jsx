import React, { useState } from 'react'
import { IconSettings, IconRefresh, IconUser, IconSparkles } from './Icons'
import { getApiConfig, saveApiConfig, pingBackend } from '../services/api'

export const SettingsTab = ({ onConfigChange, onRefreshData }) => {
  const currentConfig = getApiConfig()
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseUrl)
  const [userId, setUserId] = useState(currentConfig.userId)
  const [useMockOnly, setUseMockOnly] = useState(currentConfig.useMockOnly || false)
  const [isPinging, setIsPinging] = useState(false)
  const [pingStatus, setPingStatus] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    const updated = {
      ...currentConfig,
      baseUrl: baseUrl.trim(),
      userId: userId.trim(),
      useMockOnly
    }
    saveApiConfig(updated)
    onConfigChange(updated)
    setSaveMessage('Đã lưu cấu hình thành công!')
    setTimeout(() => setSaveMessage(''), 3000)
    onRefreshData()
  }

  const handleTestConnection = async () => {
    setIsPinging(true)
    setPingStatus(null)
    const ok = await pingBackend()
    setIsPinging(false)
    setPingStatus(ok ? 'connected' : 'failed')
  }

  const handleGenerateUserId = () => {
    // Generate valid UUID v4
    const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    setUserId(newUuid)
  }

  const handleResetMockData = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại dữ liệu mẫu về mặc định?')) {
      localStorage.removeItem('lifequest_mock_goals')
      localStorage.removeItem('lifequest_user_stats')
      window.location.reload()
    }
  }

  return (
    <div className="tab-pane settings-tab">
      <div className="character-section">
        <h3 className="section-title">
          <IconSettings className="w-4 h-4 text-indigo-400" />
          <span>Cấu Hình Kết Nối Backend API</span>
        </h3>

        {saveMessage && (
          <div className="modal-alert-success">
            <span>✅ {saveMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label className="form-label">Backend API URL</label>
            <input
              type="text"
              className="form-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000/api/v1"
            />
            <span className="form-hint">Mặc định: http://localhost:3000/api/v1</span>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label mb-0">Current User ID (UUID)</label>
              <button
                type="button"
                className="text-xs text-indigo-400 hover:underline"
                onClick={handleGenerateUserId}
              >
                Tạo UUID mới
              </button>
            </div>
            <input
              type="text"
              className="form-input font-mono text-xs"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập User UUID..."
              required
            />
          </div>

          {/* Mode Switcher */}
          <div className="settings-toggle-row">
            <div>
              <div className="toggle-title">Chế độ Demo / Offline độc lập</div>
              <div className="toggle-sub">Chỉ dùng dữ liệu trình duyệt, không gọi backend</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={useMockOnly}
                onChange={(e) => setUseMockOnly(e.target.checked)}
              />
              <span className="slider round" />
            </label>
          </div>

          {/* Test Connection Button */}
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="action-btn btn-secondary flex-1"
              onClick={handleTestConnection}
              disabled={isPinging}
            >
              <IconRefresh className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Đang kiểm tra...' : 'Kiểm tra Backend'}</span>
            </button>

            {pingStatus === 'connected' && (
              <span className="badge-ach-unlocked">🟢 Kết nối tốt</span>
            )}
            {pingStatus === 'failed' && (
              <span className="badge-ach-locked">🔴 Không phản hồi</span>
            )}
          </div>

          <button type="submit" className="btn-modal-submit w-full mt-3">
            Lưu Cấu Hình
          </button>
        </form>
      </div>

      {/* Backend Specs */}
      <div className="character-section">
        <h3 className="section-title">
          <IconSparkles className="w-4 h-4 text-cyan-400" />
          <span>Thông Tin Hệ Thống Life-Quest</span>
        </h3>

        <div className="specs-card">
          <div className="specs-row">
            <span className="specs-label">Backend Architecture</span>
            <span className="specs-val">Express 5 + Layered (Route - Controller - Service - Repo)</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Database ORM</span>
            <span className="specs-val">Prisma 7 (PostgreSQL Adapter)</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Validation</span>
            <span className="specs-val">Joi Schema Validation</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Frontend Stack</span>
            <span className="specs-val">React 18 + Vite Mobile UI</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-modal-cancel w-full mt-4 text-rose-400 border-rose-500/30"
          onClick={handleResetMockData}
        >
          Đặt lại Dữ liệu Mẫu (Reset Demo Data)
        </button>
      </div>
    </div>
  )
}
