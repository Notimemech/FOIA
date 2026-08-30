import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getScoreColor } from '../utils/scoreColor';
import '../style/writingResult.css';
import '../style/speakingResult.css';

const SPEAKING_CATEGORY_META = {
  'Fluency & Coherence': {
    shortName: 'Fluency & Coherence',
    subKey: 'FC',
    icon: '🎙️',
    description: 'Evaluates speech rate, continuity, natural pauses, use of discourse markers, and topic development without excessive hesitation.',
  },
  'Lexical Resource': {
    shortName: 'Lexical Resource',
    subKey: 'LR',
    icon: '✦',
    description: 'Evaluates vocabulary range, idiomatic phrasing, precision of word choice, collocations, and paraphrasing flexibility.',
  },
  'Pronunciation': {
    shortName: 'Pronunciation',
    subKey: 'PR',
    icon: '🔊',
    description: 'Evaluates clarity of phonemes, sentence stress, rhythm, intonation patterns, and connected speech chunking.',
  },
  'Grammatical Range & Accuracy': {
    shortName: 'Grammatical Range & Accuracy',
    subKey: 'GRA',
    icon: '📝',
    description: 'Evaluates sentence structure variety, use of complex grammatical forms, and grammatical accuracy.',
  },
};

const BAND_COLOR = getScoreColor;

function SpeakingResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected question index for per-question transcript and audio
  const [selectedQIndex, setSelectedQIndex] = useState(0);

  // Sub panel: 'criteria' | 'improvements' | 'rewrite' | 'target'
  const [activePanel, setActivePanel] = useState('criteria');
  const [activeCategory, setActiveCategory] = useState('Fluency & Coherence');

  // On-demand model script generation state
  const [sampleScript, setSampleScript] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);

        const feedback = res.data.feedback || {};
        if (feedback.sample_answer || feedback.sample_rewrite) {
          setSampleScript(feedback.sample_answer || feedback.sample_rewrite);
        }

        // Auto select first available category
        const availableCats = Object.keys(SPEAKING_CATEGORY_META).filter((cat) => feedback[cat]);
        if (availableCats.length > 0) {
          setActiveCategory(availableCats[0]);
        }
      } catch (err) {
        console.error(err);
        alert('Assessment result not found.');
        navigate('/speaking');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id, navigate]);

  // Text-To-Speech Examiner Voice Function
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateSample = async () => {
    setSampleLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/assessments/${id}/generate-sample`, {
        skill: 'speaking',
        part_type: result.part_type,
        task_prompt: result.task_prompt,
        target_band: 8.5,
      });

      if (res.data?.sample_answer || res.data?.sample_rewrite) {
        setSampleScript(res.data.sample_answer || res.data.sample_rewrite);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate model speaking response.');
    } finally {
      setSampleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="wr-loading">
        <div className="wr-loading-spinner" />
        <p>Loading Speaking assessment report...</p>
      </div>
    );
  }

  if (!result) return null;

  const targetBand = Number(result.feedback?.target_band ?? result.target_band ?? 7.0);
  const overallBand = Number(result.overall_band ?? 7.0);
  const bandDifference = overallBand - targetBand;
  const isTargetAchieved = overallBand >= targetBand;
  const feedback = result.feedback || {};

  // Build questions list
  let questionsList = feedback.questions_data || [];
  if (questionsList.length === 0) {
    const rawPrompt = result.task_prompt || '';
    const lines = rawPrompt.split('\n').filter((l) => l.trim().length > 0);
    const qLines = lines.filter((l) => /^\d+\./.test(l.trim()) || l.includes('Describe '));
    if (qLines.length > 0) {
      questionsList = qLines.map((qText, idx) => ({
        id: `q_${idx + 1}`,
        title: `Question ${idx + 1}`,
        question: qText.replace(/^\d+\.\s*/, ''),
        audio_url: result.audio_path ? `http://localhost:5000${result.audio_path}` : null,
        transcript: feedback.transcript || '',
      }));
    } else {
      questionsList = [
        {
          id: 'q_1',
          title: 'Speaking Question',
          question: rawPrompt || 'IELTS Speaking Topic',
          audio_url: result.audio_path ? `http://localhost:5000${result.audio_path}` : null,
          transcript: feedback.transcript || '',
        },
      ];
    }
  }

  const activeQuestion = questionsList[selectedQIndex] || questionsList[0] || {};

  // Formatted audio URL for currently selected question
  const getActiveAudioUrl = () => {
    if (activeQuestion.audio_url) {
      return activeQuestion.audio_url.startsWith('http')
        ? activeQuestion.audio_url
        : `http://localhost:5000${activeQuestion.audio_url}`;
    }
    if (result.audio_path) {
      return result.audio_path.startsWith('http')
        ? result.audio_path
        : `http://localhost:5000${result.audio_path}`;
    }
    return null;
  };

  // Get active question transcript
  const getActiveTranscript = () => {
    if (activeQuestion.transcript && activeQuestion.transcript.trim()) {
      return activeQuestion.transcript;
    }
    if (Array.isArray(feedback.questions_transcripts) && feedback.questions_transcripts.length > 0) {
      const matched = feedback.questions_transcripts.find(
        (t) => t.question_number === selectedQIndex + 1
      ) || feedback.questions_transcripts[selectedQIndex];
      if (matched?.transcript && matched.transcript.trim()) {
        return matched.transcript;
      }
    }
    if (feedback.transcript && feedback.transcript.trim()) {
      return feedback.transcript;
    }
    if (result.user_input_text && result.user_input_text.trim()) {
      return result.user_input_text;
    }
    return 'Chưa có bản ghi transcript cho câu hỏi này.';
  };

  const criteriaKeys = Object.keys(SPEAKING_CATEGORY_META).filter(
    (cat) => feedback[cat]
  );
  const effectiveCategory = criteriaKeys.includes(activeCategory)
    ? activeCategory
    : criteriaKeys[0] || 'Fluency & Coherence';

  const activeFeedback = feedback[effectiveCategory];
  const improvements = feedback.improvements || [];
  const targetAnalysis = feedback.target_band_analysis || {};

  const getSubScore = (cat) => {
    const key = SPEAKING_CATEGORY_META[cat]?.subKey;
    if (!key) return '—';
    return result.sub_scores?.[key] ?? feedback[cat]?.score ?? '—';
  };

  return (
    <div className="wr-page">
      {/* ── Top Bar ── */}
      <div className="wr-topbar">
        <Link to="/speaking" className="wr-back-btn">
          ← Back to Speaking Hub
        </Link>
        <div className="wr-topbar-title">
          <span>IELTS Speaking Evaluation Report</span>
          <span className="wr-topbar-type">{result.part_type}</span>
        </div>
        <Link to="/history" className="wr-history-btn">
          📋 Submission History
        </Link>
      </div>

      {/* ── Target Band Comparison Banner ── */}
      <div className={`wr-target-banner ${isTargetAchieved ? 'achieved' : 'gap'}`}>
        <div className="wr-target-banner-left">
          <div className="wr-target-pill">🎯 Target: Band {targetBand.toFixed(1)}</div>
          <div className="wr-target-score-text">
            Overall Speaking Band: <strong style={{ color: BAND_COLOR(overallBand) }}>{overallBand.toFixed(1)}</strong>
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
              `AI benchmarked your spoken responses against the official Band ${targetBand.toFixed(1)} descriptors in the IELTS Speaking Rubric.`}
          </p>
        </div>
      </div>

      {/* ── Examiner Triangulation Strategy Banner ── */}
      {feedback.examiner_strategy_breakdown && (
        <div className="sp-triangulation-banner">
          <div className="sp-triangulation-header">
            <span className="sp-tri-badge">EXAMINER TRIANGULATION STRATEGY</span>
            <h3>Progressive Band Calibration (Part 1 Ceiling ➔ Part 2 Floor ➔ Part 3 Calibrated Exact)</h3>
          </div>
          <div className="sp-triangulation-grid">
            <div className="sp-tri-card ceiling">
              <div className="sp-tri-card-header">
                <span className="sp-tri-card-tag">Stage 1: Part 1</span>
                <span className="sp-tri-card-band">
                  Ceiling (Max): <strong>Band {Number(feedback.examiner_strategy_breakdown.part1_ceiling_band || overallBand).toFixed(1)}</strong>
                </span>
              </div>
              <p>{feedback.examiner_strategy_breakdown.part1_ceiling_rationale}</p>
            </div>

            <div className="sp-tri-card floor">
              <div className="sp-tri-card-header">
                <span className="sp-tri-card-tag">Stage 2: Part 2</span>
                <span className="sp-tri-card-band">
                  Floor (Min): <strong>Band {Number(feedback.examiner_strategy_breakdown.part2_floor_band || Math.max(0, overallBand - 0.5)).toFixed(1)}</strong>
                </span>
              </div>
              <p>{feedback.examiner_strategy_breakdown.part2_floor_rationale}</p>
            </div>

            <div className="sp-tri-card calibration">
              <div className="sp-tri-card-header">
                <span className="sp-tri-card-tag">Stage 3: Part 3 / Final</span>
                <span className="sp-tri-card-band">
                  Calibrated Exact: <strong>Band {Number(feedback.examiner_strategy_breakdown.part3_calibration_band || overallBand).toFixed(1)}</strong>
                </span>
              </div>
              <p>{feedback.examiner_strategy_breakdown.part3_calibration_rationale}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 56/44 SPLIT LAYOUT ── */}
      <div className="wr-layout">
        
        {/* ========================================================= */}
        {/* LEFT 56%: Question Navigator & Spoken Response Recording */}
        {/* ========================================================= */}
        <div className="wr-left">
          
          {/* Question Selector Card */}
          <div className="wr-essay-card">
            <div className="wr-essay-label-bar">
              <span className="wr-essay-label">📌 Questions List ({questionsList.length})</span>
              <button
                type="button"
                className="sp-btn-speak-q"
                onClick={() => speakText(activeQuestion.question)}
                title="Play Examiner Voice"
              >
                🔊 Listen to Question (Examiner Voice)
              </button>
            </div>

            {/* Vertical Questions List */}
            <div className="sp-questions-vertical-list">
              {questionsList.map((item, idx) => {
                const isSelected = idx === selectedQIndex;
                return (
                  <div
                    key={item.id || idx}
                    className={`sp-q-vertical-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedQIndex(idx)}
                  >
                    <div className="sp-q-item-left">
                      <span className="sp-q-index-circle">{idx + 1}</span>
                      <span className="sp-q-text">{item.question}</span>
                    </div>
                    <button
                      type="button"
                      className="sp-btn-detailed-analysis"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQIndex(idx);
                      }}
                    >
                      Detailed analysis &gt;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidate Response Audio & Transcript */}
          <div className="wr-essay-card wr-essay-answer">
            <div className="wr-essay-label">
              🎙️ Candidate Spoken Response & Recording (Question {selectedQIndex + 1})
            </div>

            {/* Audio Playback Player */}
            <div className="sp-audio-player-wrapper">
              <span className="sp-audio-player-label">🎧 Candidate Audio Recording:</span>
              {getActiveAudioUrl() ? (
                <audio controls src={getActiveAudioUrl()} className="sp-audio-player-el" />
              ) : (
                <p className="sp-no-audio-text">No audio recording available for this question.</p>
              )}
            </div>

            {/* Spoken Transcript */}
            <div className="sp-transcript-section">
              <span className="sp-transcript-label">📝 Speech Transcript:</span>
              <p className="wr-essay-text">{getActiveTranscript()}</p>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT 44%: Band Card & Scoring Rubric Panel               */}
        {/* ========================================================= */}
        <div className="wr-right">
          
          {/* Band Score Card */}
          <div className="wr-band-card" style={{ borderColor: BAND_COLOR(overallBand) }}>
            <div className="wr-band-value" style={{ color: BAND_COLOR(overallBand) }}>
              {Number(overallBand).toFixed(1)}
            </div>
            <div className="wr-band-label">Overall Speaking Band</div>
            
            <div className="wr-sub-scores">
              {Object.keys(SPEAKING_CATEGORY_META).map((cat) => (
                <div key={cat} className="wr-sub-score-item">
                  <span className="wr-sub-score-name">
                    {SPEAKING_CATEGORY_META[cat]?.icon} {SPEAKING_CATEGORY_META[cat]?.subKey || cat}
                  </span>
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
              type="button"
              className={`wr-panel-tab ${activePanel === 'criteria' ? 'active' : ''}`}
              onClick={() => setActivePanel('criteria')}
            >
              📊 Criteria
            </button>
            <button
              type="button"
              className={`wr-panel-tab ${activePanel === 'improvements' ? 'active' : ''}`}
              onClick={() => setActivePanel('improvements')}
            >
              💡 Improvements
            </button>
            <button
              type="button"
              className={`wr-panel-tab ${activePanel === 'rewrite' ? 'active' : ''}`}
              onClick={() => setActivePanel('rewrite')}
            >
              🎙️ Model Script
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
                      type="button"
                      className={`wr-cat-tab ${effectiveCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                      title={cat}
                    >
                      <span className="wr-cat-tab-title">
                        {SPEAKING_CATEGORY_META[cat]?.icon} {SPEAKING_CATEGORY_META[cat]?.subKey || cat}
                      </span>
                      <span className="wr-cat-tab-score" style={{ color: BAND_COLOR(score) }}>
                        {score}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="wr-cat-desc">
                {SPEAKING_CATEGORY_META[effectiveCategory]?.description}
              </div>

              {/* Sub-criteria breakdown */}
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
                  <p className="wr-empty">No criteria evaluation data available.</p>
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

          {/* PANEL: MODEL SPOKEN SCRIPT */}
          {activePanel === 'rewrite' && (
            <div className="wr-rewrite-panel">
              {sampleScript ? (
                <div className="wr-rewrite-content">
                  <p className="wr-rewrite-text">{sampleScript}</p>
                  <div className="wr-rewrite-footer-actions">
                    <button
                      type="button"
                      className="wr-btn-regenerate-sample"
                      onClick={handleGenerateSample}
                      disabled={sampleLoading}
                    >
                      {sampleLoading ? '⏳ Regenerating...' : '🔄 Regenerate Model Script'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="wr-generate-sample-box">
                  <div className="wr-generate-sample-icon">🎙️</div>
                  <div className="wr-generate-sample-title">Band 8.5+ Model Spoken Response</div>
                  <p className="wr-generate-sample-desc">
                    Generate an expert, native-level spoken script demonstrating idiomatic language and natural discourse markers for this topic.
                  </p>
                  <button
                    type="button"
                    className="wr-btn-generate-sample"
                    onClick={handleGenerateSample}
                    disabled={sampleLoading}
                  >
                    {sampleLoading ? '⏳ Generating Script...' : '✨ Generate Band 8.5+ Model Script'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default SpeakingResult;
