import React from 'react';

const Results = ({ data }) => {
  if (!data.results) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'processing': return '⏳';
      default: return '📊';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-icon">{getStatusIcon(data.status)}</span>
        <h3>{data.fileName}</h3>
        <span className="result-time">{formatDate(data.timestamp)}</span>
      </div>
      
      <div className="result-summary">
        <p><strong>Статус:</strong> {data.results.summary}</p>
      </div>
      
      <div className="result-details">
        <h4>Детали проверки:</h4>
        <ul>
          {Object.entries(data.results.details || {}).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {value}
            </li>
          ))}
        </ul>
      </div>
      
      {data.results.recommendations && data.results.recommendations.length > 0 && (
        <div className="result-recommendations">
          <h4>Рекомендации:</h4>
          <ul>
            {data.results.recommendations.map((rec, index) => (
              <li key={index}>📌 {rec}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="result-actions">
        <button className="btn-download" onClick={() => alert('Feature coming soon!')}>
          📥 Скачать отчет
        </button>
        <button className="btn-share" onClick={() => alert('Feature coming soon!')}>
          🔗 Поделиться
        </button>
      </div>
    </div>
  );
};

export default Results;
