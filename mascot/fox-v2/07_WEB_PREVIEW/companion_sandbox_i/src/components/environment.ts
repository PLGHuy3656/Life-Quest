import { useEffect, useState, type RefObject } from 'react';

/** WebGL availability, checked once per page (the probe context is released immediately). */
let webglCache: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    if (new URLSearchParams(location.search).get('nowebgl') === '1') return (webglCache = false);   // test switch
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    webglCache = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { webglCache = false; }
  return webglCache;
}

export function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [v, setV] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q), fn = () => setV(m.matches);
    m.addEventListener('change', fn); return () => m.removeEventListener('change', fn);
  }, []);
  return v;
}

export function useDocumentVisible() {
  const [v, setV] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const fn = () => setV(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', fn); return () => document.removeEventListener('visibilitychange', fn);
  }, []);
  return v;
}

/** True while at least a sliver of the element is inside the viewport (100 px pre-roll). */
export function useInView(ref: RefObject<Element>) {
  const [v, setV] = useState(true);
  useEffect(() => {
    const el = ref.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el); return () => io.disconnect();
  }, [ref]);
  return v;
}
