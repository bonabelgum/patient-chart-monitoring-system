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
from App import views, nurse, patient,login

from App.signup import verify_admin, verify_nurse, get_admin_details, admin_code_verification
from App.views import signup_view, logout_view, patient_detail, get_employees, log_activity, admit_patient
from App.login import handle_request  # Import the function
from App.admin_user import get_nurse_data, verify_master_key, reject_master_key, create_shift , delete_shift, get_all_logs, remove_user, get_all_shifts, submit_ot # Import the function
from App.nurse import get_patients, check_patient_id, get_nurse_logs
from App.patient import receive_data, save_vital_signs, update_vs1, update_patient, update_vital_signs, check_shift_password, save_medication, update_medication, medication_log, get_medication_logs, save_notes, delete_note, edit_note
from App.login import check_shift

urlpatterns = [
    path('admin/', admin.site.urls),
    path('index', views.index, name='index'),
    path('', views.index, name='index-alt'), 
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
    path("check_otp/", handle_request, name="admin_code_verification"),  # Now accessible via /handle-request/
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
    path('api/submit_ot/', submit_ot, name='submit_ot'),
     
    # Nurse 
    path('get_patients/', get_patients, name='get_patients'),
    path('api/check_patient_id/', check_patient_id, name='check_patient_id'),
    path('api/get_nurse_logs/', get_nurse_logs, name='get_nurse_logs'),
    
    # patient
    path('api/receive_data/', receive_data, name='receive_data'),
    path('api/update_patient/', update_patient, name='update_patient'),
    path('api/save_vital_signs/', save_vital_signs, name='save_vital_signs'),
    path('api/update_vs1/', update_vs1, name='update_vs1'),
    path('api/update_vital_signs/', update_vital_signs, name='update_vital_signs'),
    path('api/check_shift_password/', check_shift_password, name='check_shift_password'),
    path('api/save_medication/', save_medication, name='save_medication'),
    path('api/update_medication/', update_medication, name='update_medication'),
    path('api/save_notes/', save_notes, name='save_notes'),
    path('api/medication_log/', medication_log, name='medication_log'),
    path('api/medication_log/<int:patient_id>/<int:medication_id>/', get_medication_logs, name='get_medication_logs'),
    path('api/edit_note/', edit_note, name='edit_note'),
    
    path("log_activity/", log_activity, name="log_activity"),
    path('api/schedule/', views.get_schedule_data, name='schedule-data'),
    path('check_shift/', check_shift, name='check_shift'),

    #storing pt details
    path('admit-patient/', admit_patient, name='admit_patient'), 
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)