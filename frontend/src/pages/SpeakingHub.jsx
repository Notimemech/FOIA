import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/speakingHub.css';

function SpeakingHub() {
  const navigate = useNavigate();

  // Mode selection state per speaking module ('practice' | 'exam')
  const [part1Mode, setPart1Mode] = useState('practice');
  const [part23Mode, setPart23Mode] = useState('exam');
  const [fullTestMode, setFullTestMode] = useState('exam');

  const handleStart = (partType, source, mode) => {
    navigate(`/speaking/test?part=${partType}&source=${source}&mode=${mode}`);
  };

  return (
    <div className="sh-container">
      {/* ── Header ── */}
      <header className="sh-header">
        <div className="sh-badge">IELTS Speaking Preparation</div>
        <h1 className="sh-title">IELTS Speaking Practice & Mock Tests</h1>
        <p className="sh-subtitle">
          Practice IELTS Speaking with our real-time voice recorder, countdown timers, and official Cambridge Band Descriptors scoring across Fluency & Coherence, Lexical Resource, Pronunciation, and Grammatical Range & Accuracy.
        </p>

        <div style={{
          marginTop: '1.25rem',
          background: 'linear-gradient(135deg, #485c42 0%, #2f3d2b 100%)',
          border: '1px solid rgba(254, 240, 138, 0.35)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🎰</span>
              <strong style={{ fontSize: '1.15rem', color: '#fef08a', fontFamily: 'var(--font-heading)' }}>
                Speaking Roulette (Quay chủ đề ngẫu nhiên)
              </strong>
              <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.72rem', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>NEW</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
              Xòe quạt bài, chọn chủ đề ngẫu nhiên theo Part 1, 2, 3 từ bộ đề Cambridge 19 & 20, xem từ vựng ngữ cảnh và ghi âm ngay lập tức!
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/speaking/roulette')}
            style={{
              background: '#fdfbf7',
              color: '#1e293b',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '24px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            🎲 Khám phá Roulette →
          </button>
        </div>
      </header>

      {/* ── 3 Main Sections ── */}
      <div className="sh-grid">
        
        {/* CARD 1: Part 1 */}
        <div className="sh-card">
          <div className="sh-card-badge sh-badge-p1">Part 1 • Introduction & Interview</div>
          <h2 className="sh-card-title">IELTS Speaking Part 1</h2>
          <p className="sh-card-desc">
            Answer 4–5 short questions regarding familiar everyday topics such as your hometown, work/studies, hobbies, and lifestyle habits.
          </p>

          <div className="sh-meta-list">
            <div className="sh-meta-item">
              <span>❓ Structure: <strong>4–5 Short Questions</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>⏱️ Recommended length: <strong>15–30s per answer</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>🎯 Focus: <strong>Fluency & Natural Response</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="sh-mode-selector">
            <span className="sh-mode-label">Practice Mode:</span>
            <div className="sh-mode-toggle">
              <button
                type="button"
                className={`sh-mode-btn ${part1Mode === 'practice' ? 'active' : ''}`}
                onClick={() => setPart1Mode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`sh-mode-btn ${part1Mode === 'exam' ? 'active' : ''}`}
                onClick={() => setPart1Mode('exam')}
              >
                ⏱️ Exam (Timed)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sh-actions">
            <button
              type="button"
              className="sh-btn-primary"
              onClick={() => handleStart('part1', 'custom', part1Mode)}
            >
              ✏️ Custom Questions
            </button>
            <button
              type="button"
              className="sh-btn-secondary"
              onClick={() => handleStart('part1', 'random', part1Mode)}
            >
              🎲 Random Mock Topics
            </button>
          </div>
        </div>

        {/* CARD 2: Part 2 + Part 3 */}
        <div className="sh-card">
          <div className="sh-card-badge sh-badge-p23">Part 2 & 3 • Cue Card & Discussion</div>
          <h2 className="sh-card-title">IELTS Speaking Part 2 & 3</h2>
          <p className="sh-card-desc">
            Speak for 2 minutes on a Cue Card topic with 1 minute preparation, followed by 3 in-depth abstract discussion questions derived from your topic.
          </p>

          <div className="sh-meta-list">
            <div className="sh-meta-item">
              <span>📝 Part 2: <strong>1m Prep (Notes) + 2m Speaking</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>💬 Part 3: <strong>3 Extended Discussion Questions</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>💡 Focus: <strong>Idea Extension & Abstract Analysis</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="sh-mode-selector">
            <span className="sh-mode-label">Practice Mode:</span>
            <div className="sh-mode-toggle">
              <button
                type="button"
                className={`sh-mode-btn ${part23Mode === 'practice' ? 'active' : ''}`}
                onClick={() => setPart23Mode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`sh-mode-btn ${part23Mode === 'exam' ? 'active' : ''}`}
                onClick={() => setPart23Mode('exam')}
              >
                ⏱️ Exam (1m+2m+P3)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sh-actions">
            <button
              type="button"
              className="sh-btn-primary"
              onClick={() => handleStart('part23', 'custom', part23Mode)}
            >
              ✏️ Custom Cue Card
            </button>
            <button
              type="button"
              className="sh-btn-secondary"
              onClick={() => handleStart('part23', 'random', part23Mode)}
            >
              🎲 Random Part 2 & 3 Test
            </button>
          </div>
        </div>

        {/* CARD 3: Full Test */}
        <div className="sh-card sh-card-featured">
          <div className="sh-card-badge sh-badge-full">Full Simulation • Parts 1, 2 & 3</div>
          <h2 className="sh-card-title">IELTS Speaking Full Test</h2>
          <p className="sh-card-desc">
            Complete exam simulation with all 3 parts. Features AI Examiner audio narration, preparation countdown timer, and comprehensive Band 0–9 rubric evaluation.
          </p>

          <div className="sh-meta-list">
            <div className="sh-meta-item">
              <span>🎙️ Flow: <strong>Part 1 (Intro) ➔ Part 2 (Long Turn) ➔ Part 3 (Discussion)</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>⏱️ Total Duration: <strong>11–14 Minutes Simulation</strong></span>
            </div>
            <div className="sh-meta-item">
              <span>🏆 Scoring: <strong>Overall Band + FC, LR, PR, GRA Sub-scores</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="sh-mode-selector">
            <span className="sh-mode-label">Practice Mode:</span>
            <div className="sh-mode-toggle">
              <button
                type="button"
                className={`sh-mode-btn ${fullTestMode === 'practice' ? 'active' : ''}`}
                onClick={() => setFullTestMode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`sh-mode-btn ${fullTestMode === 'exam' ? 'active' : ''}`}
                onClick={() => setFullTestMode('exam')}
              >
                ⏱️ Exam (Full Timed)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sh-actions">
            <button
              type="button"
              className="sh-btn-primary sh-btn-featured"
              onClick={() => handleStart('fulltest', 'custom', fullTestMode)}
            >
              🚀 Start Full Test (Custom)
            </button>
            <button
              type="button"
              className="sh-btn-secondary"
              onClick={() => handleStart('fulltest', 'random', fullTestMode)}
            >
              🎲 Random Full Mock Test
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SpeakingHub;
