import React, { useState, useEffect, useRef } from 'react';

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * RouletteQuestionCard — Detailed drawn card component for IELTS Speaking Roulette.
 */
function RouletteQuestionCard({
  topic,
  selectedQuestion,
  isBookmarked,
  onToggleBookmark,
  onRecordAnswer,
  pastAttempts = [],
  onBackToDeck,
  onSpinNext,
}) {
  const [showHint, setShowHint] = useState(false);
  const [activeVocab, setActiveVocab] = useState(null);

  // Part 2 Prep timer state (60 seconds)
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [prepActive, setPrepActive]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setPrepSeconds(60);
    setPrepActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [topic]);

  useEffect(() => {
    if (prepActive) {
      timerRef.current = setInterval(() => {
        setPrepSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPrepActive(false);
            if ('speechSynthesis' in window) {
              const utter = new SpeechSynthesisUtterance("Time's up! Please start speaking now.");
              utter.lang = 'en-GB';
              window.speechSynthesis.speak(utter);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [prepActive]);

  const togglePrepTimer = () => {
    if (prepSeconds === 0) setPrepSeconds(60);
    setPrepActive(!prepActive);
  };

  const isPart2 = topic.part === 'Part 2';
  const colorCls = `sr-card-${topic.colorTheme || 'sage'}`;
  const displayQuestion = selectedQuestion || (isPart2 ? topic.cue_card : topic.questions?.[0]) || topic.topic;

  // Render sentence with clickable highlighted vocabulary
  const renderSentenceWithVocab = (item, idx) => {
    const parts = item.sentence.split(new RegExp(`(${item.word})`, 'gi'));
    return (
      <div key={idx} className="sr-vocab-item">
        <span>
          •{' '}
          {parts.map((p, i) =>
            p.toLowerCase() === item.word.toLowerCase() ? (
              <span
                key={i}
                className="sr-vocab-chip"
                onClick={() => setActiveVocab(activeVocab?.word === item.word ? null : item)}
                title="Bấm để xem nghĩa"
              >
                {p}
              </span>
            ) : (
              <span key={i}>{p}</span>
            )
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="sr-question-container">
      <div className={`sr-detail-card ${colorCls}`}>
        <div className="sr-card-watermark" />

        {/* Card Top Header */}
        <div className="sr-card-header">
          <span className="sr-card-part-tag">
            {topic.part} • {topic.topic}
          </span>
          <div className="sr-card-header-actions">
            <button
              type="button"
              className="sr-btn-hint-toggle"
              onClick={() => setShowHint(!showHint)}
            >
              💡 Gợi ý
            </button>
            <button
              type="button"
              className={`sr-btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
          </div>
        </div>

        {/* Expandable Hint Box */}
        {showHint && (
          <div className="sr-vocab-popover" style={{ marginBottom: '1.25rem' }}>
            <div className="sr-popover-head">
              <span className="sr-popover-word">💡 Strategic Hint / Hướng dẫn trả lời</span>
            </div>
            <p className="sr-popover-def">{topic.hint || 'Develop your ideas using cohesive linking words and specific examples.'}</p>
          </div>
        )}

        {/* Main Question Title */}
        <h2 className="sr-main-question">{displayQuestion}</h2>

        {/* Points To Talk About */}
        <div className="sr-points-section">
          <div className="sr-points-label">
            {isPart2 ? 'YOU SHOULD SAY' : 'THINGS YOU COULD TALK ABOUT'}
          </div>
          <div className="sr-points-list">
            {(isPart2 ? topic.questions : topic.points || []).map((point, i) => (
              <div key={i} className="sr-point-item">
                <span className="sr-point-number">{i + 1}</span>
                <span>{point.replace(/^\d+\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2 1-Minute Prep Timer */}
        {isPart2 && (
          <div className="sr-p2-prep-widget">
            <div className="sr-p2-timer-left">
              <div className={`sr-p2-dial ${prepActive ? 'running' : ''}`}>
                {formatTimer(prepSeconds)}
              </div>
              <div className="sr-p2-prep-text">
                <strong>{prepActive ? 'PREPARING...' : prepSeconds === 0 ? 'TIME UP!' : 'READY'}</strong>
                <span>1 min prep, 2 min talk</span>
              </div>
            </div>
            <button type="button" className="sr-btn-prep-action" onClick={togglePrepTimer}>
              {prepActive ? '⏸️ Pause' : prepSeconds === 0 ? '🔄 Reset 1:00' : '▶️ Start prep'}
            </button>
          </div>
        )}

        {/* Useful Vocabulary In Context */}
        {topic.vocab && topic.vocab.length > 0 && (
          <div className="sr-vocab-box">
            <div className="sr-vocab-header">
              <strong>USEFUL VOCABULARY IN CONTEXT</strong>
              <span>bấm từ tô đậm để xem nghĩa</span>
            </div>
            <div className="sr-vocab-list">
              {topic.vocab.map((v, idx) => renderSentenceWithVocab(v, idx))}
            </div>

            {/* Active Vocabulary Popover Definition */}
            {activeVocab && (
              <div className="sr-vocab-popover">
                <div className="sr-popover-head">
                  <span className="sr-popover-word">✦ {activeVocab.word}</span>
                  <span className="sr-popover-meaning">{activeVocab.meaning}</span>
                </div>
                <p className="sr-popover-def">{activeVocab.def}</p>
              </div>
            )}
          </div>
        )}

        {/* Practice Speaking Action Button */}
        <div className="sr-practice-section">
          <div className="sr-practice-label">PRACTISE SPEAKING</div>
          <button
            type="button"
            className="sr-btn-record-trigger"
            onClick={() => onRecordAnswer(displayQuestion, topic)}
          >
            🔴 Record your answer (Ghi âm câu trả lời)
          </button>
        </div>

        {/* Recent Practice History */}
        {pastAttempts && pastAttempts.length > 0 && (
          <div className="sr-history-section">
            <div className="sr-history-title">LỊCH SỬ LUYỆN TẬP</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {pastAttempts.slice(0, 3).map((item, idx) => (
                <div key={item.id || idx} className="sr-history-item">
                  <div className="sr-history-head">
                    <div className="sr-history-meta">
                      <span className="sr-history-pill">BÀI {idx + 1}</span>
                      <span className="sr-history-time">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : 'Vừa xong'}
                      </span>
                    </div>
                    {item.overall_band && (
                      <span className="sr-history-band">Band {Number(item.overall_band).toFixed(1)}</span>
                    )}
                  </div>
                  <p className="sr-history-transcript">
                    "{item.feedback?.transcript || item.user_input_text || 'Spoken answer submitted for evaluation.'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="sr-card-footer">
          <button type="button" className="sr-btn-back-deck" onClick={onBackToDeck}>
            ← Back to deck (Chọn bộ bài khác)
          </button>
          <button type="button" className="sr-btn-spin-next" onClick={onSpinNext}>
            🎲 Spin another (Quay chủ đề tiếp)
          </button>
        </div>
      </div>
    </div>
  );
}

export default RouletteQuestionCard;
