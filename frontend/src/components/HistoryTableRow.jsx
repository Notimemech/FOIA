import React from 'react';
import { Link } from 'react-router-dom';
import { getScoreColor } from '../utils/scoreColor';

const formatDate = (dateStr) => {
  if (!dateStr) return { dateTime: '—', time: '—' };
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

function HistoryTableRow({ item }) {
  const isWriting = item.skill === 'writing';
  const isSpeaking = item.skill === 'speaking';
  const detailUrl = isSpeaking
    ? `/speaking/result/${item.id}`
    : (isWriting ? `/writing/result/${item.id}` : `/history/${item.id}`);

  const { dateTime, time } = formatDate(item.created_at);

  const isFullTest = item.part_type === 'Full Test';
  const testTitle = item.feedback?.test_name || (
    isSpeaking
      ? `IELTS Speaking ${item.part_type || ''}`
      : (isFullTest ? 'IELTS Full Writing Test' : `IELTS Writing ${item.part_type || ''}`)
  );
  const isRealExam = item.feedback?.is_real_exam || item.feedback?.isRealExam;

  const overall = Number(item.overall_band || 0);
  const task1Score = item.sub_scores?.Task1_Overall ?? item.sub_scores?.TA;
  const task2Score = item.sub_scores?.Task2_Overall ?? item.sub_scores?.TR;

  return (
    <tr className="hs-table-row">
      {/* 1. Bài thi */}
      <td>
        <div className="hs-cell-test">
          <div className="hs-test-icon">{isSpeaking ? '🎙️' : '📄'}</div>
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

      {/* 5. Điểm số */}
      <td>
        <div className="hs-cell-scores">
          {isFullTest ? (
            <>
              {task1Score && (
                <div className="hs-score-row">
                  <span className="hs-score-lbl">Task 1:</span>
                  <strong className="hs-score-val" style={{ color: getScoreColor(task1Score) }}>
                    {Number(task1Score).toFixed(1)}
                  </strong>
                </div>
              )}
              {task2Score && (
                <div className="hs-score-row">
                  <span className="hs-score-lbl">Task 2:</span>
                  <strong className="hs-score-val" style={{ color: getScoreColor(task2Score) }}>
                    {Number(task2Score).toFixed(1)}
                  </strong>
                </div>
              )}
              <div className="hs-score-row total">
                <span className="hs-score-lbl">Tổng:</span>
                <strong className="hs-score-val total" style={{ color: getScoreColor(overall) }}>
                  {overall > 0 ? overall.toFixed(1) : '—'}
                </strong>
              </div>
            </>
          ) : (
            <>
              <div className="hs-score-row">
                <span className="hs-score-lbl">{item.part_type || 'Task'}:</span>
                <strong className="hs-score-val" style={{ color: getScoreColor(overall) }}>
                  {overall > 0 ? overall.toFixed(1) : '—'}
                </strong>
              </div>
              <div className="hs-score-row total">
                <span className="hs-score-lbl">Tổng:</span>
                <strong className="hs-score-val total" style={{ color: getScoreColor(overall) }}>
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
}

export default HistoryTableRow;
