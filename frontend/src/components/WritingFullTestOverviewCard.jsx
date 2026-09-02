import React from 'react';
import { getScoreColor } from '../utils/scoreColor';

const BAND_COLOR = getScoreColor;

/**
 * WritingFullTestOverviewCard — Overview dashboard card for Full Test Writing results.
 */
function WritingFullTestOverviewCard({
  overallBand,
  targetBand,
  task1Overall,
  task2Overall,
  targetAnalysis,
  onSelectTask1,
  onSelectTask2,
}) {
  return (
    <div className="wr-ft-overview-card">
      <div className="wr-ft-score-cards">
        <div className="wr-ft-card main" style={{ borderColor: BAND_COLOR(overallBand) }}>
          <div className="wr-ft-val" style={{ color: BAND_COLOR(overallBand) }}>
            {Number(overallBand).toFixed(1)}
          </div>
          <div className="wr-ft-lbl">Overall Writing Band</div>
          <div className="wr-ft-sub">Formula: (Task 1 × 1 + Task 2 × 2) ÷ 3</div>
        </div>

        <div className="wr-ft-card" onClick={onSelectTask1}>
          <div className="wr-ft-val" style={{ color: BAND_COLOR(task1Overall) }}>
            {task1Overall ?? '—'}
          </div>
          <div className="wr-ft-lbl">Task 1 (Report)</div>
          <div className="wr-ft-link">View Task 1 Details →</div>
        </div>

        <div className="wr-ft-card" onClick={onSelectTask2}>
          <div className="wr-ft-val" style={{ color: BAND_COLOR(task2Overall) }}>
            {task2Overall ?? '—'}
          </div>
          <div className="wr-ft-lbl">Task 2 (Essay)</div>
          <div className="wr-ft-link">View Task 2 Details →</div>
        </div>
      </div>

      <div className="wr-analysis-grid">
        {targetAnalysis.strengths?.length > 0 && (
          <div className="wr-analysis-box strengths">
            <h4>✅ Key Strengths Relative to Target Band {Number(targetBand).toFixed(1)}:</h4>
            <ul>
              {targetAnalysis.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        )}
        {targetAnalysis.key_gaps?.length > 0 && (
          <div className="wr-analysis-box gaps">
            <h4>🔍 Key Focus Areas & Gaps to Reach Target:</h4>
            <ul>
              {targetAnalysis.key_gaps.map((gap, idx) => (
                <li key={idx}>{gap}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default WritingFullTestOverviewCard;
