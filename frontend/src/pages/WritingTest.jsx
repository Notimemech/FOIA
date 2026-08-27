import React, { useState } from 'react';
import axios from 'axios';
import LoadingSteps from '../components/LoadingSteps';

const WRITING_CRITERIA = [
  'Task Response',
  'Coherence & Cohesion',
  'Lexical Resource',
  'Grammatical Range & Accuracy',
];

const CATEGORY_META = {
  'Task Response': {
    shortName: 'Task',
    subKey: 'TR',
    icon: '🎓',
    description: 'Task Response: Đánh giá khả năng trả lời đúng câu hỏi, phát triển ý tưởng và lập luận phù hợp.',
  },
  'Coherence & Cohesion': {
    shortName: 'Coherence',
    subKey: 'CC',
    icon: '🔗',
    description: 'Coherence & Cohesion: Đánh giá khả năng tổ chức bài viết mạch lạc, sử dụng từ nối và liên kết ý tưởng.',
  },
  'Lexical Resource': {
    shortName: 'Lexical',
    subKey: 'LR',
    icon: '✦',
    description: 'Lexical Resource: Đánh giá phạm vi từ vựng, độ chính xác và sự phù hợp trong sử dụng từ.',
  },
  'Grammatical Range & Accuracy': {
    shortName: 'Grammar',
    subKey: 'GRA',
    icon: '📝',
    description: 'Grammatical Range & Accuracy: Đánh giá phạm vi cấu trúc ngữ pháp và độ chính xác.',
  },
};

