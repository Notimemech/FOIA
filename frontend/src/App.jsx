import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import WritingTest from './pages/WritingTest';
import SpeakingTest from './pages/SpeakingTest';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h2>IELTS Examiner</h2>
          <div className="nav-links">
            <Link to="/">Trang chủ</Link>
            <Link to="/writing">Writing</Link>
            <Link to="/speaking">Speaking</Link>
            <Link to="/history">Lịch sử</Link>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writing" element={<WritingTest />} />
            <Route path="/speaking" element={<SpeakingTest />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<HistoryDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
