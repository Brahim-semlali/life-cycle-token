from django.urls import path
from .views import RegisterView, LoginView, UserListView, LogoutView, UserDeleteView, UserUpdateView, UserListAllView

urlpatterns = [
    path('create/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('get/', UserListView.as_view(), name='list-users'),
    path('getall/', UserListAllView.as_view(), name='list-all-users'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('update/', UserUpdateView.as_view(), name='user-update'),
    path('delete/', UserDeleteView.as_view(), name='user-delete'),
]