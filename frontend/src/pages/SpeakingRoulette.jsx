import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouletteCardDeck from '../components/RouletteCardDeck';
import RouletteQuestionCard from '../components/RouletteQuestionCard';
import SpeakingQuestionModal from '../components/SpeakingQuestionModal';
import LoadingSteps from '../components/LoadingSteps';
import { SPEAKING_ROULETTE_DATA, getRandomRouletteTopic } from '../utils/speakingRouletteData';
import '../style/speakingRoulette.css';

const GRADING_STEPS = [
  'Transcribing audio with acoustic phonetic analysis',
  'Evaluating Fluency & Speech Continuity',
  'Analyzing Vocabulary & Contextual Idiomatic collocations',
  'Auditing Pronunciation, Stress, and Intonation',
  'Scoring Grammatical Accuracy against IELTS Speaking Band Descriptors'
];

function SpeakingRoulette() {
  const navigate = useNavigate();

  const [activePart, setActivePart] = useState('part_1'); // 'part_1' | 'part_2' | 'part_3'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [savedTopics, setSavedTopics] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);

  // Recording & Grading state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalData, setActiveModalData] = useState({ title: '', text: '', partType: 'part1' });
  const [isGrading, setIsGrading] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Load saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ielts_roulette_saved');
      if (stored) setSavedTopics(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load saved bookmarks', e);
    }
  }, []);

  // Fetch past speaking history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/assessments?skill=speaking');
        setHistoryList(res.data || []);
      } catch (err) {
        console.warn('Could not fetch assessment history', err);
      }
    };
    fetchHistory();
  }, []);

  const partList = SPEAKING_ROULETTE_DATA[activePart] || SPEAKING_ROULETTE_DATA['part_1'];
  const displayedTopics = savedOnly
    ? partList.filter((t) => savedTopics.includes(t.id))
    : partList;

  const handleToggleBookmark = (topicId) => {
    setSavedTopics((prev) => {
      const next = prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];
      localStorage.setItem('ielts_roulette_saved', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectCard = (topic) => {
    setSelectedTopic(topic);
    const qList = topic.questions || [];
    const randQ = qList.length > 0 ? qList[Math.floor(Math.random() * qList.length)] : topic.cue_card || topic.topic;
    setSelectedQuestion(randQ);
  };

  const handleSpinRandom = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const topic = getRandomRouletteTopic(activePart);
      handleSelectCard(topic);
      setIsSpinning(false);
    }, 900);
  };

  // Open the interactive recording modal
  const handleRecordAnswer = (questionText, topic) => {
    const partType = activePart === 'part_1' ? 'part1' : activePart === 'part_2' ? 'part2' : 'part3';
    setActiveModalData({
      title: `${topic.part}: ${topic.topic}`,
      text: questionText,
      partType: partType,
    });
    setModalOpen(true);
  };

  // Submit spoken answer for immediate AI assessment
  const handleSaveAndGradeAudio = async (blob) => {
    setModalOpen(false);
    if (!blob) return;

    setIsGrading(true);
    try {
      const formData = new FormData();
      formData.append('skill', 'speaking');
      formData.append('part_type', selectedTopic?.part || 'Part 1');
      formData.append('task_prompt', selectedQuestion || selectedTopic?.topic || 'IELTS Speaking Question');
      formData.append('target_band', 7.0);
      formData.append('audio', blob, 'roulette_response.wav');
      formData.append('audio_p1_0', blob, 'roulette_response.wav');

      const res = await axios.post('http://localhost:5000/api/assessments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setTimeout(() => {
        navigate(`/speaking/result/${res.data.id}`);
      }, 7000);
    } catch (err) {
      console.error('[Roulette Grading Error]:', err);
      alert('Grading failed. Please try again.');
      setIsGrading(false);
    }
  };

  // Filter history for current selected topic / prompt
  const topicAttempts = historyList.filter((item) => {
    if (!selectedTopic) return false;
    const prompt = (item.task_prompt || '').toLowerCase();
    const topicName = (selectedTopic.topic || '').toLowerCase();
    const qText = (selectedQuestion || '').toLowerCase();
    return prompt.includes(topicName) || prompt.includes(qText.slice(0, 20));
  });

  if (isGrading) {
    return (
      <div className="sr-page">
        <LoadingSteps steps={GRADING_STEPS} intervalMs={1400} />
      </div>
    );
  }

  return (
    <div className="sr-page">
      {/* Top Bar */}
      <div className="sr-topbar">
        <Link to="/speaking/test" className="sr-back-btn" title="Back to Speaking Hub">
          ←
        </Link>
        <div className="sr-logo-title">
          Speaking Roulette <span className="sr-logo-sub">IELTS</span>
        </div>
        <button
          type="button"
          className={`sr-saved-toggle ${savedOnly ? 'active' : ''}`}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          ★ Saved ({savedTopics.length})
        </button>
      </div>

      {/* Part Switcher Pill */}
      <div className="sr-part-switcher">
        {[
          ['part_1', 'Part 1', 'INTERVIEW'],
          ['part_2', 'Part 2', 'CUE CARD'],
          ['part_3', 'Part 3', 'DISCUSSION'],
        ].map(([key, label, sub]) => (
          <button
            key={key}
            type="button"
            className={`sr-part-tab ${activePart === key ? 'active' : ''}`}
            onClick={() => {
              setActivePart(key);
              setSelectedTopic(null);
            }}
          >
            <strong>{label}</strong>
            <span>{sub}</span>
          </button>
        ))}
      </div>

      {/* Main Content: Card Fan Deck OR Drawn Question Card */}
      {!selectedTopic ? (
        <RouletteCardDeck
          topics={displayedTopics}
          onSelectCard={handleSelectCard}
          onSpinRandom={handleSpinRandom}
          isSpinning={isSpinning}
        />
      ) : (
        <RouletteQuestionCard
          topic={selectedTopic}
          selectedQuestion={selectedQuestion}
          isBookmarked={savedTopics.includes(selectedTopic.id)}
          onToggleBookmark={() => handleToggleBookmark(selectedTopic.id)}
          onRecordAnswer={handleRecordAnswer}
          pastAttempts={topicAttempts}
          onBackToDeck={() => setSelectedTopic(null)}
          onSpinNext={handleSpinRandom}
        />
      )}

      {/* Interactive Recording Modal */}
      {modalOpen && (
        <SpeakingQuestionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          questionTitle={activeModalData.title}
          questionText={activeModalData.text}
          questionIndex={0}
          totalQuestions={1}
          partType={activeModalData.partType}
          mode="practice"
          onSaveAudio={handleSaveAndGradeAudio}
        />
      )}
    </div>
  );
}

export default SpeakingRoulette;
