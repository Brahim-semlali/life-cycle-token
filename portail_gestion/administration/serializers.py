from rest_framework import serializers
from .models import User, UserLanguage
import uuid


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'code', 'email', 'password', 'first_name', 'last_name', 'phone',
            'status', 'attempts', 'language', 'start_validity', 'end_validity',
            'profile', 'customer'
        ]
        read_only_fields = ['id', 'attempts', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
            'code': {'required': False},
            'email': {'required': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        first_name = validated_data.get('first_name', '').lower()
        last_name = validated_data.get('last_name', '').lower()
        
        user_count = User.objects.filter(first_name=first_name, last_name=last_name).count() + 1
        code = f"{first_name}_{last_name}_{user_count}"
        
        validated_data['code'] = code

        instance = self.Meta.model(**validated_data)

        if password is not None:
            instance.set_password(password) 
        instance.save()
        return instance


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['language']