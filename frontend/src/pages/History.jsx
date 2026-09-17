import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAssessments } from '../services/api';
import HistoryTableRow from '../components/HistoryTableRow';
import '../style/history.css';

function History() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top tabs: 'all' | 'writing' | 'practice' | 'speaking' | 'real'
  const [activeTopTab, setActiveTopTab] = useState('writing');

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getAssessments();
        setAssessments(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const handleClearFilters = () => {
    setSelectedType('all');
    setSearchQuery('');
    setAppliedSearch('');
  };

  const stats = useMemo(() => {
    const total = assessments.length;
    const writing = assessments.filter((a) => a.skill === 'writing').length;
    const speaking = assessments.filter((a) => a.skill === 'speaking').length;
    const bands = assessments
      .map((a) => Number(a.overall_band || 0))
      .filter((b) => b > 0);
    const avg = bands.length
      ? (bands.reduce((s, b) => s + b, 0) / bands.length).toFixed(1)
      : '—';
    return { total, writing, speaking, avg };
  }, [assessments]);

  const tabCounts = useMemo(() => {
    const isReal = (item) => item.feedback?.is_real_exam || item.feedback?.isRealExam;
    return {
      writing: assessments.filter((i) => i.skill === 'writing').length,
      practice: assessments.filter((i) => !isReal(i)).length,
      speaking: assessments.filter((i) => i.skill === 'speaking').length,
      real: assessments.filter((i) => isReal(i)).length,
    };
  }, [assessments]);

  // Filtered assessment list
  const filteredList = useMemo(() => {
    return assessments.filter((item) => {
      if (activeTopTab === 'writing') {
        if (item.skill !== 'writing') return false;
      } else if (activeTopTab === 'practice') {
        const isReal = item.feedback?.is_real_exam || item.feedback?.isRealExam;
        if (isReal) return false;
      } else if (activeTopTab === 'speaking') {
        if (item.skill !== 'speaking') return false;
      } else if (activeTopTab === 'real') {
        const isReal = item.feedback?.is_real_exam || item.feedback?.isRealExam;
        if (!isReal) return false;
      }

      if (selectedType !== 'all') {
        if (selectedType === 'task1' && item.part_type !== 'Task 1') return false;
        if (selectedType === 'task2' && item.part_type !== 'Task 2') return false;
        if (selectedType === 'fulltest' && item.part_type !== 'Full Test') return false;
        if (selectedType === 'speaking' && item.skill !== 'speaking') return false;
      }

      if (appliedSearch.trim()) {
        const query = appliedSearch.toLowerCase();
        const promptText = (item.task_prompt || '').toLowerCase();
        const partText = (item.part_type || '').toLowerCase();
        const skillText = (item.skill || '').toLowerCase();
        const nameText = (item.feedback?.test_name || item.feedback?.title || '').toLowerCase();
        if (!promptText.includes(query) && !partText.includes(query) && !skillText.includes(query) && !nameText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [assessments, activeTopTab, selectedType, appliedSearch]);

  const TABS = [
    { key: 'writing', label: 'Writing', icon: '✍️' },
    { key: 'practice', label: 'Mock Test', icon: '🎯' },
    { key: 'speaking', label: 'Speaking', icon: '🎙️' },
    { key: 'real', label: 'Real Test', icon: '🏆' },
  ];

  return (
    <div className="hs-container">
      {/* Hero header */}
      <header className="hs-hero">
        <div className="hs-hero-text">
          <span className="hs-eyebrow">IELTS Examiner • Learning Progress</span>
          <h1 className="hs-title">Test History</h1>
          <p className="hs-subtitle">
            Track all your Writing &amp; Speaking attempts, band scores, and progress over time.
          </p>
        </div>
        <div className="hs-stats" role="list" aria-label="History overview">
          <div className="hs-stat" role="listitem">
            <span className="hs-stat-icon" aria-hidden="true">📚</span>
            <span className="hs-stat-value">{stats.total}</span>
            <span className="hs-stat-label">Total attempts</span>
          </div>
          <div className="hs-stat" role="listitem">
            <span className="hs-stat-icon" aria-hidden="true">✍️</span>
            <span className="hs-stat-value">{stats.writing}</span>
            <span className="hs-stat-label">Writing tests</span>
          </div>
          <div className="hs-stat" role="listitem">
            <span className="hs-stat-icon" aria-hidden="true">🎙️</span>
            <span className="hs-stat-value">{stats.speaking}</span>
            <span className="hs-stat-label">Speaking tests</span>
          </div>
          <div className="hs-stat hs-stat-highlight" role="listitem">
            <span className="hs-stat-icon" aria-hidden="true">⭐</span>
            <span className="hs-stat-value">{stats.avg}</span>
            <span className="hs-stat-label">Average band</span>
          </div>
        </div>
      </header>

      {/* Top Navigation Tabs */}
      <div className="hs-top-tabs" role="tablist" aria-label="History type">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTopTab === key}
            className={`hs-tab-btn ${activeTopTab === key ? 'active' : ''}`}
            onClick={() => setActiveTopTab(key)}
          >
            <span className="hs-tab-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
            <span className="hs-tab-count">{tabCounts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search & Filter Box */}
      <form className="hs-filter-card" onSubmit={handleSearch}>
        <div className="hs-filter-grid">
          <div className="hs-filter-field">
            <label htmlFor="hs-type-select">🗂️ Test type</label>
            <select
              id="hs-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="hs-select"
            >
              <option value="all">All</option>
              <option value="task1">Writing Task 1</option>
              <option value="task2">Writing Task 2</option>
              <option value="fulltest">Full Test (Task 1 & Task 2)</option>
              <option value="speaking">Speaking Test</option>
            </select>
          </div>

          <div className="hs-filter-field hs-search-field">
            <label htmlFor="hs-search-input">🔍 Search</label>
            <div className="hs-search-input-wrap">
              <span className="hs-search-icon" aria-hidden="true">🔍</span>
              <input
                id="hs-search-input"
                type="search"
                placeholder="Search by test name, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hs-input"
                aria-label="Search attempts"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="hs-search-clear"
                  onClick={() => { setSearchQuery(''); setAppliedSearch(''); }}
                  aria-label="Clear search keyword"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hs-filter-actions">
          <span className="hs-result-count" role="status">
            {loading ? 'Loading...' : `${filteredList.length} attempts`}
          </span>
          <button type="submit" className="hs-btn-search">🔍 Search</button>
          <button type="button" className="hs-btn-clear" onClick={handleClearFilters}>✕ Clear filters</button>
        </div>
      </form>

      {/* Table / List Section */}
      {loading ? (
        <div className="hs-loading-state" role="status" aria-busy="true" aria-label="Loading attempts list">
          <div className="hs-spinner" aria-hidden="true" />
          <p>Loading attempts...</p>
          <div className="hs-skeleton-list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="hs-skeleton-row">
                <span className="hs-skeleton hs-skeleton-icon" />
                <span className="hs-skeleton hs-skeleton-line" />
                <span className="hs-skeleton hs-skeleton-pill" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="hs-empty-state" role="status">
          <div className="hs-empty-icon-wrap" aria-hidden="true">
            <span className="hs-empty-icon">📂</span>
          </div>
          <h3>No attempts found</h3>
          <p>Try different filters or take a new test in Writing Hub.</p>
          <div className="hs-empty-actions">
            <Link to="/writing" className="hs-btn-primary">✍️ Start a new test</Link>
            <button type="button" className="hs-btn-clear" onClick={handleClearFilters}>Clear filters</button>
          </div>
        </div>
      ) : (
        <div className="hs-table-container">
          <table className="hs-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: '22%' }}>Test</th>
                <th scope="col" style={{ width: '32%' }}>Topic</th>
                <th scope="col" style={{ width: '16%' }}>Date taken</th>
                <th scope="col" style={{ width: '12%' }}>Status</th>
                <th scope="col" style={{ width: '10%' }}>Score</th>
                <th scope="col" style={{ width: '8%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <HistoryTableRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
