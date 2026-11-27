import React, { useState } from 'react'
import { ArrowLeft, Flame, Send } from 'lucide-react'

interface ChatScreenProps {
  contactName?: string
  onBack: () => void
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  contactName = 'Hà My',
  onBack
}) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'them', text: 'Mai học nhóm lúc 8h nhé!' },
    { id: 2, sender: 'me', text: 'Ok, mình mang đề ôn Chương 3' },
    { id: 3, sender: 'them', text: 'Rủ thêm Huy vào Quest chung luôn' }
  ])
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim()) return
    const newMsg = { id: Date.now(), sender: 'me', text: inputText.trim() }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')

    // Auto reply from friend after 1 sec
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'them',
          text: 'Nhất trí! Hẹn gặp bạn ở thư viện nhé 🦊✨'
        }
      ])
    }, 1000)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '12px 16px 20px',
      gap: 12
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            MA
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ fontSize: 14, color: 'var(--lq-ink)' }}>{contactName}</b>
            <span style={{ fontSize: 11, color: 'var(--lq-success)', fontWeight: 600 }}>
              đang hoạt động
            </span>
          </div>
        </div>

        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--lq-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--lq-accent)'
        }}>
          <Flame size={18} />
        </div>
      </div>

      {/* Shared Streak Banner with Celebrate Fox */}
      <div style={{
        background: 'var(--lq-accent-soft)',
        borderRadius: 18,
        padding: '10px 14px',
        border: '1px solid rgba(242, 107, 58, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <img
          src="/assets/fox/fox-mood-celebrate-anim.webp"
          alt="Fox Celebrate"
          style={{ width: 42, height: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/assets/fox/fox-mood-celebrate.png'
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--lq-ink)' }}>
          Chuỗi chung 7 ngày — giữ lửa nhé!
        </span>
      </div>

      {/* Chat Messages Stream */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        margin: '10px 0 auto',
        overflowY: 'auto'
      }}>
        {messages.map((msg) => {
          const isMe = msg.sender === 'me'
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: 18,
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: 1.4,
                background: isMe ? 'var(--lq-accent)' : '#FFFFFF',
                color: isMe ? '#FFFFFF' : 'var(--lq-ink)',
                border: isMe ? 'none' : '1px solid var(--lq-border)',
                borderBottomRightRadius: isMe ? 4 : 18,
                borderBottomLeftRadius: isMe ? 18 : 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              {msg.text}
            </div>
          )
        })}
      </div>

      {/* Bottom Message Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Nhập tin nhắn…"
          style={{
            flex: 1,
            height: 48,
            borderRadius: 16,
            background: '#FFFFFF',
            border: '2px solid #E8DCCB',
            padding: '0 16px',
            fontSize: 14,
            fontWeight: 600,
            outline: 'none',
            color: 'var(--lq-ink)'
          }}
        />

        <button
          onClick={handleSend}
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(242, 107, 58, 0.35)'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
export default ChatScreen
