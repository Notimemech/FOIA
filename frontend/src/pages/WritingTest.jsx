import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import LoadingSteps from '../components/LoadingSteps';

function WritingTest() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine Task & Mode from query params or URL pathname
  const searchParams = new URLSearchParams(location.search);
  const isTask1 = location.pathname.includes('task1') || searchParams.get('task') === 'task1';
  const partType = isTask1 ? 'Task 1' : 'Task 2';
  const initialMode = searchParams.get('mode') || 'practice';

  const defaultPrompt = isTask1
    ? 'The chart below shows the percentage of households in a European country with internet access between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
    : 'Some people think that in the future, driverless cars will be the norm. Is this a positive or negative development? Give reasons for your answer and include any relevant examples from your own knowledge or experience.';

  // State
  const [step, setStep] = useState('setup'); // 'setup' | 'writing'
  const [mode, setMode] = useState(initialMode); // 'practice' | 'exam'
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [targetBand, setTargetBand] = useState(7.0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Timer: 20 mins for Task 1, 40 mins for Task 2
  const examDurationSeconds = isTask1 ? 20 * 60 : 40 * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(examDurationSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Word count & targets
  const minWords = isTask1 ? 150 : 250;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const isWordTargetMet = wordCount >= minWords;

  // Timer Effect (only runs when step === 'writing')
  useEffect(() => {
    if (step !== 'writing') return;

    if (mode === 'exam') {
      setSecondsRemaining(examDurationSeconds);
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            alert('⏱️ Time is up! Your essay will now be submitted for assessment.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, mode, examDurationSeconds]);

  // Format time MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setImageUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/assessments/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.imageUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again or paste an image URL directly.');
    } finally {
      setImageUploading(false);
    }
  };

  // Start Writing
  const handleStartWriting = (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a task prompt before starting.');
      return;
    }
    setStep('writing');
  };

  // Submit assessment
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!answer.trim()) {
      alert('Please write your essay before submitting.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/assessments/submit', {
        skill: 'writing',
        part_type: partType,
        task_prompt: prompt,
        user_input_text: answer,
        target_band: Number(targetBand),
        image_url: imageUrl || null,
      });

      setTimeout(() => {
        navigate(`/writing/result/${res.data.id}`);
      }, 9000);
    } catch (error) {
      console.error(error);
      alert('An error occurred during submission. Please try again.');
      setLoading(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="wt-container">
        <LoadingSteps />
      </div>
    );
  }

  return (
    <div className="wt-container">
      {/* ── Top Bar ── */}
      <div className="wt-topbar">
        <Link to="/writing" className="wt-back-link">← Back to Writing Hub</Link>
        <div className="wt-topbar-center">
          <span className="wt-part-tag">{partType}</span>
          <span className={`wt-mode-tag ${mode === 'exam' ? 'exam' : 'practice'}`}>
            {mode === 'exam' ? `⏱️ Exam Simulation (${isTask1 ? '20' : '40'} mins)` : '🌱 Practice Mode'}
          </span>
        </div>
        <div className="wt-target-tag">🎯 Target: Band {Number(targetBand).toFixed(1)}</div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* STEP 1: SETUP & PROMPT INPUT FORM         */}
      {/* ────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="wt-setup-card">
          <div className="wt-setup-header">
            <h2>Setup Your Session: IELTS Writing {partType}</h2>
            <p>Input your task prompt, attach visual diagrams (for Task 1 if applicable), and specify your Target Band benchmark.</p>
          </div>

          <form onSubmit={handleStartWriting} className="wt-setup-form">
            {/* Mode selection */}
            <div className="wt-form-group">
              <label className="wt-label">Testing Mode:</label>
              <div className="wt-mode-selector-inline">
                <button
                  type="button"
                  className={`wt-mode-choice ${mode === 'practice' ? 'active' : ''}`}
                  onClick={() => setMode('practice')}
                >
                  <div className="wt-choice-title">🌱 Practice Mode</div>
                  <div className="wt-choice-desc">No countdown pressure. Write freely at your own pace.</div>
                </button>
                <button
                  type="button"
                  className={`wt-mode-choice ${mode === 'exam' ? 'active' : ''}`}
                  onClick={() => setMode('exam')}
                >
                  <div className="wt-choice-title">⏱️ Exam Simulation</div>
                  <div className="wt-choice-desc">Strict {isTask1 ? '20-minute' : '40-minute'} timer starts upon clicking begin.</div>
                </button>
              </div>
            </div>

            {/* Target Band selection */}
            <div className="wt-form-group">
              <label className="wt-label" htmlFor="targetBandSelect">
                Target Band Benchmark (Minimum evaluation criteria for AI scoring):
              </label>
              <div className="wt-target-select-wrapper">
                <select
                  id="targetBandSelect"
                  value={targetBand}
                  onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                  className="wt-select"
                >
                  {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                    <option key={b} value={b}>Band {b.toFixed(1)}</option>
                  ))}
                </select>
                <span className="wt-target-hint">
                  💡 AI will benchmark your vocabulary, grammar, and coherence directly against Band {Number(targetBand).toFixed(1)} descriptors.
                </span>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="wt-form-group">
              <label className="wt-label" htmlFor="taskPrompt">
                Task Prompt ({partType}):
              </label>
              <textarea
                id="taskPrompt"
                rows="5"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your IELTS Writing task prompt here..."
                className="wt-textarea"
                required
              />
            </div>

            {/* Task 1 Image upload/URL */}
            {isTask1 && (
              <div className="wt-form-group">
                <label className="wt-label">
                  Chart / Map / Diagram Image (Task 1):
                </label>
                <div className="wt-image-uploader">
                  <div className="wt-upload-actions">
                    <label className="wt-upload-btn">
                      📁 Upload Local Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span className="wt-or-text">or paste image URL:</span>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/chart.png"
                      className="wt-input"
                    />
                  </div>
                  {imageUploading && <div className="wt-uploading">Uploading image...</div>}
                  {imageUrl && (
                    <div className="wt-image-preview">
                      <img src={imageUrl} alt="Task 1 Chart" />
                      <button
                        type="button"
                        className="wt-remove-img-btn"
                        onClick={() => setImageUrl('')}
                        title="Remove image"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="wt-setup-submit">
              <button type="submit" className="wt-btn-start">
                🚀 Begin Writing ({partType})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* STEP 2: WRITING WORKSPACE (Side-by-Side)   */}
      {/* ────────────────────────────────────────── */}
      {step === 'writing' && (
        <div className="wt-workspace">
          {/* Top Timer Bar */}
          <div className="wt-timer-strip">
            <div className="wt-timer-info">
              {mode === 'exam' ? (
                <div className={`wt-timer-display ${secondsRemaining < 300 ? 'warning' : ''}`}>
                  ⏱️ Time Remaining: <strong>{formatTime(secondsRemaining)}</strong>
                </div>
              ) : (
                <div className="wt-timer-display practice">
                  🌱 Elapsed Time: <strong>{formatTime(elapsedSeconds)}</strong>
                </div>
              )}
            </div>

            <div className="wt-word-indicator">
              Word count: <strong className={isWordTargetMet ? 'met' : 'unmet'}>{wordCount}</strong> / {minWords} minimum words
              {isWordTargetMet && <span className="wt-word-badge-ok"> ✓ Requirement Met</span>}
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="wt-split-pane">
            
            {/* LEFT: Prompt & Chart */}
            <div className="wt-pane-left">
              <div className="wt-prompt-card">
                <div className="wt-pane-header">
                  <h3>📌 Task Prompt ({partType})</h3>
                  <button
                    type="button"
                    className="wt-btn-edit-prompt"
                    onClick={() => setStep('setup')}
                    title="Edit prompt or session settings"
                  >
                    ✏️ Edit Prompt
                  </button>
                </div>
                <div className="wt-prompt-text">{prompt}</div>

                {/* Image if available */}
                {imageUrl && (
                  <div className="wt-prompt-image-container">
                    <img
                      src={imageUrl}
                      alt="Task 1 Chart"
                      className="wt-prompt-image"
                      onClick={() => setLightboxOpen(true)}
                      title="Click to expand chart"
                    />
                    <div className="wt-image-hint" onClick={() => setLightboxOpen(true)}>
                      🔍 Click image to view in full resolution
                    </div>
                  </div>
                )}

                <div className="wt-prompt-footer">
                  <div className="wt-reminder-item">
                    <span>🎯 Target Band:</span> <strong>{Number(targetBand).toFixed(1)}</strong>
                  </div>
                  <div className="wt-reminder-item">
                    <span>📝 Length:</span> <strong>Min {minWords} words</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Editor */}
            <div className="wt-pane-right">
              <form onSubmit={handleSubmit} className="wt-editor-form">
                <div className="wt-editor-header">
                  <h3>✍️ Candidate Response</h3>
                  <div className="wt-word-live">
                    {wordCount} words
                  </div>
                </div>

                <textarea
                  className="wt-editor-textarea"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={`Start composing your ${partType} response here...`}
                  autoFocus
                  required
                />

                <div className="wt-editor-actions">
                  <div className="wt-word-status">
                    {wordCount < minWords ? (
                      <span className="wt-status-warning">
                        ⚠️ Need {minWords - wordCount} more words to reach recommended minimum ({minWords} words).
                      </span>
                    ) : (
                      <span className="wt-status-success">
                        🎉 Word count requirement achieved ({wordCount} / {minWords} words).
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="wt-btn-submit"
                    disabled={!answer.trim() || loading}
                  >
                    Submit &amp; Evaluate with AI
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ── Image Lightbox ── */}
      {lightboxOpen && imageUrl && (
        <div className="wt-lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="wt-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={imageUrl} alt="Task 1 Full Chart" />
            <button
              type="button"
              className="wt-lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingTest;
