import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from administration.models import User

# Données du superuser
user_data = {
    'email': 'admin@example.com',
    'password': 'admin1234',
    'first_name': 'Admin',
    'last_name': 'System',
    'is_staff': True,
    'is_superuser': True,
    'is_active': True,
    'code': 'ADMIN_001',
    'status': 'ACTIVE'
}

if not User.objects.filter(email=user_data['email']).exists():
    user = User(**user_data)
    user.set_password(user_data['password'])
    user.save()
    print(f"Superuser créé : {user_data['email']} / {user_data['password']}")
else:
    print("Le superuser existe déjà.")