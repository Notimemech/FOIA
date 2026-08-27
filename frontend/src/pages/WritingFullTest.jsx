import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import LoadingSteps from '../components/LoadingSteps';

function WritingFullTest() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') || 'exam';

  // Step state: 'setup' | 'writing'
  const [step, setStep] = useState('setup');
  const [mode, setMode] = useState(initialMode);
  const [activeTab, setActiveTab] = useState('task1'); // 'task1' | 'task2'

  // Task 1 fields
  const [task1Prompt, setTask1Prompt] = useState(
    'The chart below shows the percentage of households in a European country with internet access between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  );
  const [task1Image, setTask1Image] = useState('');
  const [task1Input, setTask1Input] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Task 2 fields
  const [task2Prompt, setTask2Prompt] = useState(
    'Some people think that in the future, driverless cars will be the norm. Is this a positive or negative development? Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  );
  const [task2Input, setTask2Input] = useState('');

  // Target Band & Loading
  const [targetBand, setTargetBand] = useState(7.0);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Timer: 60 minutes for Full Test
  const fullDurationSeconds = 60 * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(fullDurationSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Word counts
  const task1Words = task1Input.trim() ? task1Input.trim().split(/\s+/).length : 0;
  const task2Words = task2Input.trim() ? task2Input.trim().split(/\s+/).length : 0;
  const totalWords = task1Words + task2Words;

  // Timer Effect
  useEffect(() => {
    if (step !== 'writing') return;

    if (mode === 'exam') {
      setSecondsRemaining(fullDurationSeconds);
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            alert('⏱️ Full Test 60 minutes expired! Automatically submitting your exam responses.');
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
  }, [step, mode, fullDurationSeconds]);

  // Format time MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Image Upload handler for Task 1
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
      setTask1Image(res.data.imageUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again or provide an image link.');
    } finally {
      setImageUploading(false);
    }
  };

  // Start Full Test
  const handleStartFullTest = (e) => {
    e.preventDefault();
    if (!task1Prompt.trim() || !task2Prompt.trim()) {
      alert('Please provide task prompts for both Task 1 and Task 2 before beginning.');
      return;
    }
    setStep('writing');
    setActiveTab('task1');
  };

  // Submit Full Test
  const handleSubmitFullTest = async (e) => {
    if (e) e.preventDefault();
    if (!task1Input.trim() && !task2Input.trim()) {
      alert('Please write a response for at least one task before submitting.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/assessments/submit', {
        skill: 'writing',
        part_type: 'Full Test',
        task1_prompt: task1Prompt,
        task1_input: task1Input,
        task1_image: task1Image || null,
        task2_prompt: task2Prompt,
        task2_input: task2Input,
        target_band: Number(targetBand),
      });

      setTimeout(() => {
        navigate(`/writing/result/${res.data.id}`);
      }, 12000);
    } catch (error) {
      console.error(error);
      alert('An error occurred during Full Test submission. Please try again.');
      setLoading(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="wt-container">
        <LoadingSteps />
      </div>
    );
  }

  return (
    <div className="ft-container">
      {/* ── Top Navigation ── */}
      <div className="wt-topbar">
        <Link to="/writing" className="wt-back-link">← Back to Writing Hub</Link>
        <div className="wt-topbar-center">
          <span className="wt-part-tag full">Full Test</span>
          <span className={`wt-mode-tag ${mode === 'exam' ? 'exam' : 'practice'}`}>
            {mode === 'exam' ? '⏱️ Exam Simulation (60 mins)' : '🌱 Practice Mode'}
          </span>
        </div>
        <div className="wt-target-tag">🎯 Target: Band {Number(targetBand).toFixed(1)}</div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* STEP 1: SETUP / FILL FULL TEST PROMPTS     */}
      {/* ────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="wt-setup-card">
          <div className="wt-setup-header">
            <h2>Setup Your Full Test: IELTS Writing (2 Tasks)</h2>
            <p>
              Provide task prompts for Task 1 (with optional visual data) and Task 2, specify your target band benchmark, and initiate the 60-minute mock exam.
            </p>
          </div>

          <form onSubmit={handleStartFullTest} className="wt-setup-form">
            {/* Mode selection */}
            <div className="wt-form-group">
              <label className="wt-label">Testing Mode:</label>
              <div className="wt-mode-selector-inline">
                <button
                  type="button"
                  className={`wt-mode-choice ${mode === 'exam' ? 'active' : ''}`}
                  onClick={() => setMode('exam')}
                >
                  <div className="wt-choice-title">⏱️ Exam Simulation (60 mins)</div>
                  <div className="wt-choice-desc">Strict 60:00 countdown across both tasks replicating actual test conditions.</div>
                </button>
                <button
                  type="button"
                  className={`wt-mode-choice ${mode === 'practice' ? 'active' : ''}`}
                  onClick={() => setMode('practice')}
                >
                  <div className="wt-choice-title">🌱 Practice Mode</div>
                  <div className="wt-choice-desc">Untimed session. Switch tabs freely to polish both essays.</div>
                </button>
              </div>
            </div>

            {/* Target Band selection */}
            <div className="wt-form-group">
              <label className="wt-label" htmlFor="fullTargetBand">
                Target Band Benchmark for Full Test:
              </label>
              <div className="wt-target-select-wrapper">
                <select
                  id="fullTargetBand"
                  value={targetBand}
                  onChange={(e) => setTargetBand(parseFloat(e.target.value))}
                  className="wt-select"
                >
                  {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                    <option key={b} value={b}>Band {b.toFixed(1)}</option>
                  ))}
                </select>
                <span className="wt-target-hint">
                  💡 AI independently grades Task 1 and Task 2 and computes the weighted Overall Band against Band {Number(targetBand).toFixed(1)}.
                </span>
              </div>
            </div>

            {/* TASK 1 INPUT SECTION */}
            <div className="ft-section-box">
              <div className="ft-section-header">
                <h3>📊 Section 1: IELTS Writing Task 1</h3>
                <span className="ft-section-req">Minimum 150 words • Suggested 20 mins</span>
              </div>

              <div className="wt-form-group">
                <label className="wt-label" htmlFor="fullTask1Prompt">
                  Task 1 Prompt:
                </label>
                <textarea
                  id="fullTask1Prompt"
                  rows="4"
                  value={task1Prompt}
                  onChange={(e) => setTask1Prompt(e.target.value)}
                  placeholder="Enter Task 1 prompt..."
                  className="wt-textarea"
                  required
                />
              </div>

              {/* Task 1 Image */}
              <div className="wt-form-group">
                <label className="wt-label">Visual Diagram / Chart Image for Task 1 (Optional):</label>
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
                      value={task1Image}
                      onChange={(e) => setTask1Image(e.target.value)}
                      placeholder="https://example.com/chart1.png"
                      className="wt-input"
                    />
                  </div>
                  {imageUploading && <div className="wt-uploading">Uploading image...</div>}
                  {task1Image && (
                    <div className="wt-image-preview">
                      <img src={task1Image} alt="Preview Task 1" />
                      <button
                        type="button"
                        className="wt-remove-img-btn"
                        onClick={() => setTask1Image('')}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TASK 2 INPUT SECTION */}
            <div className="ft-section-box">
              <div className="ft-section-header">
                <h3>✍️ Section 2: IELTS Writing Task 2</h3>
                <span className="ft-section-req">Minimum 250 words • Suggested 40 mins</span>
              </div>

              <div className="wt-form-group">
                <label className="wt-label" htmlFor="fullTask2Prompt">
                  Task 2 Prompt:
                </label>
                <textarea
                  id="fullTask2Prompt"
                  rows="4"
                  value={task2Prompt}
                  onChange={(e) => setTask2Prompt(e.target.value)}
                  placeholder="Enter Task 2 prompt..."
                  className="wt-textarea"
                  required
                />
              </div>
            </div>

            {/* Start Button */}
            <div className="wt-setup-submit">
              <button type="submit" className="wt-btn-start ft-start-btn">
                🚀 Start Full Test (Dual Tab)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* STEP 2: FULL TEST 2-TAB WORKSPACE          */}
      {/* ────────────────────────────────────────── */}
      {step === 'writing' && (
        <div className="ft-workspace">
          
          {/* Header Bar with Tabs and Timer */}
          <div className="ft-header-bar">
            {/* 2 Tabs */}
            <div className="ft-tabs">
              <button
                type="button"
                className={`ft-tab-btn ${activeTab === 'task1' ? 'active' : ''}`}
                onClick={() => setActiveTab('task1')}
              >
                <span>📊 Task 1 (Report)</span>
                <span className={`ft-tab-word-badge ${task1Words >= 150 ? 'met' : ''}`}>
                  {task1Words} / 150 words
                </span>
              </button>

              <button
                type="button"
                className={`ft-tab-btn ${activeTab === 'task2' ? 'active' : ''}`}
                onClick={() => setActiveTab('task2')}
              >
                <span>✍️ Task 2 (Essay)</span>
                <span className={`ft-tab-word-badge ${task2Words >= 250 ? 'met' : ''}`}>
                  {task2Words} / 250 words
                </span>
              </button>
            </div>

            {/* Center: Timer */}
            <div className="ft-timer-wrapper">
              {mode === 'exam' ? (
                <div className={`ft-timer-box ${secondsRemaining < 600 ? 'warning' : ''}`}>
                  ⏱️ Remaining: <strong>{formatTime(secondsRemaining)}</strong>
                </div>
              ) : (
                <div className="ft-timer-box practice">
                  🌱 Elapsed: <strong>{formatTime(elapsedSeconds)}</strong>
                </div>
              )}
            </div>

            {/* Right: Submit Button */}
            <div className="ft-header-actions">
              <button
                type="button"
                className="ft-btn-submit-test"
                onClick={handleSubmitFullTest}
                disabled={loading}
              >
                Submit Full Test ({totalWords} words)
              </button>
            </div>
          </div>

          {/* Tab 1 Content: Task 1 */}
          {activeTab === 'task1' && (
            <div className="wt-split-pane ft-pane-layout">
              {/* Left Column: Prompt & Image */}
              <div className="wt-pane-left">
                <div className="wt-prompt-card">
                  <div className="wt-pane-header">
                    <h3>📌 Task 1 Prompt</h3>
                    <span className="ft-req-pill">Min 150 words</span>
                  </div>
                  <div className="wt-prompt-text">{task1Prompt}</div>

                  {task1Image && (
                    <div className="wt-prompt-image-container">
                      <img
                        src={task1Image}
                        alt="Task 1 Chart"
                        className="wt-prompt-image"
                        onClick={() => setLightboxOpen(true)}
                      />
                      <div className="wt-image-hint" onClick={() => setLightboxOpen(true)}>
                        🔍 Click image to expand
                      </div>
                    </div>
                  )}

                  <div className="wt-prompt-footer">
                    <div className="wt-reminder-item">
                      <span>🎯 Target Band:</span> <strong>{Number(targetBand).toFixed(1)}</strong>
                    </div>
                    <div className="wt-reminder-item">
                      <span>⚖️ Weighting:</span> <strong>1/3 of total score</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Editor */}
              <div className="wt-pane-right">
                <div className="wt-editor-form">
                  <div className="wt-editor-header">
                    <h3>✍️ Task 1 Response</h3>
                    <div className="wt-word-live">{task1Words} words</div>
                  </div>

                  <textarea
                    className="wt-editor-textarea ft-textarea"
                    value={task1Input}
                    onChange={(e) => setTask1Input(e.target.value)}
                    placeholder="Compose your Task 1 report (minimum 150 words) here..."
                    autoFocus
                  />

                  <div className="ft-pane-footer">
                    <div className="wt-word-status">
                      {task1Words < 150 ? (
                        <span className="wt-status-warning">⚠️ Need {150 - task1Words} more words ({task1Words}/150 words).</span>
                      ) : (
                        <span className="wt-status-success">✓ Task 1 length requirement met ({task1Words} words).</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ft-btn-switch-tab"
                      onClick={() => setActiveTab('task2')}
                    >
                      Switch to Task 2 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 Content: Task 2 */}
          {activeTab === 'task2' && (
            <div className="wt-split-pane ft-pane-layout">
              {/* Left Column: Prompt */}
              <div className="wt-pane-left">
                <div className="wt-prompt-card">
                  <div className="wt-pane-header">
                    <h3>📌 Task 2 Prompt</h3>
                    <span className="ft-req-pill">Min 250 words</span>
                  </div>
                  <div className="wt-prompt-text">{task2Prompt}</div>

                  <div className="wt-prompt-footer">
                    <div className="wt-reminder-item">
                      <span>🎯 Target Band:</span> <strong>{Number(targetBand).toFixed(1)}</strong>
                    </div>
                    <div className="wt-reminder-item">
                      <span>⚖️ Weighting:</span> <strong>2/3 of total score</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Editor */}
              <div className="wt-pane-right">
                <div className="wt-editor-form">
                  <div className="wt-editor-header">
                    <h3>✍️ Task 2 Response</h3>
                    <div className="wt-word-live">{task2Words} words</div>
                  </div>

                  <textarea
                    className="wt-editor-textarea ft-textarea"
                    value={task2Input}
                    onChange={(e) => setTask2Input(e.target.value)}
                    placeholder="Compose your Task 2 essay (minimum 250 words) here..."
                    autoFocus
                  />

                  <div className="ft-pane-footer">
                    <div className="wt-word-status">
                      {task2Words < 250 ? (
                        <span className="wt-status-warning">⚠️ Need {250 - task2Words} more words ({task2Words}/250 words).</span>
                      ) : (
                        <span className="wt-status-success">✓ Task 2 length requirement met ({task2Words} words).</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ft-btn-switch-tab"
                      onClick={() => setActiveTab('task1')}
                    >
                      ← Switch to Task 1
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Lightbox for Task 1 Image */}
      {lightboxOpen && task1Image && (
        <div className="wt-lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="wt-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={task1Image} alt="Task 1 Full Chart" />
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

export default WritingFullTest;
