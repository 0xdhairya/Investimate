from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('cases/', views.cases_view, name='cases'),
    path('add-case/', views.add_case_view, name='add-case'),
    path('case/<int:case_id>/', views.case_view, name='case'),
]