import os

from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required   
from django.contrib.auth import logout
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

#logout
def logout_view(request):
    if request.method == "POST":
        logout(request)
        return JsonResponse({"message": "Logged out"}, status=200)
    return JsonResponse({"error": "Invalid request"}, status=400)

#populate the employees table
def get_employees(request):
    from .models import Employee
    employees = Employee.objects.all().values('employee_id', 'name', 'role', 'status')
    return JsonResponse(list(employees), safe=False)

#patient
def patient_detail(request, patient_id):
    #get data from the URL parameters (temporary for now until we use a database here)
    patient_name = request.GET.get('name', 'Unknown')
    patient_ward = request.GET.get('ward', 'Unknown')
    patient_status = request.GET.get('status', 'Unknown')
    context = {
        'patient_id': patient_id,
        'patient_name': patient_name,
        'patient_ward': patient_ward,
        'patient_status': patient_status,
    }

    return render(request, 'main/patient.html', context)