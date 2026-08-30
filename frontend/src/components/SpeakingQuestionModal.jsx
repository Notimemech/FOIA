import React, { useState, useEffect, useRef } from 'react';
import '../style/speakingTest.css';

/**
 * Helper to inspect uploaded audio file duration.
 */
function getAudioFileDuration(file) {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}

function SpeakingQuestionModal({
  isOpen,
  onClose,
  questionTitle,
  questionText,
  questionIndex = 0,
  totalQuestions = 1,
  partType = 'part1', // 'part1' | 'part2' | 'part3'
  mode = 'exam',       // 'practice' | 'exam'
  existingAudioBlob = null,
  hasNextQuestion = false,
  onSaveAudio,
  onNextQuestion,
}) {
  // Input method: 'record' | 'upload'
  const [inputMethod, setInputMethod] = useState('record');

  // Exam flow states
  // For Part 1 Exam: 'idle' -> 'reviewing' (30s) -> 'recording' -> 'completed'
  // For Part 2 Exam: 'idle' -> 'prepping' (60s) -> 'recording' (130s) -> 'completed'
  const [examStep, setExamStep] = useState('idle'); // 'idle' | 'reviewing' | 'prepping' | 'recording' | 'completed'

  // Question text visibility
  const [showQuestionText, setShowQuestionText] = useState(true);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(existingAudioBlob);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Timers
  const [reviewSecondsLeft, setReviewSecondsLeft] = useState(30);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [speakingSecondsLeft, setSpeakingSecondsLeft] = useState(130); // 2 mins 10 secs
  const [prepNotes, setPrepNotes] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const reviewTimerRef = useRef(null);
  const prepTimerRef = useRef(null);
  const speakingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Extract speech text: In Part 2, only speak the main cue card topic
  const getSpeechText = () => {
    if (!questionText) return '';
    if (partType === 'part2') {
      const lines = questionText.split('\n').filter((l) => l.trim().length > 0);
      return lines[0] || questionText;
    }
    return questionText;
  };

  const speakQuestion = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const textToRead = getSpeechText();
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-GB';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  // Reset states whenever modal opens or question changes
  useEffect(() => {
    if (isOpen) {
      setInputMethod('record');
      setUploadedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setAudioBlob(existingAudioBlob);
      if (existingAudioBlob) {
        setAudioUrl(URL.createObjectURL(existingAudioBlob));
        setExamStep('completed');
      } else {
        setAudioUrl(null);
        setExamStep('idle');
      }

      setIsRecording(false);
      setRecordingDuration(0);
      setReviewSecondsLeft(30);
      setPrepSecondsLeft(60);
      setSpeakingSecondsLeft(130);

      // In Practice mode, automatically speak question
      if (mode === 'practice') {
        const timer = setTimeout(() => {
          speakQuestion();
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      window.speechSynthesis?.cancel();
      stopRecording();
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);
      clearInterval(speakingTimerRef.current);
      clearInterval(recordingTimerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    }
  }, [isOpen, questionTitle, questionText, existingAudioBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);
      clearInterval(speakingTimerRef.current);
      clearInterval(recordingTimerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start Part 1 Review (30s)
  const startPart1Exam = () => {
    setExamStep('reviewing');
    setReviewSecondsLeft(30);
    speakQuestion();

    clearInterval(reviewTimerRef.current);
    reviewTimerRef.current = setInterval(() => {
      setReviewSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(reviewTimerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start Part 2 Prep (60s)
  const startPart2Prep = () => {
    setExamStep('prepping');
    setPrepSecondsLeft(60);
    speakQuestion();

    clearInterval(prepTimerRef.current);
    prepTimerRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Skip review/prep and start speaking immediately
  const handleImmediateSpeak = () => {
    clearInterval(reviewTimerRef.current);
    clearInterval(prepTimerRef.current);
    startRecording();
  };

  // Start Live Microphone Recording
  const startRecording = async () => {
    try {
      window.speechSynthesis?.cancel();
      clearInterval(reviewTimerRef.current);
      clearInterval(prepTimerRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        setUploadedFileName('');
        audioChunksRef.current = [];
        setExamStep('completed');
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      setExamStep('recording');
      setRecordingDuration(0);

      // Duration counter
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Part 2 Speaking Timer: 2m 10s auto-cutoff (130 seconds)
      if (partType === 'part2') {
        setSpeakingSecondsLeft(130);
        clearInterval(speakingTimerRef.current);
        speakingTimerRef.current = setInterval(() => {
          setSpeakingSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(speakingTimerRef.current);
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Unable to access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      clearInterval(speakingTimerRef.current);
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    }
  };

  // File Upload Handler with Part 2 2m 15s (135s) duration validation
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, M4A, WEBM, OGG).');
      return;
    }

    // Check audio duration for Part 2 (Limit: 2 mins 15 secs = 135s)
    if (partType === 'part2') {
      const duration = await getAudioFileDuration(file);
      if (duration > 135) {
        const m = Math.floor(duration / 60);
        const s = Math.floor(duration % 60);
        alert(`Part 2 audio file exceeds the maximum limit of 2 minutes 15 seconds (Current file: ${m}m ${s}s). Please upload a shorter audio file.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploadedFileName(file.name);
    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setExamStep('completed');
  };

  // Save Audio & Handle auto-advance
  const handleSaveAndProceed = () => {
    if (!audioBlob) {
      alert('Please record or upload an audio answer before proceeding.');
      return;
    }
    stopRecording();
    onSaveAudio(audioBlob, audioUrl, recordingDuration);

    if (mode === 'exam' && hasNextQuestion && onNextQuestion) {
      onNextQuestion();
    } else {
      onClose();
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="sq-modal-overlay" onClick={onClose}>
      <div className="sq-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="sq-modal-header">
          <div className="sq-modal-title-box">
            <span className="sq-modal-badge">{questionTitle}</span>
            <span className={`sq-mode-pill ${mode}`}>
              {mode === 'exam' ? '⏱️ Exam Mode' : '🌱 Practice Mode'}
            </span>
          </div>
          <button type="button" className="sq-modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* AI Examiner Bar */}
        <div className="sq-examiner-bar">
          <div className="sq-examiner-info">
            <span className="sq-examiner-avatar">🤖</span>
            <div className="sq-examiner-text">
              <strong>IELTS Examiner Voice</strong>
              <p>Listen carefully to the question prompt below:</p>
            </div>
          </div>

          <div className="sq-examiner-actions">
            <button
              type="button"
              className="sq-btn-replay"
              onClick={speakQuestion}
              title="Replay examiner audio"
            >
              🔄 Replay Question
            </button>
            <button
              type="button"
              className="sq-btn-toggle-view"
              onClick={() => setShowQuestionText(!showQuestionText)}
            >
              {showQuestionText ? '🙈 Hide Prompt' : '👁️ Show Prompt'}
            </button>
          </div>
        </div>

        {/* Question Text Box (Collapsible) */}
        <div className="sq-question-display">
          {showQuestionText ? (
            <div className="sq-question-content">
              {partType === 'part2' ? (
                <div className="sq-cuecard-block">
                  {questionText.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('•') ? 'sq-bullet-line' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="sq-single-question">{questionText}</p>
              )}
            </div>
          ) : (
            <div className="sq-question-hidden" onClick={() => setShowQuestionText(true)}>
              🔒 <em>Prompt hidden for authentic exam simulation. Click here to reveal.</em>
            </div>
          )}
        </div>

        {/* Review Countdown Badge for Part 1 Exam */}
        {partType === 'part1' && mode === 'exam' && examStep === 'reviewing' && (
          <div className="sq-review-active-card">
            <div className="sq-review-timer-badge">
              ⏳ Review Time Remaining: <strong>{reviewSecondsLeft}s</strong>
            </div>
            <p>Listen and prepare. Recording starts automatically when time expires, or click Speak Now below:</p>
          </div>
        )}

        {/* =================================================================== */}
        {/* PART 2 PREPARATION PANEL & SCRATCHPAD (Visible during prep / speak) */}
        {/* =================================================================== */}
        {partType === 'part2' && (examStep === 'prepping' || isRecording || audioBlob || prepNotes.length > 0) && (
          <div className="sq-part2-prep-panel">
            <div className="sq-p2-prep-header">
              <span className="sq-p2-title">⏱️ 1-Minute Preparation & Scratchpad</span>
              {examStep === 'prepping' && (
                <div className="sq-prep-timer-active">
                  <span>Prep Countdown: <strong>{prepSecondsLeft}s</strong></span>
                  <button type="button" className="sq-btn-skip-prep" onClick={handleImmediateSpeak}>
                    🎙️ Start Speaking Now
                  </button>
                </div>
              )}
              {isRecording && (
                <span className="sq-rec-limit-badge">
                  ⏱️ Speaking Limit: <strong>{formatTimer(speakingSecondsLeft)}</strong> (2:10 max)
                </span>
              )}
              {audioBlob && !isRecording && (
                <span className="sq-prep-done">✅ Spoken response captured</span>
              )}
            </div>

            <textarea
              className="sq-scratchpad-input"
              rows={3}
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Outline your notes here (Introduction, Key Points, Examples, Conclusion)..."
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* INPUT METHOD TABS                                                   */}
        {/* =================================================================== */}
        <div className="sq-input-tabs">
          <button
            type="button"
            className={`sq-input-tab ${inputMethod === 'record' ? 'active' : ''}`}
            onClick={() => setInputMethod('record')}
          >
            🎤 Live Microphone Recording
          </button>
          <button
            type="button"
            className={`sq-input-tab ${inputMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMethod('upload')}
          >
            📁 Upload Audio File
          </button>
        </div>

        {/* TAB 1: LIVE MICROPHONE STUDIO */}
        {inputMethod === 'record' && (
          <div className="sq-record-container">
            <div className={`sq-wave-visualizer ${isRecording ? 'active' : ''}`}>
              <div className="sq-wave-bar bar-1"></div>
              <div className="sq-wave-bar bar-2"></div>
              <div className="sq-wave-bar bar-3"></div>
              <div className="sq-wave-bar bar-4"></div>
              <div className="sq-wave-bar bar-5"></div>
              <div className="sq-wave-bar bar-6"></div>
              <div className="sq-wave-bar bar-7"></div>
            </div>

            <div className="sq-timer-box">
              {isRecording ? (
                <div className="sq-rec-status">
                  <span className="sq-rec-pulsar"></span>
                  <span>Recording: <strong>{formatTimer(recordingDuration)}</strong></span>
                  {partType === 'part2' && (
                    <small className="sq-limit-note">(Auto-stop at 2:10 - {speakingSecondsLeft}s remaining)</small>
                  )}
                </div>
              ) : examStep === 'prepping' ? (
                <div className="sq-prep-status-text">
                  ⏳ 1-Minute Prep Countdown: <strong>{prepSecondsLeft}s</strong>
                </div>
              ) : (
                <span className="sq-stopped-status">
                  {audioBlob ? `Recorded Duration: ${formatTimer(recordingDuration)}` : 'Ready to record'}
                </span>
              )}
            </div>

            <div className="sq-record-controls">
              {!isRecording && examStep !== 'prepping' && examStep !== 'reviewing' && (
                <button
                  type="button"
                  className="sq-btn-record-main"
                  onClick={() => {
                    if (partType === 'part2' && !audioBlob && examStep === 'idle') {
                      startPart2Prep();
                    } else if (partType === 'part1' && mode === 'exam' && !audioBlob && examStep === 'idle') {
                      startPart1Exam();
                    } else {
                      startRecording();
                    }
                  }}
                >
                  🔴 {audioBlob ? 'Record Again (Ghi âm lại)' : 'Start Recording'}
                </button>
              )}

              {(examStep === 'prepping' || examStep === 'reviewing') && !isRecording && (
                <button
                  type="button"
                  className="sq-btn-record-main"
                  style={{ background: '#059669', borderColor: '#10b981' }}
                  onClick={handleImmediateSpeak}
                >
                  🎙️ Start Speaking Now (Bắt đầu nói ngay)
                </button>
              )}

              {isRecording && (
                <button type="button" className="sq-btn-stop-main" onClick={stopRecording}>
                  ⏹️ Stop Recording
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO FILE UPLOAD */}
        {inputMethod === 'upload' && (
          <div className="sq-upload-container">
            <div className="sq-dropzone" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <span className="sq-dropzone-icon">📤</span>
              <strong>{uploadedFileName || 'Click to select audio file or drag & drop here'}</strong>
              <p>
                Formats: MP3, WAV, M4A, WEBM, OGG{' '}
                {partType === 'part2' ? '(Part 2 Maximum Duration: 2 mins 15 secs)' : '(Max 50MB)'}
              </p>
            </div>
          </div>
        )}

        {/* Audio Playback Preview & Re-record */}
        {audioUrl && !isRecording && (
          <div className="sq-preview-container">
            <div className="sq-preview-header">
              <span className="sq-preview-title">🎧 Candidate Answer Preview:</span>
              <button
                type="button"
                className="sq-btn-re-record-inline"
                onClick={() => {
                  setInputMethod('record');
                  startRecording();
                }}
              >
                🔄 Re-record
              </button>
            </div>
            <audio controls src={audioUrl} className="sq-audio-player-modal" />
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="sq-modal-footer">
          <button type="button" className="sq-btn-cancel" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="sq-btn-save"
            disabled={!audioBlob || isRecording}
            onClick={handleSaveAndProceed}
          >
            {mode === 'exam' && hasNextQuestion
              ? '💾 Save & Continue to Next Question →'
              : '💾 Save Answer & Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default SpeakingQuestionModal;
