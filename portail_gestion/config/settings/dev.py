from .base import *
import dj_database_url
from dotenv import load_dotenv
import os

# Charge les variables d'environnement depuis le fichier .env
load_dotenv()

ALLOWED_HOSTS = ['*']

DEBUG = True

SECRET_KEY = 'django-insecure-^i110l)jgxo5zqfb5-n!yhd0e%8f9%8z-98@v%x0)c3sg7(wuw'

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

# SSL Configuration
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# SSL Certificate paths
SSL_CERTIFICATE = os.path.join(BASE_DIR, 'certs', 'localhost.pem')
SSL_KEY = os.path.join(BASE_DIR, 'certs', 'localhost-key.pem') 