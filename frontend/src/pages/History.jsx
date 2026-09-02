import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
        const res = await axios.get('http://localhost:5000/api/assessments');
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

  return (
    <div className="hs-container">
      {/* Top Navigation Tabs */}
      <div className="hs-top-tabs">
        {[
          ['writing', 'Lịch Sử Writing'],
          ['practice', 'Lịch Sử Thi Thử'],
          ['speaking', 'Lịch Sử Speaking'],
          ['real', 'Lịch Sử Real Test'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            className={`hs-tab-btn ${activeTopTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTopTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search & Filter Box */}
      <form className="hs-filter-card" onSubmit={handleSearch}>
        <div className="hs-filter-grid">
          <div className="hs-filter-field">
            <label>Loại bài thi</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="hs-select"
            >
              <option value="all">Tất cả</option>
              <option value="task1">Writing Task 1</option>
              <option value="task2">Writing Task 2</option>
              <option value="fulltest">Full Test (Task 1 & Task 2)</option>
              <option value="speaking">Speaking Test</option>
            </select>
          </div>

          <div className="hs-filter-field hs-search-field">
            <label>Tìm kiếm</label>
            <div className="hs-search-input-wrap">
              <span className="hs-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên bài thi, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hs-input"
              />
            </div>
          </div>
        </div>

        <div className="hs-filter-actions">
          <button type="submit" className="hs-btn-search">🔍 Tìm kiếm</button>
          <button type="button" className="hs-btn-clear" onClick={handleClearFilters}>Xóa bộ lọc</button>
        </div>
      </form>

      {/* Table / List Section */}
      {loading ? (
        <div className="hs-loading-state">
          <div className="hs-spinner" />
          <p>Đang tải danh sách bài làm...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="hs-empty-state">
          <div className="hs-empty-icon">📂</div>
          <h3>Không tìm thấy bài làm nào</h3>
          <p>Hãy chọn bộ lọc khác hoặc thực hiện bài thi mới tại Writing Hub.</p>
          <Link to="/writing" className="hs-btn-primary">✍️ Bắt đầu làm bài thi</Link>
        </div>
      ) : (
        <div className="hs-table-container">
          <table className="hs-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Bài thi</th>
                <th style={{ width: '32%' }}>Chủ đề</th>
                <th style={{ width: '16%' }}>Ngày làm bài</th>
                <th style={{ width: '12%' }}>Trạng thái</th>
                <th style={{ width: '10%' }}>Điểm số</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Thao tác</th>
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
