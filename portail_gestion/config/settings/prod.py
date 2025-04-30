from .base import *
import dj_database_url
from dotenv import load_dotenv
import os

load_dotenv()

DEBUG = False

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'votre-domaine.com']

# Vous devriez utiliser une vraie clé secrète en production
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'), 
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "https://localhost:3000", 
]

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' 