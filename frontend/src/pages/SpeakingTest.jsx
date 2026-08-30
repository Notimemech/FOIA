import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSteps from '../components/LoadingSteps';
import SpeakingQuestionModal from '../components/SpeakingQuestionModal';
import { mergeAudioBlobs } from '../utils/audioUtils';
import {
  SPEAKING_PART1_SETS,
  SPEAKING_PART2_3_SETS,
  SPEAKING_FULL_TEST_SETS,
  getRandomPart1Set,
  getRandomPart23Set,
  getRandomFullTestSet
} from '../utils/speakingQuestions';
import '../style/speakingTest.css';

const SPEAKING_STEPS = [
  'Processing speech audio stream & acoustic features',
  'Transcribing spoken audio with deep phonetic alignment',
  'Evaluating Fluency & Coherence against Band Descriptors',
  'Analyzing Lexical Resource, Idiomatic expressions & Collocations',
  'Auditing Pronunciation, Intonation, Stress & Chunking',
  'Scoring Grammatical Accuracy & structural complexity',
  'Generating Target Band benchmark analysis & score card'
];

function SpeakingTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const partParam = searchParams.get('part') || 'part23';
  const sourceParam = searchParams.get('source') || 'random';
  const modeParam = searchParams.get('mode') || 'exam';

  // Test configuration
  const [isSetup, setIsSetup] = useState(sourceParam === 'custom');
  const [partType, setPartType] = useState(
    partParam === 'part1' ? 'Part 1' : partParam === 'fulltest' ? 'Full Test' : 'Part 2 & 3'
  );
  const [mode, setMode] = useState(modeParam); // 'practice' | 'exam'
  const [targetBand, setTargetBand] = useState(7.0);

  // Question Content State
  const [part1Questions, setPart1Questions] = useState([]);
  const [part2CueCard, setPart2CueCard] = useState('');
  const [part3Questions, setPart3Questions] = useState([]);
  const [activeTab, setActiveTab] = useState(partParam === 'part1' ? 'p1' : 'p23'); // 'p1' | 'p23' | 'all'

  // Per-Question Audio Answers State
  const [audioAnswers, setAudioAnswers] = useState({});
  const [audioUrls, setAudioUrls] = useState({});
  const [audioDurations, setAudioDurations] = useState({});

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    questionKey: '',
    questionTitle: '',
    questionText: '',
    partType: 'part1',
  });

  const [loading, setLoading] = useState(false);

  // Initialize Questions
  useEffect(() => {
    if (sourceParam === 'random') {
      if (partParam === 'part1') {
        const p1Set = getRandomPart1Set();
        setPart1Questions(p1Set.questions);
        setPartType('Part 1');
        setActiveTab('p1');
      } else if (partParam === 'fulltest') {
        const fullSet = getRandomFullTestSet();
        setPart1Questions(fullSet.part1.questions);
        setPart2CueCard(fullSet.part2.cueCard);
        setPart3Questions(fullSet.part3.questions);
        setPartType('Full Test');
        setActiveTab('all');
      } else {
        const p23Set = getRandomPart23Set();
        setPart2CueCard(p23Set.part2.cueCard);
        setPart3Questions(p23Set.part3.questions);
        setPartType('Part 2 & 3');
        setActiveTab('p23');
      }
      setIsSetup(false);
    } else {
      // Default custom placeholders
      setPart1Questions([
        'Where is your hometown, and what do you like about it?',
        'Do you work or study?',
        'How do you usually spend your weekends?',
        'What type of music do you enjoy listening to?',
        'How has technology changed your daily communication?'
      ]);
      setPart2CueCard(
        'Describe a memorable journey you have made.\n\nYou should say:\n• Where you went and who you travelled with\n• How you travelled there\n• What you did during the trip\n\nAnd explain why this journey was particularly memorable.'
      );
      setPart3Questions([
        'How has modern tourism affected local communities in your country?',
        'Do you think people will travel more or less in the future?',
        'What are the advantages of travelling independently compared to guided group tours?'
      ]);
      setIsSetup(true);
    }
  }, [partParam, sourceParam]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      Object.values(audioUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [audioUrls]);

  // Ordered list of questions for sequential auto-advancing in Exam mode
  const getOrderedQuestionList = () => {
    const list = [];
    if (partType === 'Part 1' || partType === 'Full Test') {
      part1Questions.forEach((q, idx) => {
        list.push({
          key: `p1_${idx}`,
          title: `Part 1 - Question ${idx + 1} of ${part1Questions.length}`,
          text: q,
          partType: 'part1',
          index: idx,
          total: part1Questions.length
        });
      });
    }
    if (partType === 'Part 2 & 3' || partType === 'Full Test') {
      list.push({
        key: 'p2',
        title: 'Part 2 - Individual Long Turn (Cue Card)',
        text: part2CueCard,
        partType: 'part2',
        index: 0,
        total: 1
      });
      part3Questions.forEach((q, idx) => {
        list.push({
          key: `p3_${idx}`,
          title: `Part 3 - Discussion Question ${idx + 1} of ${part3Questions.length}`,
          text: q,
          partType: 'part3',
          index: idx,
          total: part3Questions.length
        });
      });
    }
    return list;
  };

  const orderedList = getOrderedQuestionList();
  const currentModalIndex = orderedList.findIndex((item) => item.key === modalState.questionKey);
  const hasNextQuestion = currentModalIndex >= 0 && currentModalIndex < orderedList.length - 1;

  // Open Modal for a specific question
  const handleOpenQuestionModal = (key, title, text, type) => {
    setModalState({
      isOpen: true,
      questionKey: key,
      questionTitle: title,
      questionText: text,
      partType: type,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Next Question auto-advance handler
  const handleNextQuestion = () => {
    if (hasNextQuestion) {
      const nextItem = orderedList[currentModalIndex + 1];
      setModalState({
        isOpen: true,
        questionKey: nextItem.key,
        questionTitle: nextItem.title,
        questionText: nextItem.text,
        partType: nextItem.partType,
      });
    }
  };

  // Save Audio for Question
  const handleSaveQuestionAudio = (blob, url, duration) => {
    const key = modalState.questionKey;
    setAudioAnswers((prev) => ({ ...prev, [key]: blob }));
    setAudioUrls((prev) => ({ ...prev, [key]: url }));
    setAudioDurations((prev) => ({ ...prev, [key]: duration }));
  };

  // Count answered questions
  const getTotalQuestionsCount = () => orderedList.length;
  const getAnsweredQuestionsCount = () => {
    return Object.keys(audioAnswers).filter((k) => audioAnswers[k]).length;
  };

  // Compile total task prompt text
  const getCompiledTaskPrompt = () => {
    if (partType === 'Part 1') {
      return `IELTS Speaking Part 1 Questions:\n${part1Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }
    if (partType === 'Part 2 & 3') {
      return `IELTS Speaking Part 2 Cue Card:\n${part2CueCard}\n\nIELTS Speaking Part 3 Discussion Questions:\n${part3Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }
    return `IELTS Speaking Full Test:\n\n[Part 1 Questions]\n${part1Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n[Part 2 Cue Card]\n${part2CueCard}\n\n[Part 3 Discussion Questions]\n${part3Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  };

  // Build questions metadata list for backend mapping
  const getQuestionsMetadataList = () => {
    const list = [];
    if (partType === 'Part 1' || partType === 'Full Test') {
      part1Questions.forEach((q, idx) => {
        list.push({
          id: `p1_${idx}`,
          key: `p1_${idx}`,
          title: `Question ${idx + 1}`,
          part: 'Part 1',
          question: q,
          audio_field: `audio_p1_${idx}`,
        });
      });
    }
    if (partType === 'Part 2 & 3' || partType === 'Full Test') {
      list.push({
        id: 'p2',
        key: 'p2',
        title: 'Part 2 Cue Card',
        part: 'Part 2',
        question: part2CueCard,
        audio_field: 'audio_p2',
      });
      part3Questions.forEach((q, idx) => {
        list.push({
          id: `p3_${idx}`,
          key: `p3_${idx}`,
          title: `Part 3 - Question ${idx + 1}`,
          part: 'Part 3',
          question: q,
          audio_field: `audio_p3_${idx}`,
        });
      });
    }
    return list;
  };

  // Submit test for AI grading
  const handleSubmitAll = async () => {
    const answeredBlobs = Object.values(audioAnswers).filter(Boolean);
    if (answeredBlobs.length === 0) {
      alert('Please complete at least one audio answer before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Merge all answered audio clips into a unified stream
      const mergedAudioBlob = await mergeAudioBlobs(answeredBlobs);
      const questionsList = getQuestionsMetadataList();

      const formData = new FormData();
      formData.append('skill', 'speaking');
      formData.append('part_type', partType);
      formData.append('task_prompt', getCompiledTaskPrompt());
      formData.append('target_band', targetBand);
      formData.append('audio', mergedAudioBlob || answeredBlobs[0], 'speaking_combined.wav');
      formData.append('questions_json', JSON.stringify(questionsList));

      // Append individual question audio files
      Object.entries(audioAnswers).forEach(([key, blob]) => {
        if (blob) {
          formData.append(`audio_${key}`, blob, `audio_${key}.wav`);
        }
      });

      const res = await axios.post('http://localhost:5000/api/assessments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/speaking/result/${res.data.id}`);
    } catch (err) {
      console.error('[Speaking Submit Error]:', err);
      alert('An error occurred while grading your speaking test. Please try again.');
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSteps steps={SPEAKING_STEPS} intervalMs={1600} />;
  }

  // Custom Prompt Setup Form (All English)
  if (isSetup) {
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
              <button
                type="button"
                className={`st-type-btn ${partType === 'Part 1' ? 'active' : ''}`}
                onClick={() => { setPartType('Part 1'); setActiveTab('p1'); }}
              >
                <strong>Part 1</strong>
                <span>~5 short interview questions</span>
              </button>
              <button
                type="button"
                className={`st-type-btn ${partType === 'Part 2 & 3' ? 'active' : ''}`}
                onClick={() => { setPartType('Part 2 & 3'); setActiveTab('p23'); }}
              >
                <strong>Part 2 & 3</strong>
                <span>Cue Card + 3 discussion questions</span>
              </button>
              <button
                type="button"
                className={`st-type-btn ${partType === 'Full Test' ? 'active' : ''}`}
                onClick={() => { setPartType('Full Test'); setActiveTab('all'); }}
              >
                <strong>Full Test</strong>
                <span>Complete Parts 1, 2 & 3</span>
              </button>
            </div>
          </div>

          {(partType === 'Part 1' || partType === 'Full Test') && (
            <div className="st-form-group">
              <label className="st-label">Part 1 Questions (One question per line):</label>
              <textarea
                className="st-textarea"
                rows={5}
                value={part1Questions.join('\n')}
                onChange={(e) => setPart1Questions(e.target.value.split('\n').filter(Boolean))}
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
                  value={part3Questions.join('\n')}
                  onChange={(e) => setPart3Questions(e.target.value.split('\n').filter(Boolean))}
                  placeholder="Enter 3 deep discussion questions..."
                />
              </div>
            </>
          )}

          <div className="st-settings-grid">
            <div className="st-form-group">
              <label className="st-label">Test Mode:</label>
              <div className="st-mode-toggle">
                <button
                  type="button"
                  className={`st-mode-btn ${mode === 'practice' ? 'active' : ''}`}
                  onClick={() => setMode('practice')}
                >
                  🌱 Practice Mode (Untimed)
                </button>
                <button
                  type="button"
                  className={`st-mode-btn ${mode === 'exam' ? 'active' : ''}`}
                  onClick={() => setMode('exam')}
                >
                  ⏱️ Exam Mode (Timed)
                </button>
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

          <button
            type="button"
            className="st-btn-start"
            onClick={() => setIsSetup(false)}
          >
            🚀 Enter Speaking Test Room
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = getTotalQuestionsCount();
  const answeredQuestions = getAnsweredQuestionsCount();

  return (
    <div className="st-container">
      {/* ── Top Bar ── */}
      <div className="st-topbar">
        <Link to="/speaking" className="st-back-link">
          ← Speaking Hub
        </Link>
        <div className="st-topbar-center">
          <span className="st-part-tag">{partType}</span>
          <span className={`st-mode-tag ${mode}`}>
            {mode === 'exam' ? '⏱️ Exam Mode' : '🌱 Practice Mode'}
          </span>
          <span className="st-target-tag">🎯 Target Band {targetBand.toFixed(1)}</span>
        </div>
        <div className="st-progress-badge">
          Progress: <strong>{answeredQuestions}/{totalQuestions}</strong> answered
        </div>
      </div>

      {/* ── Navigation Tabs for Full Test ── */}
      {partType === 'Full Test' && (
        <div className="st-fulltest-switcher">
          <button
            type="button"
            className={`st-ft-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📋 All Modules (Parts 1, 2 & 3)
          </button>
          <button
            type="button"
            className={`st-ft-btn ${activeTab === 'p1' ? 'active' : ''}`}
            onClick={() => setActiveTab('p1')}
          >
            Part 1 (Intro)
          </button>
          <button
            type="button"
            className={`st-ft-btn ${activeTab === 'p23' ? 'active' : ''}`}
            onClick={() => setActiveTab('p23')}
          >
            Part 2 & Part 3
          </button>
        </div>
      )}

      {/* ── MAIN TEST CONTENT ── */}
      <div className="st-exam-flow-container">
        
        {/* ================================================================= */}
        {/* SECTION: PART 1                                                  */}
        {/* ================================================================= */}
        {(partType === 'Part 1' || activeTab === 'p1' || activeTab === 'all') && (
          <div className="st-part-section-card">
            <div className="st-part-header">
              <div>
                <h2>Part 1: Introduction & Interview</h2>
                <p>Click on each question below to start answering. AI examiner will ask the question with voice synthesis.</p>
              </div>
              <span className="st-part-badge-count">
                {part1Questions.filter((_, idx) => audioAnswers[`p1_${idx}`]).length}/{part1Questions.length} Completed
              </span>
            </div>

            <div className="st-questions-grid">
              {part1Questions.map((question, idx) => {
                const key = `p1_${idx}`;
                const isAnswered = !!audioAnswers[key];
                const duration = audioDurations[key] || 0;
                const audioUrl = audioUrls[key];

                return (
                  <div key={idx} className={`st-q-card ${isAnswered ? 'answered' : ''}`}>
                    <div className="st-q-card-header">
                      <span className="st-q-number-pill">Question {idx + 1}</span>
                      {isAnswered ? (
                        <span className="st-status-pill done">
                          ✅ Completed {duration > 0 && `(${formatTimer(duration)})`}
                        </span>
                      ) : (
                        <span className="st-status-pill pending">⚪ Pending</span>
                      )}
                    </div>

                    <p className="st-q-card-text">{question}</p>

                    {/* Audio Preview if answered */}
                    {audioUrl && (
                      <div className="st-q-audio-preview">
                        <audio controls src={audioUrl} className="st-q-mini-player" />
                      </div>
                    )}

                    <div className="st-q-card-action">
                      <button
                        type="button"
                        className={`st-btn-answer ${isAnswered ? 're-answer' : ''}`}
                        onClick={() =>
                          handleOpenQuestionModal(
                            key,
                            `Part 1 - Question ${idx + 1} of ${part1Questions.length}`,
                            question,
                            'part1'
                          )
                        }
                      >
                        {isAnswered ? '✏️ Re-answer this question' : '🎙️ Answer this question'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION: PART 2 & PART 3                                         */}
        {/* ================================================================= */}
        {(partType === 'Part 2 & 3' || activeTab === 'p23' || activeTab === 'all') && (
          <>
            {/* PART 2 CUE CARD */}
            <div className="st-part-section-card">
              <div className="st-part-header">
                <div>
                  <h2>Part 2: Individual Long Turn (Cue Card)</h2>
                  <p>Open modal to begin 1-minute preparation and 2-minute continuous spoken response.</p>
                </div>
                {audioAnswers['p2'] ? (
                  <span className="st-status-pill done">
                    ✅ Completed {audioDurations['p2'] > 0 && `(${formatTimer(audioDurations['p2'])})`}
                  </span>
                ) : (
                  <span className="st-status-pill pending">⚪ Pending</span>
                )}
              </div>

              <div className="st-p2-cuecard-preview">
                {part2CueCard.split('\n').map((line, idx) => (
                  <p key={idx} className={line.startsWith('•') ? 'st-cue-bullet' : ''}>{line}</p>
                ))}
              </div>

              {audioUrls['p2'] && (
                <div className="st-q-audio-preview">
                  <audio controls src={audioUrls['p2']} className="st-q-mini-player" />
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className={`st-btn-answer ${audioAnswers['p2'] ? 're-answer' : ''}`}
                  onClick={() =>
                    handleOpenQuestionModal(
                      'p2',
                      'Part 2 - Individual Long Turn (Cue Card)',
                      part2CueCard,
                      'part2'
                    )
                  }
                >
                  {audioAnswers['p2'] ? '✏️ Retake Part 2' : '🎙️ Start Part 2 (1m Prep + 2m Speaking)'}
                </button>
              </div>
            </div>

            {/* PART 3 IN-DEPTH DISCUSSION */}
            <div className="st-part-section-card">
              <div className="st-part-header">
                <div>
                  <h2>Part 3: In-depth Two-Way Discussion</h2>
                  <p>In-depth abstract discussion extending from Part 2. Answer each question individually below:</p>
                </div>
                <span className="st-part-badge-count">
                  {part3Questions.filter((_, idx) => audioAnswers[`p3_${idx}`]).length}/{part3Questions.length} Completed
                </span>
              </div>

              <div className="st-questions-grid">
                {part3Questions.map((question, idx) => {
                  const key = `p3_${idx}`;
                  const isAnswered = !!audioAnswers[key];
                  const duration = audioDurations[key] || 0;
                  const audioUrl = audioUrls[key];

                  return (
                    <div key={idx} className={`st-q-card ${isAnswered ? 'answered' : ''}`}>
                      <div className="st-q-card-header">
                        <span className="st-q-number-pill">Part 3 - Q{idx + 1}</span>
                        {isAnswered ? (
                          <span className="st-status-pill done">
                            ✅ Completed {duration > 0 && `(${formatTimer(duration)})`}
                          </span>
                        ) : (
                          <span className="st-status-pill pending">⚪ Pending</span>
                        )}
                      </div>

                      <p className="st-q-card-text">{question}</p>

                      {/* Audio Preview if answered */}
                      {audioUrl && (
                        <div className="st-q-audio-preview">
                          <audio controls src={audioUrl} className="st-q-mini-player" />
                        </div>
                      )}

                      <div className="st-q-card-action">
                        <button
                          type="button"
                          className={`st-btn-answer ${isAnswered ? 're-answer' : ''}`}
                          onClick={() =>
                            handleOpenQuestionModal(
                              key,
                              `Part 3 - Discussion Question ${idx + 1} of ${part3Questions.length}`,
                              question,
                              'part3'
                            )
                          }
                        >
                          {isAnswered ? '✏️ Re-answer this question' : '🎙️ Answer this question'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── SUBMISSION BAR ── */}
      <div className="st-submission-bar">
        <div className="st-sub-left">
          <strong>Completion Progress:</strong>
          <span>{answeredQuestions} / {totalQuestions} questions with audio answers</span>
        </div>

        <button
          type="button"
          className="st-btn-submit-final"
          disabled={answeredQuestions === 0}
          onClick={handleSubmitAll}
        >
          🚀 Submit Full Test for AI Examiner Assessment
        </button>
      </div>

      {/* ── Interactive Modal for Single Question with Auto-Advance ── */}
      <SpeakingQuestionModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        questionTitle={modalState.questionTitle}
        questionText={modalState.questionText}
        questionIndex={currentModalIndex >= 0 ? currentModalIndex : 0}
        totalQuestions={totalQuestions}
        partType={modalState.partType}
        mode={mode}
        existingAudioBlob={audioAnswers[modalState.questionKey] || null}
        hasNextQuestion={hasNextQuestion}
        onSaveAudio={handleSaveQuestionAudio}
        onNextQuestion={handleNextQuestion}
      />

    </div>
  );
}

export default SpeakingTest;
