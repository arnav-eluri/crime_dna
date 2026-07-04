import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CrimeMap from './pages/CrimeMap';
import Trends from './pages/Trends';
import Alerts from './pages/Alerts';
import Severity from './pages/Severity';
import NetworkGraph from './pages/NetworkGraph';
import FIRList from './pages/FIRList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<CrimeMap />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/severity" element={<Severity />} />
            <Route path="/network" element={<NetworkGraph />} />
            <Route path="/firs" element={<FIRList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
