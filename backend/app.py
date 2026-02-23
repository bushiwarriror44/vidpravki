from flask import Flask, send_from_directory, request, jsonify, redirect, url_for
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import timedelta
from dotenv import load_dotenv
import os
import logging
import traceback

from models import db, init_all_models, SiteIcon
from api_routes import api_bp
from admin_routes import admin_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

env_path = os.path.join(PROJECT_ROOT, '.env')
load_dotenv(env_path)

if os.path.exists(os.path.join(PROJECT_ROOT, 'frontend', 'dist')):
    static_folder = os.path.join(PROJECT_ROOT, 'frontend', 'dist')
else:
    static_folder = os.path.join(PROJECT_ROOT, 'dist')

app = Flask(__name__,
            template_folder='views',
            static_folder=static_folder,
            static_url_path='')

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=12)
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['WTF_CSRF_TIME_LIMIT'] = None

csrf = CSRFProtect(app)

allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=allowed_origins, supports_credentials=True)

if os.path.exists(os.path.join(BASE_DIR, 'data')):
    data_dir = os.path.join(BASE_DIR, 'data')
else:
    data_dir = os.path.join(PROJECT_ROOT, 'data')

os.makedirs(data_dir, exist_ok=True)
uploads_dir = os.path.join(data_dir, "uploads")
os.makedirs(uploads_dir, exist_ok=True)

security_log_path = os.path.join(data_dir, 'security.log')
if not os.path.exists(security_log_path):
    open(security_log_path, 'a').close()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(security_log_path),
        logging.StreamHandler()
    ]
)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(data_dir, "app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

db.init_app(app)

csrf.exempt(api_bp)

app.register_blueprint(api_bp)
app.register_blueprint(admin_bp)

_db_initialized = False

def init_db():
    global _db_initialized
    if not _db_initialized:
        try:
            with app.app_context():
                init_all_models()
            _db_initialized = True
        except Exception as e:
            logging.getLogger(__name__).exception("init_db failed: %s", e)
            raise

@app.before_request
def before_first_request():
    init_db()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    if path.startswith('admin'):
        return redirect(url_for('admin.admin_panel'))

    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)

    index_path = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, 'index.html')

    return jsonify({'error': 'Frontend not built'}), 404


@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(uploads_dir, filename)


@app.route('/favicon.ico')
def favicon():
    """
    Возвращает favicon для сайта.
    1. Если в БД есть кастомная иконка (SiteIcon) — делаем редирект на неё (например, /uploads/site/...)
    2. Если кастомной нет — пробуем отдать статический favicon.ico из собранного фронтенда.
    """
    try:
        icon = SiteIcon.query.first()
        if icon and icon.icon_path:
            # icon_path уже начинается с /uploads/..., просто редиректим
            return redirect(icon.icon_path)
    except Exception:
        # не ломаем сайт, если что-то пошло не так при чтении БД
        pass

    # Фолбэк: отдать favicon.ico из dist, если он там есть
    static_favicon = os.path.join(app.static_folder, 'favicon.ico')
    if os.path.exists(static_favicon):
        return send_from_directory(app.static_folder, 'favicon.ico')

    # Если ничего нет — пустой ответ
    return ('', 204)

@app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/admin/api/'):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'path': request.path
        }), 404

    return serve_spa(request.path.lstrip('/'))

@app.errorhandler(413)
def request_entity_too_large(error):
    if request.path.startswith('/api/') or request.path.startswith('/admin/api/'):
        return jsonify({
            'error': 'Payload Too Large',
            'message': 'Размер файла превышает допустимый лимит (макс. 100 МБ)',
            'success': False
        }), 413
    return jsonify({
        'error': 'Payload Too Large',
        'message': 'Размер файла превышает допустимый лимит (макс. 100 МБ)'
    }), 413


@app.errorhandler(500)
def internal_error(error):
    security_logger = logging.getLogger('security')
    security_logger.error("Internal server error: %s\n%s", error, traceback.format_exc())

    if request.path.startswith('/api/') or request.path.startswith('/admin/api/'):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500

    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

@app.errorhandler(403)
def forbidden_error(error):
    if request.path.startswith('/api/') or request.path.startswith('/admin/api/'):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403

    return redirect('/admin/login')

if __name__ == '__main__':
    with app.app_context():
        init_all_models()
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
