import { useEffect, useState } from 'react';
import { CompanionProvider } from './components/CompanionContext';
import { CompanionPage } from './pages/CompanionPage';
import { DashboardPage } from './pages/DashboardPage';
import { LabPage } from './pages/LabPage';
import { G1LabPage } from './pages/G1LabPage';

// Hash routes: #/dashboard (Mini + Widget) · #/companion (Full view) · #/lab (runtime tests) · #/g1 (Gate G1 animation harness)
type Route = 'dashboard' | 'companion' | 'lab' | 'g1';
const parse = (): Route => { const h = location.hash.replace('#/', ''); return h === 'companion' || h === 'lab' || h === 'g1' ? h : 'dashboard'; };

export default function App() {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => { const fn = () => setRoute(parse()); addEventListener('hashchange', fn); return () => removeEventListener('hashchange', fn); }, []);
  const nav: [Route, string, string][] = [['dashboard', 'Dashboard', 'Mini + Widget'], ['companion', 'Bạn đồng hành', 'Toàn màn hình'], ['lab', 'Runtime lab', 'Kiểm thử'], ['g1', 'G1 lab', 'Quest · Reward · Streak']];
  return (
    <CompanionProvider>
      <div className="shell">
        <header className="app-header">
          <a className="brand" href="#/dashboard"><span className="brand-mark" aria-hidden>🦊</span>LifeQuest</a>
          <nav aria-label="Trang">
            {nav.map(([r, label, sub]) => <a key={r} href={`#/${r}`} className={route === r ? 'on' : ''} aria-current={route === r ? 'page' : undefined}><b>{label}</b><span>{sub}</span></a>)}
          </nav>
          <span className="gate-tag">Fox V2 · Gate F sandbox</span>
        </header>
        <main>{route === 'dashboard' ? <DashboardPage /> : route === 'companion' ? <CompanionPage /> : route === 'g1' ? <G1LabPage /> : <LabPage />}</main>
      </div>
    </CompanionProvider>
  );
}
