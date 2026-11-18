import { FoxAssetError, type FoxPresentation } from '../mascot';

// Shown when WebGL is unavailable or the GLB cannot be loaded. A static poster of the same Fox
// (rendered from the E2 GLB) keeps the layout and the character presence intact.

const POSTER = `${import.meta.env.BASE_URL}fox_poster.png`;

export function FoxFallback({ reason, presentation, error, onRetry }: { reason: 'webgl' | 'load'; presentation: FoxPresentation; error?: unknown; onRetry?(): void }) {
  const compact = presentation === 'mini';
  const msg = reason === 'webgl'
    ? 'Trình duyệt không hỗ trợ 3D (WebGL), đang hiện ảnh tĩnh.'
    : error instanceof FoxAssetError && error.kind === 'contract' ? 'Mô hình cáo không khớp hợp đồng runtime.' : 'Không tải được mô hình cáo.';
  return (
    <div className={`fox-fallback ${compact ? 'compact' : ''}`} data-reason={reason} role="img" aria-label={`Cáo LifeQuest. ${msg}`}>
      <img src={POSTER} alt="" draggable={false} />
      {!compact && <p>{msg}</p>}
      {onRetry && <button className="btn small" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}
