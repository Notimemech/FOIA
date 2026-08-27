import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Luyện thi IELTS</h1>
      <p>Chọn kỹ năng bạn muốn luyện tập hôm nay</p>
      
      <div className="skills-grid">
        <Link to="/writing" className="skill-card" style={{ borderTop: '4px solid #e74c3c' }}>
          <h2>Writing</h2>
          <p>Viết chuẩn ngữ pháp, diễn đạt mạch lạc.</p>
        </Link>
        
        <Link to="/speaking" className="skill-card" style={{ borderTop: '4px solid #f39c12' }}>
          <h2>Speaking</h2>
          <p>Nói tự tin, phản xạ nhanh với các chủ đề.</p>
        </Link>
        
        <div className="skill-card" style={{ borderTop: '4px solid #3498db', opacity: 0.6 }}>
          <h2>Listening (Coming soon)</h2>
          <p>Luyện nghe hội thoại thực tế.</p>
        </div>
        
        <div className="skill-card" style={{ borderTop: '4px solid #2ecc71', opacity: 0.6 }}>
          <h2>Reading (Coming soon)</h2>
          <p>Đọc hiểu đa dạng chủ đề.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
