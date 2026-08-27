import React, { useState, useEffect } from 'react';

const steps = [
  { id: 1, label: 'Đang gửi bài nộp...', duration: 1000 },
  { id: 2, label: 'Model 1 đang viết lại bài mẫu...', duration: 3000 },
  { id: 3, label: 'Model 1 đang tự chấm điểm...', duration: 2500 },
  { id: 4, label: 'Model 2 đang chấm chéo (Cross-check)...', duration: 3500 },
  { id: 5, label: 'Đang so sánh điểm và tổng hợp nhận xét...', duration: 2000 }
];

function LoadingSteps() {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout;
    let progressInterval;

    if (currentStep <= steps.length) {
      const step = steps[currentStep - 1];
      
      // Animate progress bar for current step
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += (100 / (step.duration / 50));
        if (currentProgress > 100) currentProgress = 100;
        setProgress(currentProgress);
      }, 50);

      // Move to next step
      timeout = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(0);
        setCurrentStep(prev => prev + 1);
      }, step.duration);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
    };
  }, [currentStep]);

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <h3 style={{ textAlign: 'center', marginTop: '1rem' }}>Hệ thống đang chấm bài của bạn...</h3>
      
      <div className="steps-container">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className={`step-item ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
              <div className="step-label">
                <span className="step-icon">
                  {isCompleted ? '✅' : isCurrent ? '⏳' : '⚪'}
                </span>
                {step.label}
              </div>
              
              {isCurrent && (
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LoadingSteps;
