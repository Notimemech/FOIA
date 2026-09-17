import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import WritingHub from './pages/WritingHub';
import WritingTest from './pages/WritingTest';
import WritingFullTest from './pages/WritingFullTest';
import WritingResult from './pages/WritingResult';
import SpeakingHub from './pages/SpeakingHub';
import SpeakingTest from './pages/SpeakingTest';
import SpeakingResult from './pages/SpeakingResult';
import SpeakingDetailAnalysis from './pages/SpeakingDetailAnalysis';
import SpeakingRoulette from './pages/SpeakingRoulette';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import './index.css';

function getInitialTheme() {
  try {
    return localStorage.getItem('ielts-theme') || 'dark';
  } catch {
    return 'dark';
  }
}

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === '/') return null;
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <button type="button" className="mobile-back-btn" onClick={goBack} aria-label="Go back">
      <span aria-hidden="true">←</span> Back
    </button>
  );
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('ielts-theme', theme);
    } catch {
      // ignore storage errors (private mode)
    }
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h2>IELTS Examiner</h2>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/writing">Writing</Link>
            <Link to="/speaking">Speaking</Link>
            <Link to="/history">History</Link>
          </div>
          <div className="nav-actions">
            <button
              type="button"
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </nav>
        
        <main className="main-content">
          <BackButton />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writing" element={<WritingHub />} />
            <Route path="/writing/task1" element={<WritingTest />} />
            <Route path="/writing/task2" element={<WritingTest />} />
            <Route path="/writing/fulltest" element={<WritingFullTest />} />
            <Route path="/writing/result/:id" element={<WritingResult />} />
            <Route path="/speaking" element={<SpeakingHub />} />
            <Route path="/speaking/test" element={<SpeakingTest />} />
            <Route path="/speaking/roulette" element={<SpeakingRoulette />} />
            <Route path="/speaking/result/:id" element={<SpeakingResult />} />
            <Route path="/speaking/detail/:id" element={<SpeakingDetailAnalysis />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<HistoryDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

