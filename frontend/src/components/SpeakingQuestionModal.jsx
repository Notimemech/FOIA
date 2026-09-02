import React, { useState } from 'react';
import { downloadAudio } from '../utils/audioUtils';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import '../style/speakingTest.css';
import '../style/speakingModal.css';

function SpeakingQuestionModal({
  isOpen,
  onClose,
  questionTitle,
  questionText,
  questionIndex = 0,
  totalQuestions = 1,
  partType = 'part1',
  mode = 'exam',
  existingAudioBlob = null,
  hasNextQuestion = false,
  onSaveAudio,
  onNextQuestion,
}) {
  const [showQuestionText, setShowQuestionText] = useState(true);

  // Extract speech text — Part 2 speaks only the cue card title
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

  const recorder = useAudioRecorder({
    partType, mode, existingAudioBlob, isOpen, questionTitle, questionText,
    onSpeakQuestion: speakQuestion,
  });

  const {
    inputMethod, setInputMethod,
    examStep,
    isRecording,
    recordingDuration,
    audioBlob,
    audioUrl,
    uploadedFileName,
    reviewSecondsLeft,
    prepSecondsLeft,
    speakingSecondsLeft,
    prepNotes, setPrepNotes,
    fileInputRef,
    startRecording,
    stopRecording,
    startPart1Exam,
    startPart2Prep,
    handleImmediateSpeak,
    handleFileUpload,
    formatTimer,
  } = recorder;

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
          <button type="button" className="sq-modal-close-btn" onClick={onClose} title="Close">✕</button>
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
            <button type="button" className="sq-btn-replay" onClick={speakQuestion} title="Replay examiner audio">
              🔄 Replay Question
            </button>
            <button type="button" className="sq-btn-toggle-view" onClick={() => setShowQuestionText(!showQuestionText)}>
              {showQuestionText ? '🙈 Hide Prompt' : '👁️ Show Prompt'}
            </button>
          </div>
        </div>

        {/* Question Text Box */}
        <div className="sq-question-display">
          {showQuestionText ? (
            <div className="sq-question-content">
              {partType === 'part2' ? (
                <div className="sq-cuecard-block">
                  {questionText.split('\n').map((line, idx) => (
                    <p key={idx} className={line.startsWith('•') ? 'sq-bullet-line' : ''}>{line}</p>
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

        {/* Part 1 Review Countdown */}
        {partType === 'part1' && mode === 'exam' && examStep === 'reviewing' && (
          <div className="sq-review-active-card">
            <div className="sq-review-timer-badge">
              ⏳ Review Time Remaining: <strong>{reviewSecondsLeft}s</strong>
            </div>
            <p>Listen and prepare. Recording starts automatically when time expires, or click Speak Now below:</p>
          </div>
        )}

        {/* Part 2 Preparation Panel */}
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
              {audioBlob && !isRecording && <span className="sq-prep-done">✅ Spoken response captured</span>}
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

        {/* Input Method Tabs */}
        <div className="sq-input-tabs">
          <button type="button" className={`sq-input-tab ${inputMethod === 'record' ? 'active' : ''}`} onClick={() => setInputMethod('record')}>
            🎤 Live Microphone Recording
          </button>
          <button type="button" className={`sq-input-tab ${inputMethod === 'upload' ? 'active' : ''}`} onClick={() => setInputMethod('upload')}>
            📁 Upload Audio File
          </button>
        </div>

        {/* Tab: Live Recording */}
        {inputMethod === 'record' && (
          <div className="sq-record-container">
            <div className={`sq-wave-visualizer ${isRecording ? 'active' : ''}`}>
              {[1,2,3,4,5,6,7].map((n) => <div key={n} className={`sq-wave-bar bar-${n}`} />)}
            </div>

            <div className="sq-timer-box">
              {isRecording ? (
                <div className="sq-rec-status">
                  <span className="sq-rec-pulsar" />
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
                <button type="button" className="sq-btn-record-main" style={{ background: '#059669', borderColor: '#10b981' }} onClick={handleImmediateSpeak}>
                  🎙️ Start Speaking Now (Bắt đầu nói ngay)
                </button>
              )}
              {isRecording && (
                <button type="button" className="sq-btn-stop-main" onClick={stopRecording}>⏹️ Stop Recording</button>
              )}
            </div>
          </div>
        )}

        {/* Tab: Upload */}
        {inputMethod === 'upload' && (
          <div className="sq-upload-container">
            <div className="sq-dropzone" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac" style={{ display: 'none' }} onChange={handleFileUpload} />
              <span className="sq-dropzone-icon">📤</span>
              <strong>{uploadedFileName || 'Click to select audio file or drag & drop here'}</strong>
              <p>
                Formats: MP3, WAV, M4A, WEBM, OGG{' '}
                {partType === 'part2' ? '(Part 2 Maximum Duration: 2 mins 15 secs)' : '(Max 50MB)'}
              </p>
            </div>
          </div>
        )}

        {/* Audio Preview */}
        {audioUrl && !isRecording && (
          <div className="sq-preview-container">
            <div className="sq-preview-header">
              <span className="sq-preview-title">🎧 Candidate Answer Preview:</span>
              <div className="sq-preview-actions">
                <button type="button" className="sq-btn-download-inline" onClick={() => downloadAudio(audioUrl, `Speaking_${partType}_answer.wav`)} title="Download candidate recording">
                  📥 Download
                </button>
                <button type="button" className="sq-btn-re-record-inline" onClick={() => { setInputMethod('record'); startRecording(); }}>
                  🔄 Re-record
                </button>
              </div>
            </div>
            <audio controls src={audioUrl} className="sq-audio-player-modal" />
          </div>
        )}

        {/* Footer */}
        <div className="sq-modal-footer">
          <button type="button" className="sq-btn-cancel" onClick={onClose}>Close</button>
          <button type="button" className="sq-btn-save" disabled={!audioBlob || isRecording} onClick={handleSaveAndProceed}>
            {mode === 'exam' && hasNextQuestion ? '💾 Save & Continue to Next Question →' : '💾 Save Answer & Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default SpeakingQuestionModal;
