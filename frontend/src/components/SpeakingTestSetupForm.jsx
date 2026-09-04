import React, { useState } from 'react';

/**
 * SpeakingTestSetupForm — custom setup interface for Speaking test configuration.
 */
function SpeakingTestSetupForm({
  partType,
  setPartType,
  setActiveTab,
  part1Questions,
  setPart1Questions,
  part2CueCard,
  setPart2CueCard,
  part3Questions,
  setPart3Questions,
  mode,
  setMode,
  targetBand,
  setTargetBand,
  onEnterRoom,
}) {
  const [part1Raw, setPart1Raw] = useState(
    Array.isArray(part1Questions) ? part1Questions.join('\n') : (part1Questions || '')
  );
  const [part3Raw, setPart3Raw] = useState(
    Array.isArray(part3Questions) ? part3Questions.join('\n') : (part3Questions || '')
  );

  const handleStart = () => {
    const p1List = part1Raw
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);
    const p3List = part3Raw
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    setPart1Questions(p1List.length > 0 ? p1List : ['Describe your favorite hobby.']);
    setPart3Questions(p3List.length > 0 ? p3List : ['Why is this topic important in society today?']);
    onEnterRoom();
  };

  return (
    <div className="st-container">
      <div className="st-setup-card">
        <div className="st-setup-header">
          <span className="st-badge">Custom Speaking Setup</span>
          <h2>Configure Custom IELTS Speaking Test</h2>
          <p>Input your own speaking questions or cue card topics, configure exam mode, and set your target band.</p>
        </div>

        <div className="st-form-group">
          <label className="st-label">Test Format / Module:</label>
          <div className="st-type-grid">
            {[
              ['Part 1', '~5 short interview questions', 'p1'],
              ['Part 2 & 3', 'Cue Card + 3 discussion questions', 'p23'],
              ['Full Test', 'Complete Parts 1, 2 & 3', 'all'],
            ].map(([label, desc, tab]) => (
              <button
                key={label}
                type="button"
                className={`st-type-btn ${partType === label ? 'active' : ''}`}
                onClick={() => {
                  setPartType(label);
                  setActiveTab(tab);
                }}
              >
                <strong>{label}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {(partType === 'Part 1' || partType === 'Full Test') && (
          <div className="st-form-group">
            <label className="st-label">Part 1 Questions (One question per line):</label>
            <textarea
              className="st-textarea"
              rows={5}
              value={part1Raw}
              onChange={(e) => setPart1Raw(e.target.value)}
              placeholder="Enter 4-5 Part 1 questions..."
            />
          </div>
        )}

        {(partType === 'Part 2 & 3' || partType === 'Full Test') && (
          <>
            <div className="st-form-group">
              <label className="st-label">Part 2 Cue Card Topic & Bullet Points:</label>
              <textarea
                className="st-textarea"
                rows={6}
                value={part2CueCard}
                onChange={(e) => setPart2CueCard(e.target.value)}
                placeholder="Enter Cue Card prompt and bullet points..."
              />
            </div>
            <div className="st-form-group">
              <label className="st-label">Part 3 Discussion Questions (One question per line):</label>
              <textarea
                className="st-textarea"
                rows={4}
                value={part3Raw}
                onChange={(e) => setPart3Raw(e.target.value)}
                placeholder="Enter 3 deep discussion questions..."
              />
            </div>
          </>
        )}

        <div className="st-settings-grid">
          <div className="st-form-group">
            <label className="st-label">Test Mode:</label>
            <div className="st-mode-toggle">
              {[
                ['practice', '🌱 Practice Mode (Untimed)'],
                ['exam', '⏱️ Exam Mode (Timed)'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`st-mode-btn ${mode === val ? 'active' : ''}`}
                  onClick={() => setMode(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="st-form-group">
            <label className="st-label">Target Band Benchmark:</label>
            <select
              className="st-select"
              value={targetBand}
              onChange={(e) => setTargetBand(Number(e.target.value))}
            >
              {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                <option key={b} value={b}>Band {b.toFixed(1)} Target</option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" className="st-btn-start" onClick={handleStart}>
          🚀 Enter Speaking Test Room
        </button>
      </div>
    </div>
  );
}

export default SpeakingTestSetupForm;

