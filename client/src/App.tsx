import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CrimeMap from './pages/CrimeMap';
import Trends from './pages/Trends';
import Alerts from './pages/Alerts';
import Severity from './pages/Severity';
import NetworkGraph from './pages/NetworkGraph';
import FIRList from './pages/FIRList';
import './App.css';

const PAGES: Record<string, React.ReactNode> = {
  '/': <Dashboard />,
  '/map': <CrimeMap />,
  '/trends': <Trends />,
  '/alerts': <Alerts />,
  '/severity': <Severity />,
  '/network': <NetworkGraph />,
  '/firs': <FIRList />,
};

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  const page = PAGES[path] || <Dashboard />;

  return (
    <div className="app-layout">
      <Navbar currentPath={path} onNavigate={navigate} />
      <main className="app-main">
        {page}
      </main>
    </div>
  );
}

export default App;
