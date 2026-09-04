import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSteps from '../components/LoadingSteps';
import SpeakingQuestionModal from '../components/SpeakingQuestionModal';
import SpeakingTestSetupForm from '../components/SpeakingTestSetupForm';
import SpeakingPartSection from '../components/SpeakingPartSection';
import { mergeAudioBlobs, getHanoiTimestamp, generateSpeakingRecordName } from '../utils/audioUtils';
import { getRandomPart1Set, getRandomPart23Set, getRandomFullTestSet } from '../utils/speakingQuestions';
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

const formatTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

function SpeakingTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const partParam   = searchParams.get('part') || 'part23';
  const sourceParam = searchParams.get('source') || 'random';
  const modeParam   = searchParams.get('mode') || 'exam';

  const [isSetup, setIsSetup]   = useState(sourceParam === 'custom');
  const [partType, setPartType] = useState(
    partParam === 'part1' ? 'Part 1' : partParam === 'fulltest' ? 'Full Test' : 'Part 2 & 3'
  );
  const [mode, setMode]           = useState(modeParam);
  const [targetBand, setTargetBand] = useState(7.0);

  // Timestamp generated once when the test set is created
  const [sessionTimestamp, setSessionTimestamp] = useState(() => getHanoiTimestamp());

  const [part1Questions, setPart1Questions] = useState([]);
  const [part2CueCard, setPart2CueCard]     = useState('');
  const [part3Questions, setPart3Questions] = useState([]);
  const [activeTab, setActiveTab]           = useState(partParam === 'part1' ? 'p1' : 'p23');

  const [audioAnswers, setAudioAnswers]   = useState({});
  const [audioUrls, setAudioUrls]         = useState({});
  const [audioDurations, setAudioDurations] = useState({});

  const [modalState, setModalState] = useState({
    isOpen: false, questionKey: '', questionTitle: '', questionText: '', partType: 'part1',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh session timestamp on new test creation
    const newTs = getHanoiTimestamp();
    setSessionTimestamp(newTs);

    if (sourceParam === 'random') {
      if (partParam === 'part1') {
        const s = getRandomPart1Set();
        setPart1Questions(s.questions); setPartType('Part 1'); setActiveTab('p1');
      } else if (partParam === 'fulltest') {
        const s = getRandomFullTestSet();
        setPart1Questions(s.part1.questions); setPart2CueCard(s.part2.cueCard); setPart3Questions(s.part3.questions);
        setPartType('Full Test'); setActiveTab('all');
      } else {
        const s = getRandomPart23Set();
        setPart2CueCard(s.part2.cueCard); setPart3Questions(s.part3.questions);
        setPartType('Part 2 & 3'); setActiveTab('p23');
      }
      setIsSetup(false);
    } else {
      setPart1Questions(['Where is your hometown, and what do you like about it?', 'Do you work or study?', 'How do you spend your weekends?']);
      setPart2CueCard('Describe a memorable journey you made.\n\nYou should say:\n• Where you went\n• How you travelled\n• What you did\n\nAnd explain why it was memorable.');
      setPart3Questions(['How has modern tourism affected local communities?', 'Do you think people will travel more in the future?']);
      setIsSetup(true);
    }
  }, [partParam, sourceParam]);

  useEffect(() => {
    return () => { Object.values(audioUrls).forEach((url) => { if (url) URL.revokeObjectURL(url); }); };
  }, [audioUrls]);

  const testTypeLabel = useMemo(() => {
    if (partType === 'Part 1') return 'TestPart1';
    if (partType === 'Part 2 & 3') return 'TestPart2&3';
    return 'FullTest';
  }, [partType]);

  const getOrderedQuestionList = () => {
    const list = [];
    if (partType === 'Part 1' || partType === 'Full Test') {
      part1Questions.forEach((q, idx) => {
        const qNo = `Q${idx + 1}`;
        const recordName = generateSpeakingRecordName({
          testType: testTypeLabel,
          part: 'P1',
          qNo,
          timestamp: sessionTimestamp,
        });
        list.push({
          key: `p1_${idx}`,
          title: `Part 1 - Question ${idx + 1}`,
          text: q,
          partType: 'part1',
          partLabel: 'Part 1',
          qNo,
          recordName,
        });
      });
    }
    if (partType === 'Part 2 & 3' || partType === 'Full Test') {
      const p2RecordName = generateSpeakingRecordName({
        testType: testTypeLabel,
        part: 'P2',
        qNo: 'Q1',
        timestamp: sessionTimestamp,
      });
      list.push({
        key: 'p2',
        title: 'Part 2 - Cue Card',
        text: part2CueCard,
        partType: 'part2',
        partLabel: 'Part 2',
        qNo: 'Q1',
        recordName: p2RecordName,
      });

      part3Questions.forEach((q, idx) => {
        const qNo = `Q${idx + 1}`;
        const recordName = generateSpeakingRecordName({
          testType: testTypeLabel,
          part: 'P3',
          qNo,
          timestamp: sessionTimestamp,
        });
        list.push({
          key: `p3_${idx}`,
          title: `Part 3 - Q${idx + 1}`,
          text: q,
          partType: 'part3',
          partLabel: 'Part 3',
          qNo,
          recordName,
        });
      });
    }
    return list;
  };

  const orderedList       = getOrderedQuestionList();
  const currentModalIndex = orderedList.findIndex((item) => item.key === modalState.questionKey);
  const hasNextQuestion   = currentModalIndex >= 0 && currentModalIndex < orderedList.length - 1;
  const totalQuestions    = orderedList.length;
  const answeredQuestions = Object.keys(audioAnswers).filter((k) => audioAnswers[k]).length;

  const handleOpenModal = (key, title, text, type) => {
    setModalState({ isOpen: true, questionKey: key, questionTitle: title, questionText: text, partType: type });
  };
  const handleCloseModal = () => setModalState((prev) => ({ ...prev, isOpen: false }));
  const handleNextQuestion = () => {
    if (hasNextQuestion) {
      const next = orderedList[currentModalIndex + 1];
      setModalState({ isOpen: true, questionKey: next.key, questionTitle: next.title, questionText: next.text, partType: next.partType });
    }
  };
  const handleSaveQuestionAudio = (blob, url, duration) => {
    const key = modalState.questionKey;
    setAudioAnswers((prev) => ({ ...prev, [key]: blob }));
    setAudioUrls((prev) => ({ ...prev, [key]: url }));
    setAudioDurations((prev) => ({ ...prev, [key]: duration }));
  };

  const getCompiledTaskPrompt = () => {
    if (partType === 'Part 1') return `IELTS Speaking Part 1 Questions:\n${part1Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    if (partType === 'Part 2 & 3') return `IELTS Speaking Part 2 Cue Card:\n${part2CueCard}\n\nIELTS Speaking Part 3 Questions:\n${part3Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    return `IELTS Speaking Full Test:\n\n[Part 1]\n${part1Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n[Part 2]\n${part2CueCard}\n\n[Part 3]\n${part3Questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  };

  const handleSubmitAll = async () => {
    const answeredBlobs = Object.values(audioAnswers).filter(Boolean);
    if (answeredBlobs.length === 0) { alert('Please complete at least one audio answer before submitting.'); return; }
    setLoading(true);
    try {
      const mergedAudioBlob = await mergeAudioBlobs(answeredBlobs);
      const formData = new FormData();
      formData.append('skill', 'speaking');
      formData.append('part_type', partType);
      formData.append('task_prompt', getCompiledTaskPrompt());
      formData.append('target_band', targetBand);
      formData.append('session_timestamp', sessionTimestamp);

      // Construct detailed questions metadata for DB mapping
      const questionsData = orderedList.map((item) => ({
        id: item.key,
        key: item.key,
        title: item.title,
        part: item.partLabel || item.partType,
        question: item.text,
        audio_field: `audio_${item.key}`,
        record_name: item.recordName,
      }));
      formData.append('questions_json', JSON.stringify(questionsData));

      // Append primary stream for AI scoring
      formData.append('audio', mergedAudioBlob || answeredBlobs[0], `${testTypeLabel}_FullAudio_${sessionTimestamp}.wav`);

      // Append each individual audio answer with its standard record name
      orderedList.forEach((item) => {
        const blob = audioAnswers[item.key];
        if (blob) {
          formData.append(`audio_${item.key}`, blob, `${item.recordName}.wav`);
        }
      });

      const res = await axios.post('http://localhost:5000/api/assessments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/speaking/result/${res.data.id}`);
    } catch (err) {
      console.error('[Speaking Submit Error]:', err);
      alert('Grading failed. Please try again.');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSteps steps={SPEAKING_STEPS} intervalMs={1600} />;


  if (isSetup) {
    return (
      <SpeakingTestSetupForm
        partType={partType} setPartType={setPartType} setActiveTab={setActiveTab}
        part1Questions={part1Questions} setPart1Questions={setPart1Questions}
        part2CueCard={part2CueCard} setPart2CueCard={setPart2CueCard}
        part3Questions={part3Questions} setPart3Questions={setPart3Questions}
        mode={mode} setMode={setMode} targetBand={targetBand} setTargetBand={setTargetBand}
        onEnterRoom={() => setIsSetup(false)}
      />
    );
  }

  return (
    <div className="st-container">
      {/* Top Bar */}
      <div className="st-topbar">
        <Link to="/speaking" className="st-back-link">← Speaking Hub</Link>
        <div className="st-topbar-center">
          <span className="st-part-tag">{partType}</span>
          <span className={`st-mode-tag ${mode}`}>{mode === 'exam' ? '⏱️ Exam Mode' : '🌱 Practice Mode'}</span>
          <span className="st-target-tag">🎯 Target Band {targetBand.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/speaking/roulette" style={{
            background: '#485c42', color: '#fef08a', border: '1px solid rgba(254, 240, 138, 0.4)',
            padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 800,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
          }}>
            🎰 Speaking Roulette
          </Link>
          <div className="st-progress-badge">
            Progress: <strong>{answeredQuestions}/{totalQuestions}</strong>
          </div>
        </div>
      </div>

      {partType === 'Full Test' && (
        <div className="st-fulltest-switcher">
          {[['all', '📋 All Modules (Parts 1, 2 & 3)'], ['p1', 'Part 1 (Intro)'], ['p23', 'Part 2 & Part 3']].map(([tab, label]) => (
            <button key={tab} type="button" className={`st-ft-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{label}</button>
          ))}
        </div>
      )}

      <SpeakingPartSection
        partType={partType} activeTab={activeTab}
        part1Questions={part1Questions} part2CueCard={part2CueCard} part3Questions={part3Questions}
        audioAnswers={audioAnswers} audioUrls={audioUrls} audioDurations={audioDurations}
        formatTimer={formatTimer} onOpenModal={handleOpenModal}
      />

      <div className="st-submission-bar">
        <div className="st-sub-left">
          <strong>Completion Progress:</strong>
          <span>{answeredQuestions} / {totalQuestions} answered</span>
        </div>
        <button type="button" className="st-btn-submit-final" disabled={answeredQuestions === 0} onClick={handleSubmitAll}>
          🚀 Submit Full Test for AI Examiner Assessment
        </button>
      </div>

      <SpeakingQuestionModal
        isOpen={modalState.isOpen} onClose={handleCloseModal}
        questionTitle={modalState.questionTitle} questionText={modalState.questionText}
        questionIndex={currentModalIndex >= 0 ? currentModalIndex : 0} totalQuestions={totalQuestions}
        partType={modalState.partType} mode={mode}
        existingAudioBlob={audioAnswers[modalState.questionKey] || null}
        hasNextQuestion={hasNextQuestion} onSaveAudio={handleSaveQuestionAudio} onNextQuestion={handleNextQuestion}
      />
    </div>
  );
}

export default SpeakingTest;
