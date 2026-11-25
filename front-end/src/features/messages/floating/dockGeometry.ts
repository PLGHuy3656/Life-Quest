const EDGE_MARGIN = 16
const DESKTOP_HEADER_SAFE_TOP = 80
const MOBILE_HEADER_SAFE_TOP = 64
const MOBILE_NAV_SAFE_BOTTOM = 84
const DESKTOP_SAFE_BOTTOM = 20
export const DOCK_WIDTH_ESTIMATE = 48
export const DRAG_THRESHOLD_PX = 6

export function computeSafeDockBounds(viewportW: number, viewportH: number, dockHeight: number) {
  const isNarrow = viewportW < 1024
  const minX = EDGE_MARGIN
  const maxX = Math.max(minX, viewportW - DOCK_WIDTH_ESTIMATE - EDGE_MARGIN)
  const minY = isNarrow ? MOBILE_HEADER_SAFE_TOP : DESKTOP_HEADER_SAFE_TOP
  const bottomInset = isNarrow ? MOBILE_NAV_SAFE_BOTTOM : DESKTOP_SAFE_BOTTOM
  const maxY = Math.max(minY, viewportH - dockHeight - bottomInset)
  return { minX, maxX, minY, maxY }
}
