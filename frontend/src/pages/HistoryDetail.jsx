import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function HistoryDetail() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState('Task Response');

  const categoryDescriptions = {
    'Task Response': '🎓 Task Response: Đánh giá khả năng trả lời đúng câu hỏi, phát triển ý tưởng và lập luận phù hợp.',
    'Coherence & Cohesion': '🔗 Coherence & Cohesion: Đánh giá khả năng tổ chức bài viết mạch lạc, sử dụng từ nối và liên kết ý tưởng.',
    'Lexical Resource': '✦ Lexical Resource: Đánh giá phạm vi từ vựng, độ chính xác và sự phù hợp trong sử dụng từ.',
    'Grammatical Range & Accuracy': '📝 Grammatical Range & Accuracy: Đánh giá phạm vi cấu trúc ngữ pháp và độ chính xác.',
    'Fluency & Coherence': '🗣️ Fluency & Coherence: Đánh giá độ lưu loát và sự mạch lạc trong câu trả lời.',
    'Pronunciation': '🎙️ Pronunciation: Đánh giá khả năng phát âm, ngữ điệu và độ rõ ràng.'
  };

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/assessments/${id}`);
        setResult(res.data);
        
        // Auto select first available category
        if (res.data && res.data.feedback) {
           const categories = ['Task Response', 'Fluency & Coherence', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'];
           const available = categories.find(c => res.data.feedback[c]);
           if (available) setActiveCategory(available);
        }
      } catch (err) {
        console.error(err);
        alert('Không tìm thấy bài chấm');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  if (loading) return <p>Đang tải chi tiết bài làm...</p>;
  if (!result) return <p>Bài làm không tồn tại.</p>;

  return (
    <div className="test-container">
      <Link to="/history" style={{ textDecoration: 'none', color: '#3498db', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Quay lại lịch sử
      </Link>
      
      <h2>Chi tiết bài làm: {result.skill.toUpperCase()} - {result.part_type}</h2>
      
      <div className="form-group">
        <label>Đề bài:</label>
        <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderLeft: '4px solid #3498db' }}>
          {result.task_prompt}
        </div>
      </div>
      
      {result.user_input_text && (
        <div className="form-group">
          <label>Bài làm của bạn:</label>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
            {result.user_input_text}
          </div>
        </div>
      )}

      {result.audio_path && (
        <div className="form-group">
          <label>File ghi âm:</label>
          <div style={{ marginTop: '0.5rem' }}>
            <audio src={`http://localhost:5000${result.audio_path}`} controls style={{ width: '100%', maxWidth: '400px' }}></audio>
          </div>
        </div>
      )}

      <div className="result-section" style={{ marginTop: '2rem', paddingTop: '2rem' }}>
        <div className="result-tabs">
          <div className={`result-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Tổng quan
          </div>
          <div className={`result-tab ${activeTab === 'task2' ? 'active' : ''}`} onClick={() => setActiveTab('task2')}>
            Chi tiết
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Chi tiết điểm số</h3>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1abc9c' }}>{result.overall_band}</span>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Điểm tổng</div>
          </div>
        </div>

        {result.sub_scores && (
          <div className="score-box-detailed">
            {Object.entries(result.sub_scores).map(([key, value]) => (
              <div key={key} className="score-item">
                <span className="label">
                  {key === 'TR' ? 'Task Response' : 
                   key === 'CC' ? 'Coherence & Cohesion' : 
                   key === 'LR' ? 'Lexical Resource' : 
                   key === 'GRA' ? 'Grammatical Range & Accuracy' : 
                   key === 'FC' ? 'Fluency & Coherence' : 
                   key === 'PR' ? 'Pronunciation' : key}
                </span>
                <span className="score-value">{value}</span>
              </div>
            ))}
          </div>
        )}
        
        {result.feedback && (
          <>
            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Nhận xét chi tiết</h3>
            <div className="feedback-section">
              <div className="category-tabs">
                {['Task Response', 'Fluency & Coherence', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'].map((category) => {
                  if (!result.feedback[category]) return null;
                  const shortName = category === 'Task Response' ? 'Task' :
                                    category === 'Coherence & Cohesion' ? 'Coherence' :
                                    category === 'Fluency & Coherence' ? 'Fluency' :
                                    category === 'Lexical Resource' ? 'Lexical' : 
                                    category === 'Pronunciation' ? 'Pronunciation' : 'Grammar';
                  
                  // Need a safe way to map category to short key in sub_scores
                  const keyMap = {
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
                <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#555', borderLeft: '4px solid #bdc3c7', fontSize: '0.95rem' }}>
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
                  <h4>Tổng hợp cách cải thiện</h4>
                  {result.feedback.improvements.map((imp, idx) => {
                  if (typeof imp === 'string') {
                    // Try to parse the string in frontend for instant UI update
                    let textToParse = imp;
                    const introMatch = textToParse.match(/([\s\S]*?\-\-\-)/);
                    if (introMatch) {
                        textToParse = textToParse.substring(introMatch[0].length);
                    }
                    const regex = /(?:\*\s*)?\*\*(.*?)\*\*(?:\:|\s*-)?\s*([\s\S]*?)(?=(?:\*\s*)?\*\*|$)/g;
                    let match;
                    const parsed = [];
                    while ((match = regex.exec(textToParse)) !== null) {
                        if (match[1].trim().toLowerCase() === 'original text' || match[1].trim().toLowerCase() === 'improvements') continue;
                        parsed.push({
                            title: match[1].trim(),
                            content: match[2].trim().replace(/^\*\s*/, '')
                        });
                    }
                    
                    if (parsed.length > 0) {
                      return parsed.map((p, pIdx) => (
                        <div key={`${idx}-${pIdx}`} className="improvement-box" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff', borderLeft: '4px solid #f39c12', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2c3e50' }}>💡 {p.title}</div>
                          <div style={{ color: '#555', lineHeight: '1.5' }}>{p.content}</div>
                        </div>
                      ));
                    }
                    
                    return <div key={idx} className="feedback-item" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff', borderLeft: '4px solid #f39c12', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>{imp}</div>;
                  }
                  return (
                    <div key={idx} className="improvement-box" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff', borderLeft: '4px solid #f39c12', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2c3e50' }}>💡 {imp.title}</div>
                      <div style={{ color: '#555', lineHeight: '1.5' }}>{imp.content}</div>
                    </div>
                  );
                })}
                </div>
              )}

              {result.feedback?.sample_rewrite && (
                <div style={{ marginTop: '2rem' }}>
                  <h4>Bài mẫu tham khảo (Target Band 7.0+)</h4>
                  <div style={{ padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {result.feedback.sample_rewrite}
                  </div>
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
