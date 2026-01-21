import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onFileUpload, loading }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.js', '.ts', '.py', '.java', '.cpp', '.go', '.php', '.rb', '.json', '.yml', '.yaml', '.md'],
      'application/json': ['.json'],
      'application/xml': ['.xml']
    },
    maxFiles: 1,
    maxSize: 10485760 // 10MB
  });

  return (
    <div className="file-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Проверка выполняется...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              📁
            </div>
            {isDragActive ? (
              <p>Отпустите файл для загрузки</p>
            ) : (
              <>
                <p className="upload-text">Перетащите файл сюда или нажмите для выбора</p>
                <p className="upload-subtext">Максимальный размер: 10MB</p>
                <p className="upload-subtext">Поддерживаемые форматы: .js, .ts, .py, .java, .cpp, .go, .php, .rb</p>
              </>
            )}
          </>
        )}
      </div>
      
      <div className="upload-examples">
        <h4>Примеры проверяемых файлов:</h4>
        <ul>
          <li>JavaScript/TypeScript: проверка синтаксиса, линтинг</li>
          <li>Python: проверка PEP8, импортов</li>
          <li>Java: компиляция, проверка стиля</li>
          <li>Конфигурационные файлы: JSON, YAML валидация</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
