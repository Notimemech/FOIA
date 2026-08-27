import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getScoreColor } from '../utils/scoreColor';

function History() {
  const navigate = useNavigate();
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
      // 1. Top Tab filter
      if (activeTopTab === 'writing') {
        if (item.skill !== 'writing') return false;
      } else if (activeTopTab === 'practice') {
        // Practice mode tests
        const isReal = item.feedback?.is_real_exam || item.feedback?.isRealExam;
        if (isReal) return false;
      } else if (activeTopTab === 'speaking') {
        if (item.skill !== 'speaking') return false;
      } else if (activeTopTab === 'real') {
        const isReal = item.feedback?.is_real_exam || item.feedback?.isRealExam;
        if (!isReal) return false;
      }

      // 2. Dropdown type filter
      if (selectedType !== 'all') {
        if (selectedType === 'task1' && item.part_type !== 'Task 1') return false;
        if (selectedType === 'task2' && item.part_type !== 'Task 2') return false;
        if (selectedType === 'fulltest' && item.part_type !== 'Full Test') return false;
        if (selectedType === 'speaking' && item.skill !== 'speaking') return false;
      }

      // 3. Search query
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

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: '—', time: '—' };
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return {
      dateTime: `${hours}:${mins} ${day}/${month}/${year}`,
      time: `${hours}:${mins}`,
    };
  };

  return (
    <div className="hs-container">
      {/* ── Top Navigation Tabs (from screenshot) ── */}
      <div className="hs-top-tabs">
        <button
          className={`hs-tab-btn ${activeTopTab === 'writing' ? 'active' : ''}`}
          onClick={() => setActiveTopTab('writing')}
        >
          Lịch Sử Writing
        </button>
        <button
          className={`hs-tab-btn ${activeTopTab === 'practice' ? 'active' : ''}`}
          onClick={() => setActiveTopTab('practice')}
        >
          Lịch Sử Thi Thử
        </button>
        <button
          className={`hs-tab-btn ${activeTopTab === 'speaking' ? 'active' : ''}`}
          onClick={() => setActiveTopTab('speaking')}
        >
          Lịch Sử Speaking
        </button>
        <button
          className={`hs-tab-btn ${activeTopTab === 'real' ? 'active' : ''}`}
          onClick={() => setActiveTopTab('real')}
        >
          Lịch Sử Real Test
        </button>
      </div>

      {/* ── Search & Filter Box ── */}
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
          <button type="submit" className="hs-btn-search">
            🔍 Tìm kiếm
          </button>
          <button
            type="button"
            className="hs-btn-clear"
            onClick={handleClearFilters}
          >
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* ── Table / List Section ── */}
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
          <Link to="/writing" className="hs-btn-primary">
            ✍️ Bắt đầu làm bài thi
          </Link>
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
              {filteredList.map((item) => {
                const isWriting = item.skill === 'writing';
                const detailUrl = isWriting
                  ? `/writing/result/${item.id}`
                  : `/history/${item.id}`;

                const { dateTime, time } = formatDate(item.created_at);

                const isFullTest = item.part_type === 'Full Test';
                const testTitle = item.feedback?.test_name || (isFullTest ? 'IELTS Full Writing Test' : `IELTS Writing ${item.part_type || ''}`);
                const isRealExam = item.feedback?.is_real_exam || item.feedback?.isRealExam;

                const overall = Number(item.overall_band || 0);
                const task1Score = item.sub_scores?.Task1_Overall ?? item.sub_scores?.TA;
                const task2Score = item.sub_scores?.Task2_Overall ?? item.sub_scores?.TR;

                return (
                  <tr key={item.id} className="hs-table-row">
                    {/* 1. Bài thi */}
                    <td>
                      <div className="hs-cell-test">
                        <div className="hs-test-icon">📄</div>
                        <div className="hs-test-info">
                          <span className="hs-test-name">{testTitle}</span>
                          <span className="hs-test-category">
                            • {isRealExam ? 'REAL TEST' : 'ACADEMIC'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Chủ đề */}
                    <td>
                      <div className="hs-cell-topic">
                        <div className="hs-topic-badge">
                          <span className="hs-topic-dot">●</span>
                          <strong>{item.part_type}:</strong>
                        </div>
                        <p className="hs-topic-text" title={item.task_prompt}>
                          {item.task_prompt || '(Đề bài tự nhập)'}
                        </p>
                      </div>
                    </td>

                    {/* 3. Ngày làm bài */}
                    <td>
                      <div className="hs-cell-date">
                        <span className="hs-date-main">{dateTime}</span>
                        <span className="hs-date-sub">
                          <span className="hs-clock-icon">🕒</span> {time}
                        </span>
                      </div>
                    </td>

                    {/* 4. Trạng thái */}
                    <td>
                      <span className="hs-status-badge">
                        <span className="hs-check-icon">✔</span> {item.part_type || 'Hoàn thành'}
                      </span>
                    </td>

                    {/* 5. Điểm số (Gradient màu từ Đỏ -> Xanh lá) */}
                    <td>
                      <div className="hs-cell-scores">
                        {isFullTest ? (
                          <>
                            {task1Score && (
                              <div className="hs-score-row">
                                <span className="hs-score-lbl">Task 1:</span>
                                <strong
                                  className="hs-score-val"
                                  style={{ color: getScoreColor(task1Score) }}
                                >
                                  {Number(task1Score).toFixed(1)}
                                </strong>
                              </div>
                            )}
                            {task2Score && (
                              <div className="hs-score-row">
                                <span className="hs-score-lbl">Task 2:</span>
                                <strong
                                  className="hs-score-val"
                                  style={{ color: getScoreColor(task2Score) }}
                                >
                                  {Number(task2Score).toFixed(1)}
                                </strong>
                              </div>
                            )}
                            <div className="hs-score-row total">
                              <span className="hs-score-lbl">Tổng:</span>
                              <strong
                                className="hs-score-val total"
                                style={{ color: getScoreColor(overall) }}
                              >
                                {overall > 0 ? overall.toFixed(1) : '—'}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="hs-score-row">
                              <span className="hs-score-lbl">{item.part_type || 'Task'}:</span>
                              <strong
                                className="hs-score-val"
                                style={{ color: getScoreColor(overall) }}
                              >
                                {overall > 0 ? overall.toFixed(1) : '—'}
                              </strong>
                            </div>
                            <div className="hs-score-row total">
                              <span className="hs-score-lbl">Tổng:</span>
                              <strong
                                className="hs-score-val total"
                                style={{ color: getScoreColor(overall) }}
                              >
                                {overall > 0 ? overall.toFixed(1) : '—'}
                              </strong>
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 6. Thao tác */}
                    <td style={{ textAlign: 'center' }}>
                      <Link to={detailUrl} className="hs-btn-detail">
                        <span>👁</span> Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
