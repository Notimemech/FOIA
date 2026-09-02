import React from 'react';
import { downloadAudio } from '../utils/audioUtils';

/**
 * SpeakingPartCard — renders a single question card for Part 1 or Part 3.
 * Handles answered/pending state, audio preview, and open-modal action.
 */
function SpeakingPartCard({
  questionKey,
  questionLabel,
  questionText,
  isAnswered,
  duration,
  audioUrl,
  formatTimer,
  onOpen,
  downloadFilename,
}) {
  return (
    <div className={`st-q-card ${isAnswered ? 'answered' : ''}`}>
      <div className="st-q-card-header">
        <span className="st-q-number-pill">{questionLabel}</span>
        {isAnswered ? (
          <span className="st-status-pill done">
            ✅ Completed {duration > 0 && `(${formatTimer(duration)})`}
          </span>
        ) : (
          <span className="st-status-pill pending">⚪ Pending</span>
        )}
      </div>

      <p className="st-q-card-text">{questionText}</p>

      {audioUrl && (
        <div className="st-q-audio-preview">
          <div className="st-audio-bar">
            <audio controls src={audioUrl} className="st-q-mini-player" />
            <button
              type="button"
              className="st-btn-download-audio"
              onClick={() => downloadAudio(audioUrl, downloadFilename)}
              title="Download recorded answer"
            >
              📥 Download
            </button>
          </div>
        </div>
      )}

      <div className="st-q-card-action">
        <button
          type="button"
          className={`st-btn-answer ${isAnswered ? 're-answer' : ''}`}
          onClick={onOpen}
        >
          {isAnswered ? '✏️ Re-answer this question' : '🎙️ Answer this question'}
        </button>
      </div>
    </div>
  );
}

export default SpeakingPartCard;
