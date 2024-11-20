from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('add-case/', views.add_case_view, name='add-case'),
    path('case/<int:case_id>/', views.case_view, name='case'),
    path('cases/', views.cases_view, name='cases'),
    path('case/delete/<int:case_id>/', views.delete_case_view, name='delete-case'),
    path('case/close/<int:case_id>/', views.close_case_view, name='close-case'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('api/case/<int:case_id>/', views.case_api_view, name='case_api'),
    path('api/cases/', views.cases_api_view, name='cases_api'),
    path('api/home/', views.home_api_view, name='home_api'),
]