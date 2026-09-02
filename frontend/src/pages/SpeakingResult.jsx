import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getScoreColor } from '../utils/scoreColor';
import { downloadAudio } from '../utils/audioUtils';
import { SPEAKING_CATEGORY_META } from '../utils/speakingMeta';
import SpeakingResultPanels from '../components/SpeakingResultPanels';
import SpeakingTriangulationBanner from '../components/SpeakingTriangulationBanner';
import '../style/writingResult.css';
import '../style/speakingResult.css';

const BAND_COLOR = getScoreColor;

function SpeakingResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [activePanel, setActivePanel]       = useState('criteria');
  const [activeCategory, setActiveCategory] = useState('Fluency & Coherence');
  const [sampleScript, setSampleScript]     = useState('');
  const [sampleLoading, setSampleLoading]   = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);
        const feedback = res.data.feedback || {};
        if (feedback.sample_answer || feedback.sample_rewrite) {
          setSampleScript(feedback.sample_answer || feedback.sample_rewrite);
        }
        const availableCats = Object.keys(SPEAKING_CATEGORY_META).filter((cat) => feedback[cat]);
        if (availableCats.length > 0) setActiveCategory(availableCats[0]);
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
        skill: 'speaking', part_type: result.part_type, task_prompt: result.task_prompt, target_band: 8.5,
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

  const targetBand       = Number(result.feedback?.target_band ?? result.target_band ?? 7.0);
  const overallBand      = Number(result.overall_band ?? 7.0);
  const bandDifference   = overallBand - targetBand;
  const isTargetAchieved = overallBand >= targetBand;
  const feedback         = result.feedback || {};

  let questionsList = feedback.questions_data || [];
  if (questionsList.length === 0) {
    const rawPrompt = result.task_prompt || '';
    const lines     = rawPrompt.split('\n').filter((l) => l.trim().length > 0);
    const qLines    = lines.filter((l) => /^\d+\./.test(l.trim()) || l.includes('Describe '));
    if (qLines.length > 0) {
      questionsList = qLines.map((qText, idx) => ({
        id: `q_${idx + 1}`, title: `Question ${idx + 1}`,
        question: qText.replace(/^\d+\.\s*/, ''),
        audio_url: result.audio_path ? `http://localhost:5000${result.audio_path}` : null,
        transcript: feedback.transcript || '',
      }));
    } else {
      questionsList = [{
        id: 'q_1', title: 'Speaking Question',
        question: rawPrompt || 'IELTS Speaking Topic',
        audio_url: result.audio_path ? `http://localhost:5000${result.audio_path}` : null,
        transcript: feedback.transcript || '',
      }];
    }
  }

  const activeQuestion = questionsList[selectedQIndex] || questionsList[0] || {};

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

  const getActiveTranscript = () => {
    if (activeQuestion.transcript?.trim()) return activeQuestion.transcript;
    if (Array.isArray(feedback.questions_transcripts) && feedback.questions_transcripts.length > 0) {
      const matched = feedback.questions_transcripts.find((t) => t.question_number === selectedQIndex + 1)
        || feedback.questions_transcripts[selectedQIndex];
      if (matched?.transcript?.trim()) return matched.transcript;
    }
    if (feedback.transcript?.trim()) return feedback.transcript;
    if (result.user_input_text?.trim()) return result.user_input_text;
    return 'Chưa có bản ghi transcript cho câu hỏi này.';
  };

  const criteriaKeys = Object.keys(SPEAKING_CATEGORY_META).filter((cat) => feedback[cat]);
  const effectiveCategory = criteriaKeys.includes(activeCategory) ? activeCategory : criteriaKeys[0] || 'Fluency & Coherence';
  const activeFeedback  = feedback[effectiveCategory];
  const improvements    = feedback.improvements || [];
  const targetAnalysis  = feedback.target_band_analysis || {};

  const getSubScore = (cat) => {
    const key = SPEAKING_CATEGORY_META[cat]?.subKey;
    if (!key) return '—';
    return result.sub_scores?.[key] ?? feedback[cat]?.score ?? '—';
  };

  const isFullTestResult = result.part_type === 'Full Test' || (result.part_type || '').toLowerCase().includes('full');

  return (
    <div className="wr-page">
      {/* Top Bar */}
      <div className="wr-topbar">
        <Link to="/speaking" className="wr-back-btn">← Back to Speaking Hub</Link>
        <div className="wr-topbar-title">
          <span>IELTS Speaking Evaluation Report</span>
          <span className="wr-topbar-type">{result.part_type}</span>
        </div>
        <Link to="/history" className="wr-history-btn">📋 Submission History</Link>
      </div>

      {/* Target Band Banner */}
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

      {/* Triangulation Banner (Full Test Only) */}
      {isFullTestResult && (
        <SpeakingTriangulationBanner
          examinerBreakdown={feedback.examiner_strategy_breakdown}
          overallBand={overallBand}
        />
      )}

      {/* 56/44 Layout */}
      <div className="wr-layout">
        {/* LEFT: Question Navigator + Audio */}
        <div className="wr-left">
          <div className="wr-essay-card">
            <div className="wr-essay-label-bar">
              <span className="wr-essay-label">📌 Questions List ({questionsList.length})</span>
              <button type="button" className="sp-btn-speak-q" onClick={() => speakText(activeQuestion.question)} title="Play Examiner Voice">
                🔊 Listen to Question (Examiner Voice)
              </button>
            </div>
            <div className="sp-questions-vertical-list">
              {questionsList.map((item, idx) => (
                <div key={item.id || idx} className={`sp-q-vertical-item ${idx === selectedQIndex ? 'active' : ''}`} onClick={() => setSelectedQIndex(idx)}>
                  <div className="sp-q-item-left">
                    <span className="sp-q-index-circle">{idx + 1}</span>
                    <span className="sp-q-text">{item.question}</span>
                  </div>
                  <button type="button" className="sp-btn-detailed-analysis" onClick={(e) => { e.stopPropagation(); setSelectedQIndex(idx); }}>
                    Detailed analysis &gt;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="wr-essay-card wr-essay-answer">
            <div className="wr-essay-label">
              🎙️ Candidate Spoken Response & Recording (Question {selectedQIndex + 1})
            </div>
            <div className="sp-audio-player-wrapper">
              <div className="sp-audio-header">
                <span className="sp-audio-player-label">🎧 Candidate Audio Recording:</span>
                {getActiveAudioUrl() && (
                  <button type="button" className="sp-btn-download-audio"
                    onClick={() => downloadAudio(getActiveAudioUrl(), `Speaking_Result_Q${selectedQIndex + 1}.wav`)}
                    title="Download candidate recording">
                    📥 Download Recording
                  </button>
                )}
              </div>
              {getActiveAudioUrl() ? (
                <audio controls src={getActiveAudioUrl()} className="sp-audio-player-el" />
              ) : (
                <p className="sp-no-audio-text">No audio recording available for this question.</p>
              )}
            </div>
            <div className="sp-transcript-section">
              <span className="sp-transcript-label">📝 Speech Transcript:</span>
              <p className="wr-essay-text">{getActiveTranscript()}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Band Card + Panel */}
        <div className="wr-right">
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

          <div className="wr-panel-tabs">
            {[['criteria', '📊 Criteria'], ['improvements', '💡 Improvements'], ['rewrite', '🎙️ Model Script']].map(([panel, label]) => (
              <button key={panel} type="button" className={`wr-panel-tab ${activePanel === panel ? 'active' : ''}`} onClick={() => setActivePanel(panel)}>
                {label}
              </button>
            ))}
          </div>

          <SpeakingResultPanels
            activePanel={activePanel}
            criteriaKeys={criteriaKeys}
            effectiveCategory={effectiveCategory}
            activeFeedback={activeFeedback}
            improvements={improvements}
            sampleScript={sampleScript}
            sampleLoading={sampleLoading}
            SPEAKING_CATEGORY_META={SPEAKING_CATEGORY_META}
            getSubScore={getSubScore}
            setActiveCategory={setActiveCategory}
            handleGenerateSample={handleGenerateSample}
          />
        </div>
      </div>
    </div>
  );
}

export default SpeakingResult;
