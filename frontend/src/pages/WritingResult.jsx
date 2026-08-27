import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getScoreColor } from '../utils/scoreColor';

const CATEGORY_META = {
  'Task Achievement': {
    shortName: 'Task Achievement', subKey: 'TA', icon: '📊',
    description: 'Evaluates the candidate’s ability to summarize, select key features accurately, and present a clear overview of visual data.',
  },
  'Task Response': {
    shortName: 'Task Response', subKey: 'TR', icon: '🎓',
    description: 'Evaluates the candidate’s ability to address all parts of the prompt, establish a consistent stance, and develop well-supported arguments.',
  },
  'Coherence & Cohesion': {
    shortName: 'Coherence & Cohesion', subKey: 'CC', icon: '🔗',
    description: 'Evaluates logical paragraph structure, sequence of ideas, and the flexible use of cohesive devices and referencing.',
  },
  'Lexical Resource': {
    shortName: 'Lexical Resource', subKey: 'LR', icon: '✦',
    description: 'Evaluates lexical variety, academic vocabulary, precision, collocation, and spelling accuracy.',
  },
  'Grammatical Range & Accuracy': {
    shortName: 'Grammatical Range & Accuracy', subKey: 'GRA', icon: '📝',
    description: 'Evaluates the variety of sentence structures (complex clauses, passive voice) and control of grammatical accuracy and punctuation.',
  },
};

const BAND_COLOR = getScoreColor;

function WritingResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Full test view switcher: 'overview' | 'task1' | 'task2'
  const [fullTestView, setFullTestView] = useState('overview');

  // Sub panel: 'criteria' | 'improvements' | 'rewrite' | 'target'
  const [activePanel, setActivePanel] = useState('criteria');
  const [activeCategory, setActiveCategory] = useState('Task Response');

  // On-demand model essay generation state (Must be declared at top of component)
  const [generatedSamples, setGeneratedSamples] = useState({});
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);

        // Auto select first available category
        const feedback = res.data.feedback || {};
        const availableCats = Object.keys(CATEGORY_META).filter(cat => feedback[cat]);
        if (availableCats.length > 0) {
          setActiveCategory(availableCats[0]);
        } else if (res.data.part_type === 'Task 1') {
          setActiveCategory('Task Achievement');
        } else {
          setActiveCategory('Task Response');
        }
      } catch (err) {
        console.error(err);
        alert('Assessment result not found.');
        navigate('/writing');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="wr-loading">
        <div className="wr-loading-spinner" />
        <p>Loading assessment report...</p>
      </div>
    );
  }

  if (!result) return null;

  const isFullTest = result.part_type === 'Full Test';
  const targetBand = Number(result.feedback?.target_band ?? result.target_band ?? 7.0);
  const overallBand = Number(result.overall_band ?? 7.0);
  const bandDifference = overallBand - targetBand;
  const isTargetAchieved = overallBand >= targetBand;

  // Active data based on fullTestView
  const currentTaskData = (() => {
    if (!isFullTest) return result;
    if (fullTestView === 'task1') {
      return {
        part_type: 'Task 1',
        task_prompt: result.feedback?.task1_prompt || 'Task 1 Report',
        user_input_text: result.feedback?.task1_input || '',
        image_url: result.feedback?.task1_image || null,
        overall_band: result.feedback?.task1_feedback?.overall_band ?? result.sub_scores?.Task1_Overall ?? 7.0,
        sub_scores: result.feedback?.task1_feedback?.sub_scores ?? {},
        feedback: result.feedback?.task1_feedback ?? {},
      };
    }
    if (fullTestView === 'task2') {
      return {
        part_type: 'Task 2',
        task_prompt: result.feedback?.task2_prompt || 'Task 2 Essay',
        user_input_text: result.feedback?.task2_input || '',
        image_url: null,
        overall_band: result.feedback?.task2_feedback?.overall_band ?? result.sub_scores?.Task2_Overall ?? 7.0,
        sub_scores: result.feedback?.task2_feedback?.sub_scores ?? {},
        feedback: result.feedback?.task2_feedback ?? {},
      };
    }
    return result;
  })();

  const criteriaKeys = Object.keys(CATEGORY_META).filter(
    (cat) => currentTaskData.feedback?.[cat]
  );
  const effectiveCategory = criteriaKeys.includes(activeCategory)
    ? activeCategory
    : criteriaKeys[0] || (currentTaskData.part_type === 'Task 1' ? 'Task Achievement' : 'Task Response');

  const activeFeedback = currentTaskData.feedback?.[effectiveCategory];
  const improvements = currentTaskData.feedback?.improvements ?? result.feedback?.improvements ?? [];
  const sampleRewrite = currentTaskData.feedback?.sample_rewrite ?? result.feedback?.sample_rewrite ?? '';
  const targetAnalysis = result.feedback?.target_band_analysis ?? {};

  const sampleKey = isFullTest ? fullTestView : 'main';
  const effectiveSampleRewrite = generatedSamples[sampleKey] || currentTaskData.feedback?.sample_rewrite || (isFullTest ? (fullTestView === 'task1' ? result.feedback?.task1_feedback?.sample_rewrite : fullTestView === 'task2' ? result.feedback?.task2_feedback?.sample_rewrite : result.feedback?.sample_rewrite) : result.feedback?.sample_rewrite) || '';

  const handleGenerateSample = async () => {
    setSampleLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/assessments/${id}/generate-sample`, {
        part_type: currentTaskData.part_type,
        task_prompt: currentTaskData.task_prompt,
        user_input_text: currentTaskData.user_input_text,
        image_url: currentTaskData.image_url,
        target_band: targetBand,
      });

      if (res.data?.sample_rewrite) {
        setGeneratedSamples(prev => ({
          ...prev,
          [sampleKey]: res.data.sample_rewrite,
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate model essay. Please try again.');
    } finally {
      setSampleLoading(false);
    }
  };

  const getSubScore = (cat) => {
    const key = CATEGORY_META[cat]?.subKey;
    if (!key) return '—';
    return currentTaskData.sub_scores?.[key] ?? currentTaskData.feedback?.[cat]?.score ?? result.sub_scores?.[key] ?? '—';
  };

  return (
    <div className="wr-page">
      {/* ── Top Bar ── */}
      <div className="wr-topbar">
        <Link to="/writing" className="wr-back-btn">← Back to Writing Hub</Link>
        <div className="wr-topbar-title">
          <span>IELTS Writing Evaluation Report</span>
          <span className="wr-topbar-type">{result.part_type}</span>
        </div>
        <Link to="/history" className="wr-history-btn">📋 Submission History</Link>
      </div>

      {/* ── Target Band Comparison Banner ── */}
      <div className={`wr-target-banner ${isTargetAchieved ? 'achieved' : 'gap'}`}>
        <div className="wr-target-banner-left">
          <div className="wr-target-pill">🎯 Target: Band {targetBand.toFixed(1)}</div>
          <div className="wr-target-score-text">
            Overall Band: <strong style={{ color: BAND_COLOR(overallBand) }}>{overallBand.toFixed(1)}</strong>
          </div>
          <div className="wr-target-status-badge">
            {isTargetAchieved
              ? `🎉 Goal Met (+${bandDifference.toFixed(1)} band)`
              : `⚠️ ${Math.abs(bandDifference).toFixed(1)} Band Away from Target`}
          </div>
        </div>
        <div className="wr-target-banner-right">
          <p className="wr-target-summary">
            {targetAnalysis.summary ||
              `AI benchmarked your response against the official Band ${targetBand.toFixed(1)} descriptors in the IELTS Rubric.`}
          </p>
        </div>
      </div>

      {/* ── Full Test Sub Navigation (if Full Test) ── */}
      {isFullTest && (
        <div className="wr-fulltest-tabs">
          <button
            className={`wr-ft-tab ${fullTestView === 'overview' ? 'active' : ''}`}
            onClick={() => setFullTestView('overview')}
          >
            🌟 Full Test Overview (Band {overallBand})
          </button>
          <button
            className={`wr-ft-tab ${fullTestView === 'task1' ? 'active' : ''}`}
            onClick={() => {
              setFullTestView('task1');
              setActiveCategory('Task Achievement');
            }}
          >
            📊 Task 1 Breakdown (Band {result.sub_scores?.Task1_Overall ?? '—'})
          </button>
          <button
            className={`wr-ft-tab ${fullTestView === 'task2' ? 'active' : ''}`}
            onClick={() => {
              setFullTestView('task2');
              setActiveCategory('Task Response');
            }}
          >
            ✍️ Task 2 Breakdown (Band {result.sub_scores?.Task2_Overall ?? '—'})
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* VIEW: FULL TEST OVERVIEW SUMMARY           */}
      {/* ────────────────────────────────────────── */}
      {isFullTest && fullTestView === 'overview' && (
        <div className="wr-ft-overview-card">
          <div className="wr-ft-score-cards">
            <div className="wr-ft-card main" style={{ borderColor: BAND_COLOR(overallBand) }}>
              <div className="wr-ft-val" style={{ color: BAND_COLOR(overallBand) }}>{overallBand.toFixed(1)}</div>
              <div className="wr-ft-lbl">Overall Writing Band</div>
              <div className="wr-ft-sub">Formula: (Task 1 × 1 + Task 2 × 2) ÷ 3</div>
            </div>

            <div className="wr-ft-card" onClick={() => { setFullTestView('task1'); setActiveCategory('Task Achievement'); }}>
              <div className="wr-ft-val" style={{ color: BAND_COLOR(result.sub_scores?.Task1_Overall) }}>
                {result.sub_scores?.Task1_Overall ?? '—'}
              </div>
              <div className="wr-ft-lbl">Task 1 (Report)</div>
              <div className="wr-ft-link">View Task 1 Details →</div>
            </div>

            <div className="wr-ft-card" onClick={() => { setFullTestView('task2'); setActiveCategory('Task Response'); }}>
              <div className="wr-ft-val" style={{ color: BAND_COLOR(result.sub_scores?.Task2_Overall) }}>
                {result.sub_scores?.Task2_Overall ?? '—'}
              </div>
              <div className="wr-ft-lbl">Task 2 (Essay)</div>
              <div className="wr-ft-link">View Task 2 Details →</div>
            </div>
          </div>

          {/* Strengths & Key Gaps */}
          <div className="wr-analysis-grid">
            {targetAnalysis.strengths?.length > 0 && (
              <div className="wr-analysis-box strengths">
                <h4>✅ Key Strengths Relative to Target Band {targetBand.toFixed(1)}:</h4>
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
      )}

      {/* ────────────────────────────────────────── */}
      {/* 56/44 SPLIT LAYOUT (Single Task / Task Detail) */}
      {/* ────────────────────────────────────────── */}
      {(!isFullTest || fullTestView !== 'overview') && (
        <div className="wr-layout">
          
          {/* LEFT 56%: Prompt & User Submission */}
          <div className="wr-left">
            <div className="wr-essay-card">
              <div className="wr-essay-label">
                📌 Task Prompt ({currentTaskData.part_type})
              </div>
              <p className="wr-task-prompt">{currentTaskData.task_prompt}</p>

              {currentTaskData.image_url && (
                <div className="wr-chart-preview">
                  <img src={currentTaskData.image_url} alt="Task 1 Chart" />
                </div>
              )}
            </div>

            <div className="wr-essay-card wr-essay-answer">
              <div className="wr-essay-label">✍️ Candidate Response</div>
              <p className="wr-essay-text">{currentTaskData.user_input_text || '(No response text provided)'}</p>
            </div>
          </div>

          {/* RIGHT 44%: Scoring Panel */}
          <div className="wr-right">
            
            {/* Band Card */}
            <div className="wr-band-card" style={{ borderColor: BAND_COLOR(currentTaskData.overall_band) }}>
              <div className="wr-band-value" style={{ color: BAND_COLOR(currentTaskData.overall_band) }}>
                {Number(currentTaskData.overall_band).toFixed(1)}
              </div>
              <div className="wr-band-label">
                {isFullTest ? `${currentTaskData.part_type} Band` : 'Overall Band'}
              </div>
              <div className="wr-sub-scores">
                {criteriaKeys.map((cat) => (
                  <div key={cat} className="wr-sub-score-item">
                    <span className="wr-sub-score-name">{CATEGORY_META[cat]?.shortName || cat}</span>
                    <span className="wr-sub-score-val" style={{ color: BAND_COLOR(getSubScore(cat)) }}>
                      {getSubScore(cat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Tabs */}
            <div className="wr-panel-tabs">
              <button
                className={`wr-panel-tab ${activePanel === 'criteria' ? 'active' : ''}`}
                onClick={() => setActivePanel('criteria')}
              >
                📊 Criteria
              </button>
              <button
                className={`wr-panel-tab ${activePanel === 'improvements' ? 'active' : ''}`}
                onClick={() => setActivePanel('improvements')}
              >
                💡 Improvements
              </button>
              <button
                className={`wr-panel-tab ${activePanel === 'rewrite' ? 'active' : ''}`}
                onClick={() => setActivePanel('rewrite')}
              >
                ✍️ Model Rewrite
              </button>
            </div>

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
                        <span className="wr-cat-tab-score" style={{ color: BAND_COLOR(score) }}>
                          {score}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="wr-cat-desc">
                  {CATEGORY_META[effectiveCategory]?.description}
                </div>

                {/* Sub-criteria details */}
                <div className="wr-subcriteria">
                  {activeFeedback && typeof activeFeedback === 'object' ? (
                    Object.entries(activeFeedback).map(([name, details]) => {
                      if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
                      const score = details.score ?? details.band ?? details.Score;
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
                          <p className="wr-subcriterion-comment">{comment}</p>
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
                        {typeof imp === 'string' ? imp : imp.content}
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
                      <button
                        type="button"
                        className="wr-btn-regenerate-sample"
                        onClick={handleGenerateSample}
                        disabled={sampleLoading}
                      >
                        {sampleLoading ? '⏳ Regenerating...' : '🔄 Regenerate Model Essay'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="wr-generate-sample-box">
                    <div className="wr-generate-sample-icon">✍️</div>
                    <div className="wr-generate-sample-title">Band 8.5+ Model {currentTaskData.part_type === 'Task 1' ? 'Report' : 'Essay'}</div>
                    <p className="wr-generate-sample-desc">
                      Generate an expert, high-scoring model response benchmarked against Band 8.5+ criteria using your current task prompt.
                    </p>
                    <button
                      type="button"
                      className="wr-btn-generate-sample"
                      onClick={handleGenerateSample}
                      disabled={sampleLoading}
                    >
                      {sampleLoading ? '⏳ Generating Model Essay...' : '✨ Generate Model Essay (Tạo bài viết mẫu)'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default WritingResult;
