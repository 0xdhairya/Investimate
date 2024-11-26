from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('add-case/', views.add_case_view, name='add-case'),
    path('case/<int:case_id>/', views.case_view, name='case'),
    path('case/delete/<int:case_id>/', views.delete_case_view, name='delete-case'),
    path('case/close/<int:case_id>/', views.close_case_view, name='close-case'),
    path('cases/', views.cases_view, name='cases'),
    path("case/<int:case_id>/insight/<int:insight_id>/",views.insight_view, name='insight'),
    path("case/<int:case_id>/remove-insight/<int:id>/",views.remove_insight_view, name='remove-insight'),
    path("cases/<int:case_id>/summary/", views.summary_view, name="case_summary"),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('api/home/', views.home_api_view, name='home_api'),
    path('api/case/<int:case_id>/', views.case_api_view, name='case_api'),
    path('api/case/<int:case_id>/insight/<int:insight_id>/', views.insight_api_view, name='insight_api'),
    path('api/case/highlight/<int:case_id>/', views.save_highlight_view, name='save-highlight'),
    path("api/case/<int:case_id>/update-notes",views.update_notes_api_view, name='case-update-notes'),
    path("api/case/<int:case_id>/ai/prediction",views.prediction_api_view, name='case-prediction'),
    path("api/case/<int:case_id>/ai/connection",views.connection_api_view, name='case-connection'),
    path('api/cases/', views.cases_api_view, name='cases_api'),
    path("api/insights/",views.insights, name='insights'),
]