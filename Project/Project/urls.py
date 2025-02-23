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

from App.signup import verify_admin, get_admin_details, admin_code_verification

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('signup', views.signup, name='signup'),
    path('admin', views.admin, name='admin'),
    path('on_duty', views.on_duty, name='on_duty'),
<<<<<<< HEAD
    
    path('verify-admin/', verify_admin, name='verify_admin'), #from frontend to django
    path('get_admin_details/', get_admin_details, name='get_admin_details'), #from django to frontend
    path("admin_code_verification/", admin_code_verification, name="admin_code_verification"),
=======
    path('verify-admin/', views.verify_admin, name='verify_admin'), #from frontend
    path('get_admin_details/', views.get_admin_details, name='get_admin_details'), #from django
>>>>>>> 79e15d3 (sending data from django to js)
]
