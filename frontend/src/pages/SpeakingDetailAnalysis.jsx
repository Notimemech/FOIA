import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../style/speakingResult.css';

function SpeakingDetailAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Model answer state
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);
        if (res.data.feedback?.sample_answer || res.data.feedback?.sample_rewrite) {
          setSampleAnswer(res.data.feedback?.sample_answer || res.data.feedback?.sample_rewrite);
        }
      } catch (err) {
        console.error(err);
        alert('Assessment not found.');
        navigate('/speaking');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id, navigate]);

  const handleGenerateSample = async () => {
    setSampleLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/assessments/${id}/generate-sample`, {
        skill: 'speaking',
        part_type: result.part_type,
        task_prompt: result.task_prompt,
        target_band: 8.5,
      });

      if (res.data?.sample_answer || res.data?.sample_rewrite) {
        setSampleAnswer(res.data.sample_answer || res.data.sample_rewrite);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate model response. Please try again.');
    } finally {
      setSampleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sd-loading-screen">
        <div className="sd-spinner" />
        <p>Loading Detailed Error Correction & Model Answers...</p>
      </div>
    );
  }

  if (!result) return null;

  const feedback = result.feedback || {};
  const improvements = feedback.improvements || [];
  const targetAnalysis = feedback.target_band_analysis || {};
  const targetBand = Number(feedback.target_band ?? result.target_band ?? 7.0);

  return (
    <div className="sd-page">
      {/* ── TOP GREEN HEADER ── */}
      <header className="sd-header">
        <Link to={`/speaking/result/${id}`} className="sd-btn-back">
          ← Back to Speaking Result
        </Link>
        <h1 className="sd-header-title">Detailed Analysis & Model Answers</h1>
        <div className="sd-header-meta">
          <span>Target Band</span>
          <strong>{targetBand.toFixed(1)}</strong>
        </div>
      </header>

      <div className="sd-detail-container">
        {/* SECTION 1: MODEL SPOKEN ANSWER */}
        <div className="sd-card sd-detail-card">
          <div className="sd-detail-section-header">
            <span className="sd-detail-icon">🏆</span>
            <div>
              <h2>Band 8.5+ Model Spoken Answer</h2>
              <p>Exemplary spoken response demonstrating native discourse markers, rich collocations, and idiomatic phrasing.</p>
            </div>
          </div>

          {sampleAnswer ? (
            <div className="sd-sample-content-box">
              <div className="sd-sample-pill">Official Band 8.5+ Model Script</div>
              {sampleAnswer.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ) : (
            <div className="sd-generate-cta-box">
              <p>Generate an on-demand Band 8.5+ native speaker spoken answer customized for this exact prompt.</p>
              <button
                type="button"
                className="sd-btn-generate-main"
                disabled={sampleLoading}
                onClick={handleGenerateSample}
              >
                {sampleLoading ? '⏳ Generating Model Script...' : '✨ Generate Band 8.5+ Model Spoken Script'}
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: TARGET BAND GAP ANALYSIS */}
        <div className="sd-card sd-detail-card">
          <div className="sd-detail-section-header">
            <span className="sd-detail-icon">🎯</span>
            <div>
              <h2>Target Band Benchmark Analysis</h2>
              <p>Strengths identified and key linguistic gaps to bridge for Band {targetBand.toFixed(1)}.</p>
            </div>
          </div>

          <div className="sd-target-gap-grid">
            <div className="sd-gap-card strengths">
              <h3>✅ Key Strengths</h3>
              <ul>
                {(targetAnalysis.strengths && targetAnalysis.strengths.length > 0
                  ? targetAnalysis.strengths
                  : ['Natural delivery with coherent topic extension', 'Phonetic intelligibility and clear articulation']
                ).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="sd-gap-card gaps">
              <h3>🔍 Key Gaps to Bridge</h3>
              <ul>
                {(targetAnalysis.key_gaps && targetAnalysis.key_gaps.length > 0
                  ? targetAnalysis.key_gaps
                  : ['Incorporate more diverse idiomatic expressions', 'Refine sentence stress and intonation variation']
                ).map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 3: ACTIONABLE IMPROVEMENTS */}
        <div className="sd-card sd-detail-card">
          <div className="sd-detail-section-header">
            <span className="sd-detail-icon">💡</span>
            <div>
              <h2>Actionable Speaking Improvements</h2>
              <p>Concrete vocabulary and pronunciation strategies to raise your score.</p>
            </div>
          </div>

          <div className="sd-improvements-list">
            {improvements.map((imp, idx) => (
              <div key={idx} className="sd-imp-row">
                <div className="sd-imp-badge">{idx + 1}</div>
                <div className="sd-imp-text">
                  <h4>{imp.title}</h4>
                  <p>{imp.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="sd-footer-bar">
          <Link to={`/speaking/result/${id}`} className="sd-btn-back-result">
            ← Return to Speaking Detail Scorecard
          </Link>
          <Link to="/speaking" className="sd-btn-new-test">
            🎙️ Practice Another Test
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SpeakingDetailAnalysis;
