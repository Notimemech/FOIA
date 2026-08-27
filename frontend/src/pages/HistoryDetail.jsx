import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getScoreColor } from '../utils/scoreColor';

function HistoryDetail() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState('Task Response');

  const categoryDescriptions = {
    'Task Achievement': '📊 Task Achievement: Evaluates accurate summary, key feature selection, and clear overview.',
    'Task Response': '🎓 Task Response: Evaluates complete response to prompt, consistent stance, and well-developed arguments.',
    'Coherence & Cohesion': '🔗 Coherence & Cohesion: Evaluates logical progression, paragraphing, and natural cohesive devices.',
    'Lexical Resource': '✦ Lexical Resource: Evaluates vocabulary range, academic precision, and spelling accuracy.',
    'Grammatical Range & Accuracy': '📝 Grammatical Range & Accuracy: Evaluates sentence variety, complex structures, and grammar control.',
    'Fluency & Coherence': '🗣️ Fluency & Coherence: Evaluates spoken flow, speech rate, and connectivity.',
    'Pronunciation': '🎙️ Pronunciation: Evaluates phonetic clarity, intonation, and stress patterns.'
  };

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);
        
        // Auto select first available category
        if (res.data && res.data.feedback) {
           const categories = ['Task Achievement', 'Task Response', 'Fluency & Coherence', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'];
           const available = categories.find(c => res.data.feedback[c]);
           if (available) setActiveCategory(available);
        }
      } catch (err) {
        console.error(err);
        alert('Assessment record not found');
      } finally {
        setLoading(false);
      }

    };
    fetchAssessment();
  }, [id]);

  const [sampleLoading, setSampleLoading] = useState(false);

  const handleGenerateSample = async () => {
    if (!result) return;
    setSampleLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/assessments/${id}/generate-sample`, {
        part_type: result.part_type,
        task_prompt: result.task_prompt,
        user_input_text: result.user_input_text,
        image_url: result.image_url,
        target_band: result.feedback?.target_band || 7.0,
      });

      if (res.data?.sample_rewrite) {
        setResult(prev => ({
          ...prev,
          feedback: {
            ...(prev.feedback || {}),
            sample_rewrite: res.data.sample_rewrite,
          }
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate model essay. Please try again.');
    } finally {
      setSampleLoading(false);
    }
  };

  if (loading) return <p>Loading assessment details...</p>;
  if (!result) return <p>Assessment record does not exist.</p>;

  return (
    <div className="test-container">
      <Link to="/history" style={{ textDecoration: 'none', color: 'var(--accent-mint)', marginBottom: '1rem', display: 'inline-block', fontWeight: 700 }}>
        &larr; Back to History
      </Link>
      
      <h2>Assessment Details: {result.skill.toUpperCase()} - {result.part_type}</h2>
      
      <div className="form-group">
        <label>Task Prompt:</label>
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', borderLeft: '4px solid var(--border-accent)', borderRadius: '4px' }}>
          {result.task_prompt}
        </div>
      </div>
      
      {result.user_input_text && (
        <div className="form-group">
          <label>Candidate Response:</label>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
            {result.user_input_text}
          </div>
        </div>
      )}

      {result.audio_path && (
        <div className="form-group">
          <label>Audio Recording:</label>
          <div style={{ marginTop: '0.5rem' }}>
            <audio src={`http://localhost:5000${result.audio_path}`} controls style={{ width: '100%', maxWidth: '400px' }}></audio>
          </div>
        </div>
      )}

      <div className="result-section" style={{ marginTop: '2rem', paddingTop: '2rem' }}>
        <div className="result-tabs">
          <div className={`result-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </div>
          <div className={`result-tab ${activeTab === 'task2' ? 'active' : ''}`} onClick={() => setActiveTab('task2')}>
            Details
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Score Details</h3>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(result.overall_band) }}>{result.overall_band}</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Overall Band</div>
          </div>
        </div>

        {result.sub_scores && (
          <div className="score-box-detailed">
            {Object.entries(result.sub_scores).map(([key, value]) => (
              <div key={key} className="score-item">
                <span className="label">
                  {key === 'TA' ? 'Task Achievement' :
                   key === 'TR' ? 'Task Response' : 
                   key === 'CC' ? 'Coherence & Cohesion' : 
                   key === 'LR' ? 'Lexical Resource' : 
                   key === 'GRA' ? 'Grammatical Range & Accuracy' : 
                   key === 'FC' ? 'Fluency & Coherence' : 
                   key === 'PR' ? 'Pronunciation' : key}
                </span>
                <span className="score-value" style={{ color: getScoreColor(value) }}>{value}</span>
              </div>
            ))}
          </div>
        )}
        
        {result.feedback && (
          <>
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Detailed Feedback</h3>
            <div className="feedback-section">
              <div className="category-tabs">
                {['Task Achievement', 'Task Response', 'Fluency & Coherence', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'].map((category) => {
                  if (!result.feedback[category]) return null;
                  const shortName = category === 'Task Achievement' ? 'Task 1' :
                                    category === 'Task Response' ? 'Task 2' :
                                    category === 'Coherence & Cohesion' ? 'Coherence' :
                                    category === 'Fluency & Coherence' ? 'Fluency' :
                                    category === 'Lexical Resource' ? 'Lexical' : 
                                    category === 'Pronunciation' ? 'Pronunciation' : 'Grammar';
                  
                  const keyMap = {
                     'Task Achievement': 'TA',
                     'Task Response': 'TR',
                     'Coherence & Cohesion': 'CC',
                     'Fluency & Coherence': 'FC',
                     'Lexical Resource': 'LR',
                     'Grammatical Range & Accuracy': 'GRA',
                     'Pronunciation': 'PR'
                  };
                  const score = result.sub_scores[keyMap[category]] || '-';
                  const isActive = activeCategory === category;
                  
                  return (
                    <div key={category} className={`category-tab ${isActive ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
                      <span>{shortName}</span>
                      <span className="category-tab-score">{score}</span>
                    </div>
                  );
                })}
              </div>

              {categoryDescriptions[activeCategory] && (
                <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--text-body)', borderLeft: '4px solid var(--border-accent)', fontSize: '0.95rem' }}>
                  {categoryDescriptions[activeCategory]}
                </div>
              )}

              {activeCategory && result.feedback[activeCategory] && (
                <div className="feedback-category-body" style={{ border: 'none', padding: '1rem 0' }}>
                  {Object.entries(result.feedback[activeCategory]).map(([critName, critDetails]) => (
                    <div key={critName} className="criterion-item">
                      <div className="criterion-header">
                        <span className="criterion-title">{critName}</span>
                        <span className="criterion-score">{typeof critDetails.score === 'number' ? critDetails.score.toFixed(1) : critDetails.score}</span>
                      </div>
                      <div className="criterion-comment">{critDetails.comment}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.feedback?.improvements?.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4>Actionable Recommendations</h4>
                  {result.feedback.improvements.map((imp, idx) => (
                    <div key={idx} className="wr-improvement" style={{ marginBottom: '1rem' }}>
                      <div className="wr-improvement-title">💡 {typeof imp === 'string' ? `Tip ${idx + 1}` : imp.title}</div>
                      <div className="wr-improvement-content">{typeof imp === 'string' ? imp : imp.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Model Essay / On-demand generation */}
              {result.skill === 'writing' && (
                <div style={{ marginTop: '2rem' }}>
                  <h4>Model Sample Rewrite (Target Band 8.5+)</h4>
                  {result.feedback?.sample_rewrite ? (
                    <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-muted)', borderRadius: '6px', whiteSpace: 'pre-wrap', color: 'var(--text-heading)', lineHeight: 1.8 }}>
                      {result.feedback.sample_rewrite}
                    </div>
                  ) : (
                    <div className="wr-generate-sample-box" style={{ marginTop: '1rem' }}>
                      <div className="wr-generate-sample-icon">✍️</div>
                      <div className="wr-generate-sample-title">Band 8.5+ Model Response</div>
                      <p className="wr-generate-sample-desc">
                        Generate an on-demand high-scoring model response benchmarked against Band 8.5+ standards.
                      </p>
                      <button
                        type="button"
                        className="wr-btn-generate-sample"
                        onClick={handleGenerateSample}
                        disabled={sampleLoading}
                      >
                        {sampleLoading ? '⏳ Generating Model Essay...' : '✨ Generate Model Essay (Tạo bài viết mẫu)'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryDetail;
