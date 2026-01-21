import requests
import base64
import json
import time

def create_github_repo(token, username, repo_name, filename, content):
    """Создает репозиторий на GitHub и загружает код"""
    
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    # 1. Создаем репозиторий
    repo_data = {
        'name': repo_name,
        'description': f'Code analysis for {filename}',
        'private': True,
        'auto_init': False
    }
    
    response = requests.post(
        f'https://api.github.com/user/repos',
        headers=headers,
        json=repo_data
    )
    
    if response.status_code not in [200, 201]:
        return {
            'success': False,
            'error': f'Failed to create repo: {response.text}'
        }
    
    repo_info = response.json()
    repo_url = repo_info['html_url']
    
    # 2. Создаем файл с кодом
    file_content = base64.b64encode(content.encode()).decode()
    
    file_data = {
        'message': f'Add {filename} for analysis',
        'content': file_content
    }
    
    response = requests.put(
        f'https://api.github.com/repos/{username}/{repo_name}/contents/{filename}',
        headers=headers,
        json=file_data
    )
    
    if response.status_code not in [200, 201]:
        return {
            'success': False,
            'error': f'Failed to upload file: {response.text}'
        }
    
    return {
        'success': True,
        'repo_url': repo_url,
        'repo_name': repo_name,
        'actions_url': f'{repo_url}/actions'
    }

def setup_github_workflow(token, username, repo_name, language):
    """Настраивает GitHub Actions workflow для анализа кода"""
    
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    # Workflow конфигурация в зависимости от языка
    workflows = {
        'python': {
            'name': 'Python Code Analysis',
            'on': ['push'],
            'jobs': {
                'analyze': {
                    'runs-on': 'ubuntu-latest',
                    'steps': [
                        {'uses': 'actions/checkout@v2'},
                        {'name': 'Set up Python',
                         'uses': 'actions/setup-python@v2',
                         'with': {'python-version': '3.9'}},
                        {'name': 'Install dependencies',
                         'run': 'pip install flake8 pylint mypy bandit'},
                        {'name': 'Run flake8',
                         'run': 'flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics'},
                        {'name': 'Run pylint',
                         'run': 'pylint $(find . -name "*.py") || true'},
                        {'name': 'Run bandit',
                         'run': 'bandit -r . || true'}
                    ]
                }
            }
        },
        'javascript': {
            'name': 'JavaScript Code Analysis',
            'on': ['push'],
            'jobs': {
                'analyze': {
                    'runs-on': 'ubuntu-latest',
                    'steps': [
                        {'uses': 'actions/checkout@v2'},
                        {'name': 'Set up Node.js',
                         'uses': 'actions/setup-node@v2',
                         'with': {'node-version': '16'}},
                        {'name': 'Install ESLint',
                         'run': 'npm install -g eslint'},
                        {'name': 'Run ESLint',
                         'run': 'eslint . --ext .js || true'}
                    ]
                }
            }
        }
    }
    
    # Используем шаблон для Python по умолчанию
    workflow_config = workflows.get(language, workflows['python'])
    
    # Создаем директорию .github/workflows
    workflow_content = json.dumps(workflow_config, indent=2)
    workflow_content_b64 = base64.b64encode(workflow_content.encode()).decode()
    
    workflow_data = {
        'message': 'Add GitHub Actions workflow',
        'content': workflow_content_b64
    }
    
    response = requests.put(
        f'https://api.github.com/repos/{username}/{repo_name}/contents/.github/workflows/analyze.yml',
        headers=headers,
        json=workflow_data
    )
    
    return response.status_code in [200, 201]
