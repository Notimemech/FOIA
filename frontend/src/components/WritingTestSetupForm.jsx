import React from 'react';

/**
 * WritingTestSetupForm — the session configuration form shown before writing begins.
 */
function WritingTestSetupForm({
  isTask1,
  partType,
  mode, setMode,
  targetBand, setTargetBand,
  prompt, setPrompt,
  imageUrl, setImageUrl,
  imageUploading,
  handleImageUpload,
  handleStartWriting,
}) {
  return (
    <div className="wt-setup-card">
      <div className="wt-setup-header">
        <h2>Setup Your Session: IELTS Writing {partType}</h2>
        <p>Input your task prompt, attach visual diagrams (for Task 1 if applicable), and specify your Target Band benchmark.</p>
      </div>

      <form onSubmit={handleStartWriting} className="wt-setup-form">
        {/* Mode */}
        <div className="wt-form-group">
          <label className="wt-label">Testing Mode:</label>
          <div className="wt-mode-selector-inline">
            <button type="button" className={`wt-mode-choice ${mode === 'practice' ? 'active' : ''}`} onClick={() => setMode('practice')}>
              <div className="wt-choice-title">🌱 Practice Mode</div>
              <div className="wt-choice-desc">No countdown pressure. Write freely at your own pace.</div>
            </button>
            <button type="button" className={`wt-mode-choice ${mode === 'exam' ? 'active' : ''}`} onClick={() => setMode('exam')}>
              <div className="wt-choice-title">⏱️ Exam Simulation</div>
              <div className="wt-choice-desc">Strict {isTask1 ? '20-minute' : '40-minute'} timer starts upon clicking begin.</div>
            </button>
          </div>
        </div>

        {/* Target Band */}
        <div className="wt-form-group">
          <label className="wt-label" htmlFor="targetBandSelect">
            Target Band Benchmark (Minimum evaluation criteria for AI scoring):
          </label>
          <div className="wt-target-select-wrapper">
            <select id="targetBandSelect" value={targetBand} onChange={(e) => setTargetBand(parseFloat(e.target.value))} className="wt-select">
              {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                <option key={b} value={b}>Band {b.toFixed(1)}</option>
              ))}
            </select>
            <span className="wt-target-hint">
              💡 AI will benchmark your vocabulary, grammar, and coherence directly against Band {Number(targetBand).toFixed(1)} descriptors.
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="wt-form-group">
          <label className="wt-label" htmlFor="taskPrompt">Task Prompt ({partType}):</label>
          <textarea
            id="taskPrompt" rows="5" value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your IELTS Writing task prompt here..."
            className="wt-textarea" required
          />
        </div>

        {/* Task 1 Image */}
        {isTask1 && (
          <div className="wt-form-group">
            <label className="wt-label">Chart / Map / Diagram Image (Task 1):</label>
            <div className="wt-image-uploader">
              <div className="wt-upload-actions">
                <label className="wt-upload-btn">
                  📁 Upload Local Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <span className="wt-or-text">or paste image URL:</span>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/chart.png" className="wt-input" />
              </div>
              {imageUploading && <div className="wt-uploading">Uploading image...</div>}
              {imageUrl && (
                <div className="wt-image-preview">
                  <img src={imageUrl} alt="Task 1 Chart" />
                  <button type="button" className="wt-remove-img-btn" onClick={() => setImageUrl('')} title="Remove image">✕ Remove</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="wt-setup-submit">
          <button type="submit" className="wt-btn-start">🚀 Begin Writing ({partType})</button>
        </div>
      </form>
    </div>
  );
}

export default WritingTestSetupForm;
