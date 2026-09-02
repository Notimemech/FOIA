import React from 'react';
import { formatFeedbackText } from '../utils/feedbackFormatter';

/**
 * SpeakingTriangulationBanner — Progressive calibration banner for Full Test results.
 */
function SpeakingTriangulationBanner({ examinerBreakdown, overallBand }) {
  if (!examinerBreakdown) return null;

  const stages = [
    {
      cls: 'ceiling',
      stage: 'Stage 1: Part 1',
      label: 'Ceiling (Max)',
      band: examinerBreakdown.part1_ceiling_band,
      rationale: examinerBreakdown.part1_ceiling_rationale,
    },
    {
      cls: 'floor',
      stage: 'Stage 2: Part 2',
      label: 'Floor (Min)',
      band: examinerBreakdown.part2_floor_band,
      rationale: examinerBreakdown.part2_floor_rationale,
    },
    {
      cls: 'calibration',
      stage: 'Stage 3: Part 3 / Final',
      label: 'Calibrated Exact',
      band: examinerBreakdown.part3_calibration_band,
      rationale: examinerBreakdown.part3_calibration_rationale,
    },
  ];

  return (
    <div className="sp-triangulation-banner">
      <div className="sp-triangulation-header">
        <span className="sp-tri-badge">EXAMINER TRIANGULATION STRATEGY</span>
        <h3>Progressive Band Calibration (Part 1 Ceiling ➔ Part 2 Floor ➔ Part 3 Calibrated Exact)</h3>
      </div>
      <div className="sp-triangulation-grid">
        {stages.map(({ cls, stage, label, band, rationale }) => (
          <div key={cls} className={`sp-tri-card ${cls}`}>
            <div className="sp-tri-card-header">
              <span className="sp-tri-card-tag">{stage}</span>
              <span className="sp-tri-card-band">
                {label}: <strong>Band {Number(band || overallBand).toFixed(1)}</strong>
              </span>
            </div>
            <p>{formatFeedbackText(rationale)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpeakingTriangulationBanner;
