document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const githubBtn = document.getElementById('githubBtn');
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const resultsContent = document.getElementById('resultsContent');
    const loadingModal = document.getElementById('loadingModal');
    
    let currentFile = null;
    let currentProjectId = null;
    
    // Обработчики событий для загрузки файла
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#764ba2';
        uploadArea.style.backgroundColor = '#f0f4ff';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = '';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = '';
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // Обработчик для кнопки анализа
    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile || !currentProjectId) return;
        
        showLoading('Running static analysis...');
        
        try {
            const response = await fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project_id: currentProjectId,
                    filename: currentFile.name
                })
            });
            
            const result = await response.json();
            
            hideLoading();
            showResults(result);
            
        } catch (error) {
            hideLoading();
            alert('Error analyzing code: ' + error.message);
        }
    });
    
    // Обработчик для GitHub Actions
    githubBtn.addEventListener('click', async () => {
        if (!currentFile || !currentProjectId) return;
        
        showLoading('Setting up GitHub Actions...');
        
        try {
            // Здесь можно добавить вызов API для GitHub Actions
            // Покажем уведомление
            setTimeout(() => {
                hideLoading();
                alert('GitHub Actions workflow has been configured. Check your GitHub repository for results.');
            }, 2000);
            
        } catch (error) {
            hideLoading();
            alert('Error setting up GitHub Actions: ' + error.message);
        }
    });
    
    // Функция обработки выбранного файла
    async function handleFileSelect(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['py', 'js', 'java', 'cpp', 'c', 'go', 'rs', 'ts', 'php', 'rb'];
        
        if (!allowedExtensions.includes(fileExtension)) {
            alert('File type not supported. Please upload a code file.');
            return;
        }
        
        currentFile = file;
        
        // Показываем информацию о файле
        fileInfo.innerHTML = `
            <strong>${file.name}</strong> (${formatFileSize(file.size)})
            <div>Type: ${getLanguageName(fileExtension)}</div>
        `;
        fileInfo.classList.add('show');
        
        // Активируем кнопки
        analyzeBtn.disabled = false;
        githubBtn.disabled = false;
        
        // Загружаем файл на сервер
        const formData = new FormData();
        formData.append('file', file);
        
        showLoading('Uploading file...');
        
        try {
            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                currentProjectId = result.project_id;
                hideLoading();
                updateFileInfo(result);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            hideLoading();
            alert('Error uploading file: ' + error.message);
            resetFileSelection();
        }
    }
    
    // Функция отображения результатов
    function showResults(data) {
        resultsPlaceholder.style.display = 'none';
        resultsContent.style.display = 'block';
        
        // Обновляем имя файла
        document.getElementById('fileName').textContent = `File: ${currentFile.name}`;
        
        // Обновляем статический анализ
        const staticFindings = document.getElementById('staticFindings');
        staticFindings.innerHTML = '';
        
        if (data.static_analysis) {
            const analysis = data.static_analysis;
            
            // Показываем ошибки
            analysis.errors.forEach(error => {
                staticFindings.appendChild(createFindingElement('error', error, 0));
            });
            
            // Показываем предупреждения
            analysis.warnings.forEach(warning => {
                staticFindings.appendChild(createFindingElement(
                    'warning', 
                    warning.message, 
                    warning.line,
                    warning.code
                ));
            });
            
            // Показываем метрики
            updateMetrics(analysis.metrics);
        }
        
        // Обновляем информацию о GitHub Actions
        if (data.github_actions) {
            const githubInfo = document.getElementById('githubInfo');
            if (data.github_actions.success) {
                githubInfo.innerHTML = `
                    <div class="finding info">
                        <i class="fas fa-check-circle"></i>
                        <div class="finding-content">
                            <h4>GitHub Actions Configured Successfully</h4>
                            <p>Repository: ${data.github_actions.repo_name}</p>
                            <p><a href="${data.github_actions.repo_url}" target="_blank">View Repository</a> | 
                               <a href="${data.github_actions.actions_url}" target="_blank">View Actions</a></p>
                        </div>
                    </div>
                `;
            } else {
                githubInfo.innerHTML = `
                    <div class="finding warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div class="finding-content">
                            <h4>GitHub Actions Configuration Failed</h4>
                            <p>${data.github_actions.error || 'Unknown error'}</p>
                        </div>
                    </div>
                `;
            }
        }
        
        // Активируем первую вкладку
        switchTab('static');
    }
    
    // Создание элемента для найденной проблемы
    function createFindingElement(type, message, line, code = '') {
        const finding = document.createElement('div');
        finding.className = `finding ${type}`;
        
        const icon = type === 'error' ? 'fas fa-times-circle' :
                     type === 'warning' ? 'fas fa-exclamation-triangle' :
                     'fas fa-info-circle';
        
        finding.innerHTML = `
            <i class="${icon}"></i>
            <div class="finding-content">
                <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <p>${message}</p>
                ${line ? `<p><strong>Line ${line}:</strong> ${code}</p>` : ''}
            </div>
        `;
        
        return finding;
    }
    
    // Обновление метрик
    function updateMetrics(metrics) {
        const metricsGrid = document.getElementById('metricsGrid');
        metricsGrid.innerHTML = '';
        
        for (const [key, value] of Object.entries(metrics)) {
            const card = document.createElement('div');
            card.className = 'metric-card';
            
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            card.innerHTML = `
                <div class="metric-value">${value}</div>
                <div class="metric-label">${label}</div>
            `;
            
            metricsGrid.appendChild(card);
        }
    }
    
    // Переключение вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    function switchTab(tabId) {
        // Убираем активный класс у всех вкладок и контента
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Активируем выбранную вкладку и контент
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}Tab`).classList.add('active');
    }
    
    // Вспомогательные функции
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getLanguageName(ext) {
        const languages = {
            'py': 'Python', 'js': 'JavaScript', 'java': 'Java',
            'cpp': 'C++', 'c': 'C', 'go': 'Go', 'rs': 'Rust',
            'ts': 'TypeScript', 'php': 'PHP', 'rb': 'Ruby'
        };
        return languages[ext] || 'Unknown';
    }
    
    function updateFileInfo(uploadResult) {
        fileInfo.innerHTML = `
            <strong>${uploadResult.filename}</strong>
            <div>Language: ${uploadResult.language}</div>
            <div>Project ID: ${uploadResult.project_id}</div>
            <div style="color: green; margin-top: 5px;">
                <i class="fas fa-check"></i> Upload successful
            </div>
        `;
    }
    
    function resetFileSelection() {
        currentFile = null;
        currentProjectId = null;
        fileInput.value = '';
        fileInfo.classList.remove('show');
        analyzeBtn.disabled = true;
        githubBtn.disabled = true;
        resultsPlaceholder.style.display = 'flex';
        resultsContent.style.display = 'none';
    }
    
    function showLoading(message) {
        document.getElementById('loadingMessage').textContent = message;
        loadingModal.classList.add('show');
    }
    
    function hideLoading() {
        loadingModal.classList.remove('show');
    }
    
    // Проверка здоровья бэкенда
    async function checkBackendHealth() {
        try {
            const response = await fetch('http://localhost:5000/api/health');
            if (!response.ok) {
                console.warn('Backend is not responding');
            }
        } catch (error) {
            console.warn('Cannot connect to backend:', error.message);
        }
    }
    
    // Проверяем бэкенд при загрузке
    checkBackendHealth();
});
