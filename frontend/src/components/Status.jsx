import React, { useState, useEffect } from 'react';

const Status = ({ checkId }) => {
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 1, name: 'Загрузка файла', status: 'completed' },
    { id: 2, name: 'Анализ синтаксиса', status: progress > 20 ? 'completed' : 'pending' },
    { id: 3, name: 'Проверка безопасности', status: progress > 50 ? 'completed' : 'pending' },
    { id: 4, name: 'Анализ качества', status: progress > 80 ? 'completed' : 'pending' },
    { id: 5, name: 'Генерация отчета', status: progress === 100 ? 'completed' : 'pending' },
  ];

  return (
    <div className="status-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        >
          <span>{progress}%</span>
        </div>
      </div>
      
      <div className="status-steps">
        {steps.map(step => (
          <div key={step.id} className={`status-step ${step.status}`}>
            <div className="step-number">{step.id}</div>
            <div className="step-name">{step.name}</div>
            <div className="step-icon">
              {step.status === 'completed' ? '✅' : '⏳'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="status-info">
        <p><strong>ID проверки:</strong> {checkId}</p>
        <p><strong>Статус:</strong> {progress < 100 ? 'В процессе...' : 'Завершено'}</p>
        <p><strong>Примерное время:</strong> {progress < 100 ? '10-15 секунд' : 'Готово'}</p>
      </div>
    </div>
  );
};

export default Status;
