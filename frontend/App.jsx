import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Results from './components/Results';
import Status from './components/Status';
import './styles/main.css';

function App() {
  const [currentCheck, setCurrentCheck] = useState(null);
  const [recentChecks, setRecentChecks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('codeFile', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setCurrentCheck(data.checkId);
      pollCheckStatus(data.checkId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  const pollCheckStatus = async (checkId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/check/${checkId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setRecentChecks(prev => [data, ...prev.slice(0, 4)]);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  useEffect(() => {
    // Загрузка истории проверок
    fetch('http://localhost:5000/api/checks')
      .then(res => res.json())
      .then(data => setRecentChecks(data.slice(0, 5)));
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🔍 Code Integrity Checker</h1>
        <p>Загрузите файл с кодом для автоматической проверки качества</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <FileUpload onFileUpload={handleFileUpload} loading={loading} />
        </div>

        {currentCheck && (
          <div className="current-check">
            <h2>Текущая проверка</h2>
            <Status checkId={currentCheck} />
          </div>
        )}

        <div className="results-section">
          <h2>Последние проверки</h2>
          {recentChecks.length > 0 ? (
            recentChecks.map(check => (
              <Results key={check.id} data={check} />
            ))
          ) : (
            <p className="no-results">Нет выполненных проверок</p>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>CI/CD Code Checker v1.0 | Поддерживаемые языки: JavaScript, TypeScript, Python, Java, C++, Go, PHP, Ruby</p>
      </footer>
    </div>
  );
}

export default App;
