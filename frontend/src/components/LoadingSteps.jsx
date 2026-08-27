import React, { useState, useEffect } from 'react';

const steps = [
  { id: 1, label: 'Submitting response to examination server...', duration: 1000 },
  { id: 2, label: 'Evaluating grammar, lexical density & cohesion...', duration: 3000 },
  { id: 3, label: 'Benchmarking against Target Band descriptors...', duration: 2500 },
  { id: 4, label: 'Generating detailed sub-criteria feedback...', duration: 3500 },
  { id: 5, label: 'Synthesizing action items & model sample essay...', duration: 2000 }
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
      <h3 style={{ textAlign: 'center', marginTop: '1rem' }}>AI Examiner is grading your submission...</h3>
      
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
