from django.urls import path
from . import views

urlpatterns = [
    path('visualize/', views.visualize_data, name='visualize'),
    path('regions/', views.get_regions, name='regions'),
    path('health/', views.health_check, name='health'),
    path('map/', views.map_data, name='map'),
]