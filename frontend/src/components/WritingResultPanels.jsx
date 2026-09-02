import React from 'react';
import { formatFeedbackText } from '../utils/feedbackFormatter';
import { getScoreColor } from '../utils/scoreColor';

const BAND_COLOR = getScoreColor;

/**
 * WritingResultPanels — renders the criteria/improvements/sample-rewrite panels
 * for the right column of WritingResult.
 */
function WritingResultPanels({
  activePanel,
  criteriaKeys,
  effectiveCategory,
  activeFeedback,
  improvements,
  effectiveSampleRewrite,
  sampleLoading,
  currentTaskData,
  CATEGORY_META,
  getSubScore,
  setActiveCategory,
  handleGenerateSample,
}) {
  return (
    <>
      {/* PANEL: CRITERIA */}
      {activePanel === 'criteria' && (
        <div className="wr-criteria-panel">
          <div className="wr-cat-tabs">
            {criteriaKeys.map((cat) => {
              const score = getSubScore(cat);
              return (
                <button
                  key={cat}
                  className={`wr-cat-tab ${effectiveCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  title={cat}
                >
                  <span className="wr-cat-tab-title">{CATEGORY_META[cat]?.icon} {CATEGORY_META[cat]?.subKey || cat}</span>
                  <span className="wr-cat-tab-score" style={{ color: BAND_COLOR(score) }}>{score}</span>
                </button>
              );
            })}
          </div>

          <div className="wr-cat-desc">{CATEGORY_META[effectiveCategory]?.description}</div>

          <div className="wr-subcriteria">
            {activeFeedback && typeof activeFeedback === 'object' ? (
              Object.entries(activeFeedback).map(([name, details]) => {
                if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
                const score   = details.score ?? details.band ?? details.Score;
                const comment = details.comment ?? details.feedback ?? details.Comment ?? '';
                if (score === undefined) return null;
                return (
                  <div key={name} className="wr-subcriterion">
                    <div className="wr-subcriterion-header">
                      <span className="wr-subcriterion-name">{name}</span>
                      <span className="wr-subcriterion-score" style={{ color: BAND_COLOR(score) }}>
                        {Number(score).toFixed(1)}
                      </span>
                    </div>
                    <p className="wr-subcriterion-comment">{formatFeedbackText(comment)}</p>
                  </div>
                );
              })
            ) : (
              <p className="wr-empty">No criteria data available.</p>
            )}
          </div>
        </div>
      )}

      {/* PANEL: IMPROVEMENTS */}
      {activePanel === 'improvements' && (
        <div className="wr-improvements-panel">
          {improvements.length > 0 ? (
            improvements.map((imp, i) => (
              <div key={i} className="wr-improvement">
                <div className="wr-improvement-title">
                  💡 {typeof imp === 'string' ? `Tip ${i + 1}` : imp.title}
                </div>
                <p className="wr-improvement-content">
                  {formatFeedbackText(typeof imp === 'string' ? imp : imp.content)}
                </p>
              </div>
            ))
          ) : (
            <p className="wr-empty">No action items available.</p>
          )}
        </div>
      )}

      {/* PANEL: SAMPLE REWRITE */}
      {activePanel === 'rewrite' && (
        <div className="wr-rewrite-panel">
          {effectiveSampleRewrite ? (
            <div className="wr-rewrite-content">
              <p className="wr-rewrite-text">{effectiveSampleRewrite}</p>
              <div className="wr-rewrite-footer-actions">
                <button type="button" className="wr-btn-regenerate-sample" onClick={handleGenerateSample} disabled={sampleLoading}>
                  {sampleLoading ? '⏳ Regenerating...' : '🔄 Regenerate Model Essay'}
                </button>
              </div>
            </div>
          ) : (
            <div className="wr-generate-sample-box">
              <div className="wr-generate-sample-icon">✍️</div>
              <div className="wr-generate-sample-title">
                Band 8.5+ Model {currentTaskData?.part_type === 'Task 1' ? 'Report' : 'Essay'}
              </div>
              <p className="wr-generate-sample-desc">
                Generate an expert, high-scoring model response benchmarked against Band 8.5+ criteria using your current task prompt.
              </p>
              <button type="button" className="wr-btn-generate-sample" onClick={handleGenerateSample} disabled={sampleLoading}>
                {sampleLoading ? '⏳ Generating Model Essay...' : '✨ Generate Model Essay (Tạo bài viết mẫu)'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default WritingResultPanels;
