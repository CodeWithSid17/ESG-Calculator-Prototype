"""
Django settings for the ESG Calculator Prototype.

This is intentionally kept SIMPLE because this is only a demo project.
No authentication, no production security hardening.
"""

from pathlib import Path

# BASE_DIR points to the "backend" folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Secret key - fine to hardcode for a prototype (NEVER do this in production)
SECRET_KEY = 'django-insecure-esg-calculator-demo-key'

# Debug True so we get helpful error pages while developing
DEBUG = True

# Allow all hosts since this is just a local demo
ALLOWED_HOSTS = ['*']

# Apps used by this project
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',   # Django REST Framework for building APIs
    'corsheaders',       # Allows React (different port) to call this API

    # Our own app
    'calculator',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',   # Must be placed high in the list
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Allow the React dev server (http://localhost:5173 or 3000) to call the API
CORS_ALLOW_ALL_ORIGINS = True  # Fine for a local prototype only

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database - SQLite as requested (a single file on disk, no server needed)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validators - left as Django defaults, not really used since
# there is no authentication in this prototype
AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework settings - keep it simple, no auth/permissions
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [],  # No permission checks (prototype only)
    'DEFAULT_AUTHENTICATION_CLASSES': [],  # No authentication (prototype only)
}
