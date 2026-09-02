import React from 'react';
import SpeakingPartCard from './SpeakingPartCard';
import { downloadAudio } from '../utils/audioUtils';

/**
 * SpeakingPartSection — Renders the Part 1, Part 2, or Part 3 exam flow cards.
 */
function SpeakingPartSection({
  partType,
  activeTab,
  part1Questions,
  part2CueCard,
  part3Questions,
  audioAnswers,
  audioUrls,
  audioDurations,
  formatTimer,
  onOpenModal,
}) {
  return (
    <div className="st-exam-flow-container">
      {/* PART 1 */}
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
            {part1Questions.map((question, idx) => (
              <SpeakingPartCard
                key={idx}
                questionKey={`p1_${idx}`}
                questionLabel={`Question ${idx + 1}`}
                questionText={question}
                isAnswered={!!audioAnswers[`p1_${idx}`]}
                duration={audioDurations[`p1_${idx}`] || 0}
                audioUrl={audioUrls[`p1_${idx}`]}
                formatTimer={formatTimer}
                downloadFilename={`Speaking_Part1_Q${idx + 1}.wav`}
                onOpen={() => onOpenModal(`p1_${idx}`, `Part 1 - Question ${idx + 1} of ${part1Questions.length}`, question, 'part1')}
              />
            ))}
          </div>
        </div>
      )}

      {/* PART 2 & 3 */}
      {(partType === 'Part 2 & 3' || activeTab === 'p23' || activeTab === 'all') && (
        <>
          {/* Part 2 Cue Card */}
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
                <div className="st-audio-bar">
                  <audio controls src={audioUrls['p2']} className="st-q-mini-player" />
                  <button
                    type="button"
                    className="st-btn-download-audio"
                    onClick={() => downloadAudio(audioUrls['p2'], 'Speaking_Part2_CueCard.wav')}
                    title="Download Part 2 recording"
                  >
                    📥 Download Part 2
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className={`st-btn-answer ${audioAnswers['p2'] ? 're-answer' : ''}`}
                onClick={() => onOpenModal('p2', 'Part 2 - Individual Long Turn (Cue Card)', part2CueCard, 'part2')}
              >
                {audioAnswers['p2'] ? '✏️ Retake Part 2' : '🎙️ Start Part 2 (1m Prep + 2m Speaking)'}
              </button>
            </div>
          </div>

          {/* Part 3 Questions */}
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
              {part3Questions.map((question, idx) => (
                <SpeakingPartCard
                  key={idx}
                  questionKey={`p3_${idx}`}
                  questionLabel={`Part 3 - Q${idx + 1}`}
                  questionText={question}
                  isAnswered={!!audioAnswers[`p3_${idx}`]}
                  duration={audioDurations[`p3_${idx}`] || 0}
                  audioUrl={audioUrls[`p3_${idx}`]}
                  formatTimer={formatTimer}
                  downloadFilename={`Speaking_Part3_Q${idx + 1}.wav`}
                  onOpen={() => onOpenModal(`p3_${idx}`, `Part 3 - Discussion Question ${idx + 1} of ${part3Questions.length}`, question, 'part3')}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SpeakingPartSection;