function WritingTest() {
  const [prompt, setPrompt] = useState(
    'Some people think that in the future, driverless cars will be the norm. Is this a positive or negative development?'
  );
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Task Response');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const wordCount = answer.split(/\s+/).filter((w) => w.length > 0).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('http://localhost:5000/api/assessments/submit', {
        skill: 'writing',
        part_type: 'Task 2',
        task_prompt: prompt,
        user_input_text: answer,
      });
      // Artificial delay to show loading animation fully (12s)
      setTimeout(() => {
        const data = res.data;
        // Debug: log toàn bộ response để kiểm tra cấu trúc
        console.log('[WritingTest] API result:', JSON.stringify(data, null, 2));
        setResult(data);
        setActiveCategory('Task Response');
        setLoading(false);
      }, 12000);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi nộp bài');
      setLoading(false);
    }
  };

  const getSubScore = (category) => {
    const meta = CATEGORY_META[category];
    if (!meta || !result?.sub_scores) return '—';
    return result.sub_scores[meta.subKey] ?? '—';
  };

  // Tìm feedback theo category — thử exact match trước, fallback tìm fuzzy
  const getActiveFeedback = (category) => {
    if (!result?.feedback) return null;
    if (result.feedback[category]) return result.feedback[category];
    // Fallback: tìm key gần đúng (ignore case, ignore & vs and)
    const normalize = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
    const normCat = normalize(category);
    const match = Object.keys(result.feedback).find(
      (k) => normalize(k) === normCat
    );
    return match ? result.feedback[match] : null;
  };

  const activeFeedback = getActiveFeedback(activeCategory);
  const activeMeta = CATEGORY_META[activeCategory];

  return (
    <div className="test-container">
      <h2>IELTS Writing Task 2</h2>

      {/* ── Input Form ── */}
      {!loading && !result && (
        <>
          <div className="form-group">
            <label>Đề bài:</label>
            <div className="prompt-box">{prompt}</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bài làm của bạn:</label>
              <textarea
                rows="15"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Viết bài làm của bạn vào đây..."
                required
              />
              <div className="word-count">{wordCount} words</div>
            </div>

            <button type="submit" className="btn-primary" disabled={!answer}>
              Nộp bài &amp; Chấm điểm
            </button>
          </form>
        </>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSteps />}

      {/* ── Result ── */}
      {result && !loading && (
        <div className="review-wrapper">
          {/* Header */}
          <div className="review-header">
            <h3 className="review-title">Nhận xét</h3>
            <div className="overall-score-badge">
              <span className="overall-score-value">{result.overall_band}</span>
              <span className="overall-score-label">Band</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            {WRITING_CRITERIA.map((cat) => {
              const meta = CATEGORY_META[cat];
              const score = getSubScore(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  className={`category-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span className="category-tab-name">{meta.shortName}</span>
                  <span className="category-tab-score">{score}</span>
                </button>
              );
            })}
          </div>

          {/* Category Description Card */}
          {activeMeta && (
            <div className="category-desc-card">
              <span className="category-desc-icon">{activeMeta.icon}</span>
              <span className="category-desc-text">{activeMeta.description}</span>
            </div>
          )}

          {/* Sub-Criteria List */}
          {activeFeedback ? (
            <div className="criteria-list">
              {Object.entries(activeFeedback).map(([critName, critDetails]) => {
                // Bỏ qua nếu không phải object tiêu chí con hợp lệ
                if (
                  !critDetails ||
                  typeof critDetails !== 'object' ||
                  Array.isArray(critDetails)
                ) return null;
                // Hỗ trợ cả "score" và "band" (AI có thể dùng khác key)
                const score = critDetails.score ?? critDetails.band ?? critDetails.Score;
                const comment = critDetails.comment ?? critDetails.feedback ?? critDetails.Comment ?? '';
                if (score === undefined) return null;
                return (
                  <div key={critName} className="criterion-card">
                    <div className="criterion-card-header">
                      <span className="criterion-card-title">{critName}</span>
                      <span className="criterion-card-score">{Number(score).toFixed(1)}</span>
                    </div>
                    <p className="criterion-card-comment">{comment}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            // Debug: hiển thị cấu trúc feedback nếu không tìm thấy
            <div style={{ padding: '1rem', color: '#e74c3c', fontSize: '0.85rem' }}>
              <strong>Debug:</strong> Không tìm thấy feedback cho "{activeCategory}".<br />
              Các key hiện có: {result?.feedback ? Object.keys(result.feedback).join(', ') : 'không có'}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="review-footer">
            <button
              className="btn-view-analysis"
              onClick={() => setShowDetailModal(true)}
            >
              <span>📄</span> Xem phân tích chi tiết
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {showDetailModal && result && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phân tích chi tiết</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* All categories */}
              {WRITING_CRITERIA.map((cat) => {
                const catFeedback = result.feedback?.[cat];
                if (!catFeedback) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="modal-category">
                    <div className="modal-category-header">
                      <span>{meta.icon} {cat}</span>
                      <span className="criterion-card-score">{getSubScore(cat)}</span>
                    </div>
                    {Object.entries(catFeedback).map(([critName, critDetails]) => {
                      if (!critDetails || typeof critDetails !== 'object' || critDetails.score === undefined) return null;
                      return (
                        <div key={critName} className="criterion-card">
                          <div className="criterion-card-header">
                            <span className="criterion-card-title">{critName}</span>
                            <span className="criterion-card-score">{Number(critDetails.score).toFixed(1)}</span>
                          </div>
                          <p className="criterion-card-comment">{critDetails.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Improvements */}
              {result.feedback?.improvements?.length > 0 && (
                <div className="modal-improvements">
                  <h4>💡 Gợi ý cải thiện</h4>
                  {result.feedback.improvements.map((imp, idx) => (
                    <div key={idx} className="improvement-card">
                      <div className="improvement-title">{imp.title}</div>
                      <div className="improvement-content">{imp.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Rewrite */}
              {result.feedback?.sample_rewrite && (
                <div className="modal-rewrite">
                  <h4>✍️ Bài mẫu tham khảo</h4>
                  <p>{result.feedback.sample_rewrite}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => { setShowDetailModal(false); setResult(null); setAnswer(''); }}
              >
                Làm bài khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingTest;
