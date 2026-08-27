import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WritingHub() {
  const navigate = useNavigate();

  // Mode selection state per task ('practice' | 'exam')
  const [task1Mode, setTask1Mode] = useState('practice');
  const [task2Mode, setTask2Mode] = useState('practice');
  const [fullTestMode, setFullTestMode] = useState('exam');

  const handleStart = (taskType, source, mode) => {
    if (source === 'random') {
      alert('The random Cambridge prompt library is currently being expanded. You can use the "Custom Prompt" mode right now!');
      return;
    }

    if (taskType === 'fulltest') {
      navigate(`/writing/fulltest?mode=${mode}`);
    } else if (taskType === 'task1') {
      navigate(`/writing/task1?mode=${mode}`);
    } else if (taskType === 'task2') {
      navigate(`/writing/task2?mode=${mode}`);
    }
  };

  return (
    <div className="wh-container">
      {/* ── Header ── */}
      <header className="wh-header">
        <div className="wh-badge">IELTS Writing Preparation</div>
        <h1 className="wh-title">IELTS Writing Practice & Mock Tests</h1>
        <p className="wh-subtitle">
          Select your practice module. Input custom prompts or take a full 60-minute simulation with our dual-tab interface and Target Band benchmark scoring.
        </p>
      </header>

      {/* ── 3 Main Sections ── */}
      <div className="wh-grid">
        
        {/* CARD 1: Task 1 */}
        <div className="wh-card">
          <div className="wh-card-badge wh-badge-t1">Task 1 • Academic Report</div>
          <h2 className="wh-card-title">IELTS Writing Task 1</h2>
          <p className="wh-card-desc">
            Describe, summarize, or explain visual data from line graphs, bar charts, pie charts, tables, maps, or processes.
          </p>

          <div className="wh-meta-list">
            <div className="wh-meta-item">
              <span>✍️ Minimum length: <strong>150 words</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>⏱️ Recommended time: <strong>20 minutes</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>📊 Primary rubric: <strong>Task Achievement</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="wh-mode-selector">
            <span className="wh-mode-label">Practice Mode:</span>
            <div className="wh-mode-toggle">
              <button
                type="button"
                className={`wh-mode-btn ${task1Mode === 'practice' ? 'active' : ''}`}
                onClick={() => setTask1Mode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`wh-mode-btn ${task1Mode === 'exam' ? 'active' : ''}`}
                onClick={() => setTask1Mode('exam')}
              >
                ⏱️ Exam (20m)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="wh-actions">
            <button
              type="button"
              className="wh-btn-primary"
              onClick={() => handleStart('task1', 'custom', task1Mode)}
            >
              ✏️ Custom Prompt
            </button>
            <button
              type="button"
              className="wh-btn-secondary"
              onClick={() => handleStart('task1', 'random', task1Mode)}
            >
              🎲 Random Prompt
            </button>
          </div>
        </div>

        {/* CARD 2: Task 2 */}
        <div className="wh-card">
          <div className="wh-card-badge wh-badge-t2">Task 2 • Essay Writing</div>
          <h2 className="wh-card-title">IELTS Writing Task 2</h2>
          <p className="wh-card-desc">
            Write an academic discursive essay presenting arguments, solutions, causes, or evaluating distinct perspectives.
          </p>

          <div className="wh-meta-list">
            <div className="wh-meta-item">
              <span>✍️ Minimum length: <strong>250 words</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>⏱️ Recommended time: <strong>40 minutes</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>🎯 Primary rubric: <strong>Task Response</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="wh-mode-selector">
            <span className="wh-mode-label">Practice Mode:</span>
            <div className="wh-mode-toggle">
              <button
                type="button"
                className={`wh-mode-btn ${task2Mode === 'practice' ? 'active' : ''}`}
                onClick={() => setTask2Mode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`wh-mode-btn ${task2Mode === 'exam' ? 'active' : ''}`}
                onClick={() => setTask2Mode('exam')}
              >
                ⏱️ Exam (40m)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="wh-actions">
            <button
              type="button"
              className="wh-btn-primary"
              onClick={() => handleStart('task2', 'custom', task2Mode)}
            >
              ✏️ Custom Prompt
            </button>
            <button
              type="button"
              className="wh-btn-secondary"
              onClick={() => handleStart('task2', 'random', task2Mode)}
            >
              🎲 Random Prompt
            </button>
          </div>
        </div>

        {/* CARD 3: Full Test */}
        <div className="wh-card wh-card-featured">
          <div className="wh-card-badge wh-badge-full">Full Test • 2 Tasks Simulation</div>
          <h2 className="wh-card-title">IELTS Writing Full Test</h2>
          <p className="wh-card-desc">
            Complete exam simulation with Task 1 & Task 2 in a dual-tab environment. Official IELTS weighted scoring (Task 2 weighted x2).
          </p>

          <div className="wh-meta-list">
            <div className="wh-meta-item">
              <span>📑 Structure: <strong>Task 1 + Task 2 (Dual Tab)</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>⏱️ Total duration: <strong>60 minutes</strong></span>
            </div>
            <div className="wh-meta-item">
              <span>🏆 Assessment: <strong>Overall Band + Task 1 & 2 Breakdown</strong></span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="wh-mode-selector">
            <span className="wh-mode-label">Practice Mode:</span>
            <div className="wh-mode-toggle">
              <button
                type="button"
                className={`wh-mode-btn ${fullTestMode === 'practice' ? 'active' : ''}`}
                onClick={() => setFullTestMode('practice')}
              >
                🌱 Practice
              </button>
              <button
                type="button"
                className={`wh-mode-btn ${fullTestMode === 'exam' ? 'active' : ''}`}
                onClick={() => setFullTestMode('exam')}
              >
                ⏱️ Exam (60m)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="wh-actions">
            <button
              type="button"
              className="wh-btn-primary wh-btn-featured"
              onClick={() => handleStart('fulltest', 'custom', fullTestMode)}
            >
              🚀 Start Full Test (Custom 2 Tasks)
            </button>
            <button
              type="button"
              className="wh-btn-secondary"
              onClick={() => handleStart('fulltest', 'random', fullTestMode)}
            >
              🎲 Random Full Test
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default WritingHub;
