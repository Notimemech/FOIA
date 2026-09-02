import React from 'react';

/**
 * WritingFullTestSetupForm — session configuration for the 60-minute IELTS Writing Full Test.
 */
function WritingFullTestSetupForm({
  mode,
  setMode,
  targetBand,
  setTargetBand,
  task1Prompt,
  setTask1Prompt,
  task1Image,
  setTask1Image,
  imageUploading,
  handleImageUpload,
  task2Prompt,
  setTask2Prompt,
  handleStartFullTest,
}) {
  return (
    <div className="wft-setup-card">
      <div className="wft-setup-header">
        <span className="wft-badge">Official IELTS Simulation</span>
        <h2>Setup Full IELTS Writing Exam (60 Minutes)</h2>
        <p>
          Configure both Task 1 (Academic Report, 20 mins recommended) and Task 2 (Essay, 40 mins recommended) in one realistic exam session.
        </p>
      </div>

      <form onSubmit={handleStartFullTest} className="wft-setup-form">
        {/* Mode Selector */}
        <div className="wft-form-group">
          <label className="wft-label">Testing Mode:</label>
          <div className="wft-mode-grid">
            <button
              type="button"
              className={`wft-mode-choice ${mode === 'exam' ? 'active' : ''}`}
              onClick={() => setMode('exam')}
            >
              <div className="wft-choice-title">⏱️ Official Exam Simulation (60 Mins)</div>
              <div className="wft-choice-desc">Strict 60-minute countdown timer with auto-submission. Authentic test condition.</div>
            </button>
            <button
              type="button"
              className={`wft-mode-choice ${mode === 'practice' ? 'active' : ''}`}
              onClick={() => setMode('practice')}
            >
              <div className="wft-choice-title">🌱 Untimed Practice Mode</div>
              <div className="wft-choice-desc">Write without time pressure. Track elapsed time at your own pace.</div>
            </button>
          </div>
        </div>

        {/* Target Band Selection */}
        <div className="wft-form-group">
          <label className="wft-label" htmlFor="targetBandFull">
            Target Band Benchmark:
          </label>
          <div className="wft-target-select-wrap">
            <select
              id="targetBandFull"
              value={targetBand}
              onChange={(e) => setTargetBand(parseFloat(e.target.value))}
              className="wft-select"
            >
              {[5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                <option key={b} value={b}>Band {b.toFixed(1)} Benchmark</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task 1 Section */}
        <div className="wft-task-setup-block">
          <div className="wft-task-setup-title">
            <span className="wft-task-badge">Task 1 (Report - 150 words min)</span>
          </div>

          <div className="wft-form-group">
            <label className="wft-label" htmlFor="task1Prompt">Task 1 Prompt / Visual Description:</label>
            <textarea
              id="task1Prompt"
              rows="4"
              value={task1Prompt}
              onChange={(e) => setTask1Prompt(e.target.value)}
              className="wft-textarea"
              placeholder="Enter Task 1 prompt here..."
              required
            />
          </div>

          <div className="wft-form-group">
            <label className="wft-label">Task 1 Chart / Diagram Image (Optional):</label>
            <div className="wft-upload-wrap">
              <label className="wft-upload-btn">
                📁 Upload Chart Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <span className="wft-or-text">or URL:</span>
              <input
                type="url"
                value={task1Image}
                onChange={(e) => setTask1Image(e.target.value)}
                placeholder="https://..."
                className="wft-input"
              />
            </div>
            {imageUploading && <div className="wft-uploading-indicator">Uploading chart...</div>}
            {task1Image && (
              <div className="wft-img-preview">
                <img src={task1Image} alt="Task 1 preview" />
                <button type="button" className="wft-img-remove" onClick={() => setTask1Image('')}>✕ Remove</button>
              </div>
            )}
          </div>
        </div>

        {/* Task 2 Section */}
        <div className="wft-task-setup-block">
          <div className="wft-task-setup-title">
            <span className="wft-task-badge">Task 2 (Essay - 250 words min)</span>
          </div>

          <div className="wft-form-group">
            <label className="wft-label" htmlFor="task2Prompt">Task 2 Essay Question / Prompt:</label>
            <textarea
              id="task2Prompt"
              rows="4"
              value={task2Prompt}
              onChange={(e) => setTask2Prompt(e.target.value)}
              className="wft-textarea"
              placeholder="Enter Task 2 essay prompt here..."
              required
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="wft-setup-actions">
          <button type="submit" className="wft-btn-start">
            🚀 Launch 60-Minute Writing Full Test
          </button>
        </div>
      </form>
    </div>
  );
}

export default WritingFullTestSetupForm;
