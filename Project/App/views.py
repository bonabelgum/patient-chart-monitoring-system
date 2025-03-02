import os

from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required   
from django.urls import reverse_lazy
from .models import Employee


# Create your views here.

def test_env(): #just testing env
    secret_test = os.getenv("SECRET_TEST", "Not Found")
    print("Environment Variable:", secret_test)
test_env()

def index(request):
    if request.user.is_authenticated:
        role = request.session.get("role")  # ✅ Get role from session
        if role == "admin":
            return redirect("admin")
        elif role == "nurse":
            return redirect("nurse")
    return render(request, "main/index.html")

def signup(request):
    template = "main/signup.html"
    return render(request, template)

@login_required(login_url='/')  # ✅ Redirect to the index view
def admin_page(request):
    template = "main/admin.html"
    return render(request, template)


@login_required(login_url='/')  # ✅ Redirect to the index view
def nurse(request):
    template = "main/nurse.html"
    return render(request, template)

def on_duty(request):
    template = "main/on_duty.html"
    return render(request, template)

def signup_view(request):
    '''return sex choices'''
    context = {
        'SEX_CHOICES': Employee.SEX_CHOICES
    }
    return render(request, 'main/signup.html', context)