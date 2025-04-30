import jwt , datetime
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, UserStatus, UserLanguage
from .serializers import UserSerializer, UserUpdateSerializer, UserLanguageSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]  # On laisse AllowAny car on fait notre propre vérification

    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data['email']
        password = request.data['password']


        user = User.objects.filter(email=email).first()
        if user is None:
            raise AuthenticationFailed("User not found!")
        
        
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect password!")
        
        payload = {
            'id' : user.id,
            'exp' : datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat' : datetime.datetime.utcnow()
        }

        token = jwt.encode(payload ,'secret' , algorithm= 'HS256')

        response = Response()

        response.set_cookie(key='jwt' , value= token , httponly= True)
        response.data = {
            "jwt": token
        }
        return response

class UserListView(APIView):
    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        # Récupérer l'utilisateur authentifié
        user = User.objects.filter(id=payload['id']).first()
        serializer = UserSerializer(user)
        return Response(serializer.data)


class UserListAllView(APIView):
    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        # Récupérer tous les utilisateurs
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
        
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self , request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            "message" : "success"
        }
        return response

class UserUpdateView(APIView):
    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        # Récupérer l'ID de l'utilisateur à partir des données de la requête
        user_id = request.data.get('id')
        if not user_id:
            raise NotFound('User  ID not provided!')

        user = User.objects.filter(id=user_id).first()
        if not user:
            raise NotFound('User  not found!')

        serializer = UserUpdateSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDeleteView(APIView):
    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user_id = request.data.get('id')
        if not user_id:
            raise NotFound('User  ID not provided!')

        user = User.objects.filter(id=user_id).first()
        if not user:
            raise NotFound('User  not found!')

        user.delete()
        return Response({"message": "User  deleted successfully"}, status=status.HTTP_204_NO_CONTENT)