import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function History() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/assessments');
        setAssessments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <h2>Lịch sử chấm điểm</h2>
      {loading ? (
        <p>Đang tải lịch sử...</p>
      ) : assessments.length === 0 ? (
        <p>Bạn chưa có bài nộp nào.</p>
      ) : (
        <div className="history-list">
          {assessments.map(item => (
            <Link to={`/history/${item.id}`} key={item.id} className="history-item">
              <div className="history-item-header">
                <span className={`skill-badge ${item.skill}`}>{item.skill.toUpperCase()}</span>
                <span className="date">{new Date(item.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <p className="history-prompt">{item.task_prompt}</p>
              <div className="history-score">
                Band Score: <strong>{item.overall_band || 'N/A'}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
