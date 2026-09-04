import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAssessmentById, generateSample } from '../services/api';
import { getScoreColor } from '../utils/scoreColor';
import { formatFeedbackText } from '../utils/feedbackFormatter';
import WritingResultPanels from '../components/WritingResultPanels';
import WritingFullTestOverviewCard from '../components/WritingFullTestOverviewCard';
import '../style/writingResult.css';

const CATEGORY_META = {
  'Task Achievement': {
    shortName: 'Task Achievement', subKey: 'TA', icon: '📊',
    description: "Evaluates the candidate's ability to summarize, select key features accurately, and present a clear overview of visual data.",
  },
  'Task Response': {
    shortName: 'Task Response', subKey: 'TR', icon: '🎓',
    description: "Evaluates the candidate's ability to address all parts of the prompt, establish a consistent stance, and develop well-supported arguments.",
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
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullTestView, setFullTestView] = useState('overview');
  const [activePanel, setActivePanel]   = useState('criteria');
  const [activeCategory, setActiveCategory] = useState('Task Response');
  const [generatedSamples, setGeneratedSamples] = useState({});
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAssessmentById(id);
        setResult(res.data);
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

  const isFullTest       = result.part_type === 'Full Test';
  const targetBand       = Number(result.feedback?.target_band ?? result.target_band ?? 7.0);
  const overallBand      = Number(result.overall_band ?? 7.0);
  const bandDifference   = overallBand - targetBand;
  const isTargetAchieved = overallBand >= targetBand;

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

  const criteriaKeys = Object.keys(CATEGORY_META).filter((cat) => currentTaskData.feedback?.[cat]);
  const effectiveCategory = criteriaKeys.includes(activeCategory)
    ? activeCategory
    : criteriaKeys[0] || (currentTaskData.part_type === 'Task 1' ? 'Task Achievement' : 'Task Response');

  const activeFeedback  = currentTaskData.feedback?.[effectiveCategory];
  const improvements    = currentTaskData.feedback?.improvements ?? result.feedback?.improvements ?? [];
  const targetAnalysis  = result.feedback?.target_band_analysis ?? {};
  const sampleKey = isFullTest ? fullTestView : 'main';
  const effectiveSampleRewrite = generatedSamples[sampleKey]
    || currentTaskData.feedback?.sample_rewrite
    || (isFullTest
      ? (fullTestView === 'task1' ? result.feedback?.task1_feedback?.sample_rewrite
        : fullTestView === 'task2' ? result.feedback?.task2_feedback?.sample_rewrite
        : result.feedback?.sample_rewrite)
      : result.feedback?.sample_rewrite)
    || '';

  const handleGenerateSample = async () => {
    setSampleLoading(true);
    try {
      const res = await generateSample(id, {
        part_type: currentTaskData.part_type,
        task_prompt: currentTaskData.task_prompt,
        user_input_text: currentTaskData.user_input_text,
        image_url: currentTaskData.image_url,
        target_band: targetBand,
      });
      if (res.data?.sample_rewrite) {
        setGeneratedSamples(prev => ({ ...prev, [sampleKey]: res.data.sample_rewrite }));
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
      {/* Top Bar */}
      <div className="wr-topbar">
        <Link to="/writing" className="wr-back-btn">← Back to Writing Hub</Link>
        <div className="wr-topbar-title">
          <span>IELTS Writing Evaluation Report</span>
          <span className="wr-topbar-type">{result.part_type}</span>
        </div>
        <Link to="/history" className="wr-history-btn">📋 Submission History</Link>
      </div>

      {/* Target Band Banner */}
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
            {formatFeedbackText(targetAnalysis.summary ||
              `AI benchmarked your response against the official Band ${targetBand.toFixed(1)} descriptors in the IELTS Rubric.`)}
          </p>
        </div>
      </div>

      {/* Full Test Sub Navigation */}
      {isFullTest && (
        <div className="wr-fulltest-tabs">
          {[
            ['overview', `🌟 Full Test Overview (Band ${overallBand})`],
            ['task1',    `📊 Task 1 Breakdown (Band ${result.sub_scores?.Task1_Overall ?? '—'})`],
            ['task2',    `✍️ Task 2 Breakdown (Band ${result.sub_scores?.Task2_Overall ?? '—'})`],
          ].map(([view, label]) => (
            <button key={view} className={`wr-ft-tab ${fullTestView === view ? 'active' : ''}`}
              onClick={() => {
                setFullTestView(view);
                if (view === 'task1') setActiveCategory('Task Achievement');
                if (view === 'task2') setActiveCategory('Task Response');
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Full Test Overview */}
      {isFullTest && fullTestView === 'overview' && (
        <WritingFullTestOverviewCard
          overallBand={overallBand}
          targetBand={targetBand}
          task1Overall={result.sub_scores?.Task1_Overall}
          task2Overall={result.sub_scores?.Task2_Overall}
          targetAnalysis={targetAnalysis}
          onSelectTask1={() => {
            setFullTestView('task1');
            setActiveCategory('Task Achievement');
          }}
          onSelectTask2={() => {
            setFullTestView('task2');
            setActiveCategory('Task Response');
          }}
        />
      )}

      {/* 56/44 Split Layout */}
      {(!isFullTest || fullTestView !== 'overview') && (
        <div className="wr-layout">
          {/* LEFT: Prompt + Response */}
          <div className="wr-left">
            <div className="wr-essay-card">
              <div className="wr-essay-label">📌 Task Prompt ({currentTaskData.part_type})</div>
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

          {/* RIGHT: Scoring Panel */}
          <div className="wr-right">
            <div className="wr-band-card" style={{ borderColor: BAND_COLOR(currentTaskData.overall_band) }}>
              <div className="wr-band-value" style={{ color: BAND_COLOR(currentTaskData.overall_band) }}>
                {Number(currentTaskData.overall_band).toFixed(1)}
              </div>
              <div className="wr-band-label">{isFullTest ? `${currentTaskData.part_type} Band` : 'Overall Band'}</div>
              <div className="wr-sub-scores">
                {criteriaKeys.map((cat) => (
                  <div key={cat} className="wr-sub-score-item">
                    <span className="wr-sub-score-name">{CATEGORY_META[cat]?.shortName || cat}</span>
                    <span className="wr-sub-score-val" style={{ color: BAND_COLOR(getSubScore(cat)) }}>{getSubScore(cat)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="wr-panel-tabs">
              {[['criteria', '📊 Criteria'], ['improvements', '💡 Improvements'], ['rewrite', '✍️ Model Rewrite']].map(([panel, label]) => (
                <button key={panel} className={`wr-panel-tab ${activePanel === panel ? 'active' : ''}`} onClick={() => setActivePanel(panel)}>
                  {label}
                </button>
              ))}
            </div>

            <WritingResultPanels
              activePanel={activePanel}
              criteriaKeys={criteriaKeys}
              effectiveCategory={effectiveCategory}
              activeFeedback={activeFeedback}
              improvements={improvements}
              effectiveSampleRewrite={effectiveSampleRewrite}
              sampleLoading={sampleLoading}
              currentTaskData={currentTaskData}
              CATEGORY_META={CATEGORY_META}
              getSubScore={getSubScore}
              setActiveCategory={setActiveCategory}
              handleGenerateSample={handleGenerateSample}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingResult;
