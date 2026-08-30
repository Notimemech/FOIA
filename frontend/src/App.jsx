import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import WritingHub from './pages/WritingHub';
import WritingTest from './pages/WritingTest';
import WritingFullTest from './pages/WritingFullTest';
import WritingResult from './pages/WritingResult';
import SpeakingHub from './pages/SpeakingHub';
import SpeakingTest from './pages/SpeakingTest';
import SpeakingResult from './pages/SpeakingResult';
import SpeakingDetailAnalysis from './pages/SpeakingDetailAnalysis';
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
            <Link to="/">Home</Link>
            <Link to="/writing">Writing</Link>
            <Link to="/speaking">Speaking</Link>
            <Link to="/history">History</Link>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/writing" element={<WritingHub />} />
            <Route path="/writing/task1" element={<WritingTest />} />
            <Route path="/writing/task2" element={<WritingTest />} />
            <Route path="/writing/fulltest" element={<WritingFullTest />} />
            <Route path="/writing/result/:id" element={<WritingResult />} />
            <Route path="/speaking" element={<SpeakingHub />} />
            <Route path="/speaking/test" element={<SpeakingTest />} />
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

