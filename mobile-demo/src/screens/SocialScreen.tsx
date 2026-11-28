import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { Heart, Award, MessageCircle, Send, Sparkles } from 'lucide-react'

export const SocialScreen: React.FC = () => {
  const { socialPosts, likeSocialPost, cheerSocialPost, player } = useStore()
  const [postText, setPostText] = useState('')

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postText.trim()) return
    setPostText('')
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Bảng Tin Hiệp Sĩ (Social Feed)
        </h2>
        <p style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
          Theo dõi bước tiến của bạn bè & cùng nhau tiến bộ
        </p>
      </div>

      {/* Quick Share Box */}
      <form onSubmit={handlePost} className="card" style={{ padding: '12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--lq-primary)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0
        }}>
          {player.avatar}
        </div>

        <input
          type="text"
          placeholder="Chia sẻ chiến tích hôm nay của bạn..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--lq-border)',
            background: 'var(--lq-bg-elevated)',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--lq-ink)'
          }}
        />

        <button
          type="submit"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--lq-accent)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Send size={15} />
        </button>
      </form>

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {socialPosts.map((post) => (
          <div key={post.id} className="card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--lq-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}>
                {post.userAvatar}
              </div>

              <div>
                <div style={{ fontSize: 13, color: 'var(--lq-ink)' }}>
                  <strong>{post.userName}</strong>{' '}
                  <span style={{ color: 'var(--lq-ink-muted)' }}>{post.actionText}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--lq-ink-muted)' }}>
                  {post.timeAgo}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--lq-accent)',
              background: 'var(--lq-accent-soft)',
              padding: '8px 12px',
              borderRadius: 10,
              marginBottom: 10
            }}>
              {post.targetTitle}
            </div>

            {/* Interaction Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--lq-border)', paddingTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => likeSocialPost(post.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 10,
                    background: post.isLiked ? 'var(--lq-accent-soft)' : 'var(--lq-surface-subtle)',
                    color: post.isLiked ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  <Heart size={13} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likes} Thích</span>
                </button>

                <button
                  onClick={() => cheerSocialPost(post.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 10,
                    background: post.isCheered ? 'var(--lq-reward-soft)' : 'var(--lq-surface-subtle)',
                    color: post.isCheered ? 'var(--lq-reward-ink)' : 'var(--lq-ink-muted)',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  <Award size={13} />
                  <span>{post.cheers} Cổ vũ 🎉</span>
                </button>
              </div>

              <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                Công khai
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
