import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <div className="home-header">
        <h1>IELTS Preparation Platform</h1>
        <p>Select the skill you want to practice and get instant AI assessment</p>
      </div>
      
      <div className="skills-grid">
        <Link to="/writing" className="skill-card">
          <h2>Writing</h2>
          <p>Academic Task 1, Task 2 essays, and 60-minute Full Test simulation with detailed rubric grading.</p>
        </Link>
        
        <Link to="/speaking" className="skill-card">
          <h2>Speaking</h2>
          <p>Practice speaking topics, record responses, and receive fluency, pronunciation & lexical feedback.</p>
        </Link>
        
        <div className="skill-card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <h2>Listening</h2>
          <p>Real-life academic audio conversations and comprehension quizzes (Coming soon).</p>
        </div>
        
        <div className="skill-card" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <h2>Reading</h2>
          <p>Academic reading passages with authentic question formats (Coming soon).</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
