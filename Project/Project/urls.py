"""
URL configuration for Project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from App import views

from App.signup import verify_admin, verify_nurse, get_admin_details, admin_code_verification
from App.views import signup_view, logout_view, patient_detail, get_employees, log_activity, admit_patient
from App.login import handle_request  # Import the function
from App.admin_user import get_nurse_data, verify_master_key, reject_master_key, create_shift , delete_shift, get_all_logs, remove_user, get_all_shifts # Import the function

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('signup', views.signup, name='signup'),
    path('admin_user/', views.admin_page, name='admin'),
    path('nurse', views.nurse, name='nurse'),
    path("signup/", signup_view, name="signup"), 
    path("logout/", logout_view, name="logout"),
    path('employees/', get_employees, name='get_employees'),
    
    path('verify-admin/', verify_admin, name='verify_admin'), #from frontend to django
    path('verify-nurse/', verify_nurse, name='verify_nurse'), #from frontend to django
    path('get_admin_details/', get_admin_details, name='get_admin_details'), #from django to frontend
    path("admin_code_verification/", admin_code_verification, name="admin_code_verification"),
    path("handle-request/", handle_request, name="handle_request"),  # Now accessible via /handle-request/
    path('patient/<int:patient_id>/', patient_detail, name='patient_detail'), #patient's info
    path('get_nurse_data/', get_nurse_data, name='get_nurse_data'), #nurse's info
    path("verify_master_key/", verify_master_key, name="verify_master_key"),
    path("reject_master_key/", reject_master_key, name="reject_master_key"),
    path('create_shift/', create_shift, name='create_shift'),
    path('delete_shift/', delete_shift, name='delete_shift'),
    path('get_all_logs/', get_all_logs, name='get_all_logs'),
    path('remove_user/', remove_user, name='remove_user'),
    path('get_all_shifts/', get_all_shifts, name='get_all_shifts'),
    path("log_activity/", log_activity, name="log_activity"),
    path('api/schedule/', views.get_schedule_data, name='schedule-data'),

    path('admit-patient/', admit_patient, name='admit_patient'), #storing qr
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)