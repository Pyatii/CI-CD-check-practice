from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import subprocess
import tempfile
import shutil
from werkzeug.utils import secure_filename
import json
from utils.github_actions import create_github_repo, setup_github_workflow

app = Flask(__name__)
CORS(app)

# Конфигурация
UPLOAD_FOLDER = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'py', 'js', 'java', 'cpp', 'c', 'go', 'rs', 'ts', 'php', 'rb'}
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_USERNAME = os.environ.get('GITHUB_USERNAME')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Создаем уникальную директорию для проекта
        project_id = str(uuid.uuid4())
        project_dir = os.path.join(UPLOAD_FOLDER, project_id)
        os.makedirs(project_dir, exist_ok=True)
        
        # Сохраняем файл
        filename = secure_filename(file.filename)
        file_path = os.path.join(project_dir, filename)
        file.save(file_path)
        
        # Определяем язык программирования
        ext = filename.rsplit('.', 1)[1].lower()
        languages = {
            'py': 'Python',
            'js': 'JavaScript',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'go': 'Go',
            'rs': 'Rust',
            'ts': 'TypeScript',
            'php': 'PHP',
            'rb': 'Ruby'
        }
        language = languages.get(ext, 'Unknown')
        
        return jsonify({
            'message': 'File uploaded successfully',
            'project_id': project_id,
            'filename': filename,
            'language': language,
            'file_path': file_path
        }), 200
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/api/analyze', methods=['POST'])
def analyze_code():
    data = request.json
    project_id = data.get('project_id')
    filename = data.get('filename')
    
    if not project_id or not filename:
        return jsonify({'error': 'Missing project_id or filename'}), 400
    
    project_dir = os.path.join(UPLOAD_FOLDER, project_id)
    file_path = os.path.join(project_dir, filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Базовый статический анализ
    analysis_result = perform_static_analysis(file_path)
    
    # Опционально: создаем репозиторий и запускаем GitHub Actions
    github_result = None
    if GITHUB_TOKEN and GITHUB_USERNAME:
        try:
            with open(file_path, 'r') as f:
                code_content = f.read()
            
            repo_name = f"code-analysis-{project_id[:8]}"
            github_result = create_github_repo(
                GITHUB_TOKEN, 
                GITHUB_USERNAME, 
                repo_name,
                filename,
                code_content
            )
            
            if github_result.get('success'):
                setup_github_workflow(
                    GITHUB_TOKEN,
                    GITHUB_USERNAME,
                    repo_name,
                    filename.rsplit('.', 1)[1].lower()
                )
        except Exception as e:
            github_result = {'error': str(e)}
    
    return jsonify({
        'static_analysis': analysis_result,
        'github_actions': github_result,
        'project_id': project_id
    }), 200

@app.route('/api/results/<project_id>', methods=['GET'])
def get_results(project_id):
    # Здесь можно получить результаты GitHub Actions через GitHub API
    # Для простоты возвращаем фиктивные данные
    return jsonify({
        'status': 'completed',
        'project_id': project_id,
        'findings': [
            {'type': 'warning', 'message': 'Unused variable found', 'line': 10},
            {'type': 'error', 'message': 'Syntax error', 'line': 15},
            {'type': 'info', 'message': 'Code complexity is high', 'line': 0}
        ]
    }), 200

def perform_static_analysis(file_path):
    """Выполняет базовый статический анализ кода"""
    results = {
        'errors': [],
        'warnings': [],
        'metrics': {}
    }
    
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        # Простые проверки
        for i, line in enumerate(lines, 1):
            line = line.rstrip()
            
            # Проверка длины строки
            if len(line) > 120:
                results['warnings'].append({
                    'line': i,
                    'message': f'Line too long ({len(line)} characters)',
                    'code': line[:50] + '...' if len(line) > 50 else line
                })
            
            # Проверка на табы
            if '\t' in line:
                results['warnings'].append({
                    'line': i,
                    'message': 'Tab character found, use spaces instead',
                    'code': line.replace('\t', '→')
                })
        
        # Базовые метрики
        results['metrics'] = {
            'total_lines': len(lines),
            'non_empty_lines': sum(1 for line in lines if line.strip()),
            'file_size': os.path.getsize(file_path)
        }
        
    except Exception as e:
        results['errors'].append(str(e))
    
    return results

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
