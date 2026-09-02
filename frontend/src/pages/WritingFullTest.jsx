import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import LoadingSteps from '../components/LoadingSteps';
import WritingFullTestSetupForm from '../components/WritingFullTestSetupForm';
import { DEFAULT_TASK1_PROMPT, DEFAULT_TASK2_PROMPT } from '../utils/writingDefaults';
import '../style/writingFullTest.css';

function WritingFullTest() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') || 'exam';

  const [step, setStep] = useState('setup');
  const [mode, setMode] = useState(initialMode);
  const [activeTab, setActiveTab] = useState('task1');

  const [task1Prompt, setTask1Prompt] = useState(DEFAULT_TASK1_PROMPT);
  const [task1Image, setTask1Image]   = useState('');
  const [task1Input, setTask1Input]   = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const [task2Prompt, setTask2Prompt] = useState(DEFAULT_TASK2_PROMPT);
  const [task2Input, setTask2Input]   = useState('');

  const [targetBand, setTargetBand]   = useState(7.0);
  const [loading, setLoading]         = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fullDurationSeconds = 60 * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(fullDurationSeconds);
  const [elapsedSeconds, setElapsedSeconds]     = useState(0);
  const timerRef = useRef(null);

  const task1Words = task1Input.trim() ? task1Input.trim().split(/\s+/).length : 0;
  const task2Words = task2Input.trim() ? task2Input.trim().split(/\s+/).length : 0;
  const totalWords = task1Words + task2Words;

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, mode, fullDurationSeconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  const handleStartFullTest = (e) => {
    e.preventDefault();
    if (!task1Prompt.trim() || !task2Prompt.trim()) {
      alert('Please provide task prompts for both Task 1 and Task 2 before beginning.');
      return;
    }
    setStep('writing');
    setActiveTab('task1');
  };

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
      setTimeout(() => { navigate(`/writing/result/${res.data.id}`); }, 12000);
    } catch (error) {
      console.error(error);
      alert('An error occurred during Full Test submission. Please try again.');
      setLoading(false);
    }
  };

  if (loading) return <div className="wft-container"><LoadingSteps /></div>;

  return (
    <div className="wft-container">
      {/* Top Navigation Bar */}
      <div className="wft-topbar">
        <Link to="/writing" className="wft-back-link">← Back to Writing Hub</Link>
        <div className="wft-topbar-center">
          <span className="wft-part-tag">IELTS Writing Full Test</span>
          <span className={`wft-mode-tag ${mode === 'exam' ? 'exam' : 'practice'}`}>
            {mode === 'exam' ? '⏱️ 60-Minute Real Simulation' : '🌱 Practice Mode'}
          </span>
        </div>
        <div className="wft-target-tag">🎯 Target: Band {Number(targetBand).toFixed(1)}</div>
      </div>

      {/* Setup Form */}
      {step === 'setup' && (
        <WritingFullTestSetupForm
          mode={mode} setMode={setMode}
          targetBand={targetBand} setTargetBand={setTargetBand}
          task1Prompt={task1Prompt} setTask1Prompt={setTask1Prompt}
          task1Image={task1Image} setTask1Image={setTask1Image}
          imageUploading={imageUploading} handleImageUpload={handleImageUpload}
          task2Prompt={task2Prompt} setTask2Prompt={setTask2Prompt}
          handleStartFullTest={handleStartFullTest}
        />
      )}

      {/* Writing Workspace */}
      {step === 'writing' && (
        <div className="wft-workspace">
          <div className="wft-status-strip">
            <div className="wft-timer-block">
              {mode === 'exam' ? (
                <div className={`wft-timer ${secondsRemaining < 600 ? 'urgent' : ''}`}>
                  ⏱️ Time Remaining: <strong>{formatTime(secondsRemaining)}</strong>
                </div>
              ) : (
                <div className="wft-timer practice">
                  🌱 Elapsed: <strong>{formatTime(elapsedSeconds)}</strong>
                </div>
              )}
            </div>

            <div className="wft-word-counters">
              <span className={`wft-counter ${task1Words >= 150 ? 'valid' : ''}`}>
                Task 1: <strong>{task1Words}</strong>/150w
              </span>
              <span className="wft-counter-div">|</span>
              <span className={`wft-counter ${task2Words >= 250 ? 'valid' : ''}`}>
                Task 2: <strong>{task2Words}</strong>/250w
              </span>
              <span className="wft-counter-div">|</span>
              <span className="wft-counter total">
                Total: <strong>{totalWords}</strong> words
              </span>
            </div>

            <button type="button" className="wft-btn-submit-head" onClick={handleSubmitFullTest}>
              🚀 Submit Full Test
            </button>
          </div>

          <div className="wft-task-tabs">
            <button type="button" className={`wft-tab-btn ${activeTab === 'task1' ? 'active' : ''}`} onClick={() => setActiveTab('task1')}>
              <span className="wft-tab-title">📊 Task 1: Academic Report</span>
              <span className={`wft-tab-badge ${task1Words >= 150 ? 'done' : ''}`}>
                {task1Words >= 150 ? '✓ ' : ''}{task1Words} words
              </span>
            </button>
            <button type="button" className={`wft-tab-btn ${activeTab === 'task2' ? 'active' : ''}`} onClick={() => setActiveTab('task2')}>
              <span className="wft-tab-title">✍️ Task 2: Essay</span>
              <span className={`wft-tab-badge ${task2Words >= 250 ? 'done' : ''}`}>
                {task2Words >= 250 ? '✓ ' : ''}{task2Words} words
              </span>
            </button>
          </div>

          <div className="wft-split-pane">
            <div className="wft-pane-left">
              <div className="wft-prompt-card">
                <div className="wft-card-head">
                  <h3>📌 {activeTab === 'task1' ? 'Task 1 Prompt' : 'Task 2 Essay Prompt'}</h3>
                  <button type="button" className="wft-btn-edit-setup" onClick={() => setStep('setup')}>
                    ✏️ Edit Prompts
                  </button>
                </div>
                <div className="wft-prompt-text">{activeTab === 'task1' ? task1Prompt : task2Prompt}</div>
                {activeTab === 'task1' && task1Image && (
                  <div className="wft-chart-wrap">
                    <img src={task1Image} alt="Task 1 Visual" onClick={() => setLightboxOpen(true)} />
                    <span className="wft-chart-hint" onClick={() => setLightboxOpen(true)}>
                      🔍 Click to enlarge chart
                    </span>
                  </div>
                )}
                <div className="wft-prompt-foot">
                  <span>🎯 Target Band: <strong>{Number(targetBand).toFixed(1)}</strong></span>
                  <span>📝 Min Length: <strong>{activeTab === 'task1' ? '150' : '250'} words</strong></span>
                </div>
              </div>
            </div>

            <div className="wft-pane-right">
              <div className="wft-editor-card">
                <div className="wft-card-head">
                  <h3>✍️ Candidate Response ({activeTab === 'task1' ? 'Task 1' : 'Task 2'})</h3>
                  <span className="wft-live-words">
                    {activeTab === 'task1' ? task1Words : task2Words} words
                  </span>
                </div>
                {activeTab === 'task1' ? (
                  <textarea
                    className="wft-textarea-editor"
                    value={task1Input}
                    onChange={(e) => setTask1Input(e.target.value)}
                    placeholder="Write your Task 1 response here (minimum 150 words)..."
                    autoFocus
                  />
                ) : (
                  <textarea
                    className="wft-textarea-editor"
                    value={task2Input}
                    onChange={(e) => setTask2Input(e.target.value)}
                    placeholder="Write your Task 2 essay here (minimum 250 words)..."
                    autoFocus
                  />
                )}
                <div className="wft-editor-foot">
                  <span className="wft-foot-hint">
                    {activeTab === 'task1'
                      ? (task1Words >= 150 ? '✅ Task 1 requirement met.' : `⚠️ Need ${150 - task1Words} more words.`)
                      : (task2Words >= 250 ? '✅ Task 2 requirement met.' : `⚠️ Need ${250 - task2Words} more words.`)}
                  </span>
                  {activeTab === 'task1' ? (
                    <button type="button" className="wft-btn-switch" onClick={() => setActiveTab('task2')}>
                      Switch to Task 2 →
                    </button>
                  ) : (
                    <button type="button" className="wft-btn-switch" onClick={() => setActiveTab('task1')}>
                      ← Back to Task 1
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && task1Image && (
        <div className="wft-lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="wft-lightbox-box" onClick={(e) => e.stopPropagation()}>
            <img src={task1Image} alt="Task 1 full chart" />
            <button type="button" className="wft-lightbox-close" onClick={() => setLightboxOpen(false)}>✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingFullTest;
