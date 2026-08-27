import React, { useState, useRef } from 'react';
import axios from 'axios';
import LoadingSteps from '../components/LoadingSteps';

function SpeakingTest() {
  const [prompt, setPrompt] = useState('Describe a memorable journey you have made. You should say: where you went, how you travelled, why you went there, and explain why it is memorable.');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Unable to access microphone. Please grant audio permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('skill', 'speaking');
    formData.append('part_type', 'Part 2');
    formData.append('task_prompt', prompt);
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const res = await axios.post('http://localhost:5000/api/assessments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setTimeout(() => {
        setResult(res.data);
        setLoading(false);
      }, 12000);
    } catch (error) {
      console.error(error);
      alert('An error occurred during submission. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="test-container">
      <h2>IELTS Speaking Part 2</h2>
      
      {!loading && !result && (
        <>
          <div className="form-group">
            <label>Topic Prompt:</label>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', borderLeft: '4px solid var(--border-accent)', borderRadius: '4px' }}>
              {prompt}
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'center', margin: '2rem 0' }}>
            {!isRecording ? (
              <button onClick={startRecording} className="btn-primary">
                🎤 Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#f87171' }}>
                ⏹ Stop Recording (Recording in progress...)
              </button>
            )}
            
            {audioBlob && !isRecording && (
              <div style={{ marginTop: '1.25rem' }}>
                <audio src={URL.createObjectURL(audioBlob)} controls style={{ width: '100%', maxWidth: '400px' }}></audio>
                <div style={{ marginTop: '1rem' }}>
                  <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                    Submit &amp; Evaluate
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {loading && <LoadingSteps />}

      {result && !loading && (
        <div className="result-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Score Breakdown</h3>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-mint)' }}>{result.overall_band}</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overall Band</div>
            </div>
          </div>

          <div className="score-box-detailed">
            {Object.entries(result.sub_scores).map(([key, value]) => (
              <div key={key} className="score-item">
                <span className="label">
                  {key === 'FC' ? 'Fluency & Coherence' : 
                   key === 'LR' ? 'Lexical Resource' : 
                   key === 'GRA' ? 'Grammatical Range & Accuracy' : 'Pronunciation'}
                </span>
                <span className="score-value">{value}</span>
              </div>
            ))}
          </div>
          
          <div className="feedback-section" style={{ marginTop: '2rem' }}>
            <h4>Feedback &amp; Action Items</h4>
            {result.feedback?.improvements?.map((imp, idx) => (
              <div key={idx} className="wr-improvement" style={{ marginBottom: '0.75rem' }}>
                {typeof imp === 'string' ? imp : imp.content || imp.title}
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn-primary" onClick={() => {
              setResult(null); 
              setAudioBlob(null);
            }}>
              Practice Another Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeakingTest;
