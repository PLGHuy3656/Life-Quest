import { useEffect, useState } from 'react';
import { CompanionProvider } from './components/CompanionContext';
import { CompanionPage } from './pages/CompanionPage';
import { DashboardPage } from './pages/DashboardPage';
import { LabPage } from './pages/LabPage';
import { G1LabPage } from './pages/G1LabPage';
import { G2LabPage } from './pages/G2LabPage';
import { G3LabPage } from './pages/G3LabPage';
import { H1LabPage } from './pages/H1LabPage';
import { VoiceLabPage } from './pages/VoiceLabPage';

// Hash routes: #/dashboard (Mini + Widget) · #/companion (Full view) · #/lab (runtime tests) · #/g1 · #/g2 · #/g3 · #/h1 · #/voice (Gate I voice assistant harness)
type Route = 'dashboard' | 'companion' | 'lab' | 'g1' | 'g2' | 'g3' | 'h1' | 'voice';
const parse = (): Route => { const h = location.hash.replace('#/', ''); return h === 'companion' || h === 'lab' || h === 'g1' || h === 'g2' || h === 'g3' || h === 'h1' || h === 'voice' ? h : 'dashboard'; };

export default function App() {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => { const fn = () => setRoute(parse()); addEventListener('hashchange', fn); return () => removeEventListener('hashchange', fn); }, []);
  const nav: [Route, string, string][] = [['dashboard', 'Dashboard', 'Mini + Widget'], ['companion', 'Bạn đồng hành', 'Toàn màn hình'], ['lab', 'Runtime lab', 'Kiểm thử'], ['g1', 'G1 lab', 'Quest · Reward · Streak'], ['g2', 'G2 lab', 'Học · Thể thao · Ngủ'], ['g3', 'G3 lab', 'Thử thách · Nhóm · Bạn bè'], ['h1', 'H1 lab', 'Trang phục · Phụ kiện'], ['voice', 'Gate I voice', 'Voice → Task']];
  return (
    <CompanionProvider>
      <div className="shell">
        <header className="app-header">
          <a className="brand" href="#/dashboard"><span className="brand-mark" aria-hidden>🦊</span>LifeQuest</a>
          <nav aria-label="Trang">
            {nav.map(([r, label, sub]) => <a key={r} href={`#/${r}`} className={route === r ? 'on' : ''} aria-current={route === r ? 'page' : undefined}><b>{label}</b><span>{sub}</span></a>)}
          </nav>
          <span className="gate-tag">Fox V2 · Gate I sandbox</span>
        </header>
        <main>{route === 'dashboard' ? <DashboardPage /> : route === 'companion' ? <CompanionPage /> : route === 'g1' ? <G1LabPage /> : route === 'g2' ? <G2LabPage /> : route === 'g3' ? <G3LabPage /> : route === 'h1' ? <H1LabPage /> : route === 'voice' ? <VoiceLabPage /> : <LabPage />}</main>
      </div>
    </CompanionProvider>
  );
}
