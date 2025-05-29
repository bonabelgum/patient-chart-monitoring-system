import json
import os

from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required   
from django.contrib.auth import logout
from django.views.decorators.cache import never_cache
from django.urls import reverse_lazy
from .models import Admin_logs, Employee, Nurse_logs, Shift_schedule, PatientInformation


#storing qr test
from .serializers import PatientInformationSerializer
from datetime import datetime

# Create your views here.

def test_env(): #just testing env
    secret_test = os.getenv("SECRET_TEST", "Not Found")
    print("Environment Variable:", secret_test)
test_env()

@never_cache
def index(request):
    if request.user.is_authenticated:
        role = request.session.get("role")  # ✅ Get role from session
        if role == "admin":
            return redirect("admin_user/")
        elif role == "nurse":
            return redirect("nurse")
    return render(request, "main/index.html")

def signup(request):
    template = "main/signup.html"
    return render(request, template)

@never_cache
@login_required(login_url='/')  # ✅ Redirect to the index view
def admin_page(request):
    template = "main/admin_user.html"
    return render(request, template)

@never_cache
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
    employees = Employee.objects.all().values('employee_id', 'name', 'role', 'status', 'email', 'phone_number')
    return JsonResponse(list(employees), safe=False)

#patient
@never_cache
@login_required(login_url='/')
def patient_detail(request, patient_id):
    #get data from the URL parameters (temporary for now until we use a database here)
    patient_name = request.GET.get('name', 'Unknown')
    patient_ward = request.GET.get('ward', 'Unknown')
    patient_status = request.GET.get('status', 'Unknown')
    physician_name = request.GET.get('physician_name', 'Unknown')
    context = {
        'patient_id': patient_id,
        'patient_name': patient_name,
        'patient_ward': patient_ward,
        'patient_status': patient_status,
        'physician_name': physician_name
    }

    return render(request, 'main/patient.html', context)



def log_activity(request):
    try:
        
        # Parse JSON data
        data = json.loads(request.body)
        activity_message = data.get('message')
        
        # Print to console to verify reception
        print(f"Received shift ID: {activity_message}")
        
        # deleted = Shift_schedule.delete_shift_by_id(activity_message)
        
        Admin_logs.add_log_activity(activity_message)
        
        return JsonResponse({
            'success': True,
            'message': f'Shift ID {activity_message} received successfully',
            'received_id': activity_message
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# Admin_logs.add_log_activity("hello")

#sched
def get_schedule_data(request):
    shifts = Shift_schedule.objects.select_related('employee').all()
    data = []
    for shift in shifts:
        data.append({
            'day': shift.day,  # Integer (1 = Monday, etc.)
            'start_time': shift.start_time.strftime('%H:%M'),
            'end_time': shift.end_time.strftime('%H:%M'),
            'employee': shift.employee.id, 
        })
    return JsonResponse({'shifts': data})
#storing qr
@csrf_exempt
def admit_patient(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nurse_id = request.session.get('user_id')
            nurse = Employee.objects.get(employee_id=nurse_id)

            weight = float(data.get('weight')) if data.get('weight') else None
            height = float(data.get('height')) if data.get('height') else None
            print(f"Weight value: {data.get('weight')}, Type: {type(data.get('weight'))}")
            print(f"Height value: {data.get('height')}, Type: {type(data.get('height'))}")
            
            # Check if patient already exists
            existing_patient = PatientInformation.objects.filter(
                name=data.get('name'),
                birthday=data.get('birthday'),
                sex=data.get('sex')
            ).first()
            
            if existing_patient:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Patient already exists. You can update their information.'
                }, status=400)
            
            # Create new patient
            patient = PatientInformation.objects.create(
                name=data.get('name'),
                sex=data.get('sex'),
                birthday=data.get('birthday'),
                weight=weight,
                height=height,
                phone_number="(+63)"+data.get('phone_number'),
                status=data.get('status'),
                number=data.get('number'),
                ward=data.get('ward'),
                physician_name=data.get('physician_name')
            )

            qr_code_url = request.build_absolute_uri(patient.qr_code.url)
            
            Nurse_logs.add_log_activity("Nurse "+nurse.name+" Admitted Patient  "+data.get('name'))
            
            return JsonResponse({
                'status': 'success',
                'message': 'Patient admitted successfully!',
                'qr_code_url': qr_code_url,
                'patient_id': str(patient.id),
            }) 
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method',
        'patient_id': str(patient.id),
        'qr_code_url': patient.qr_code.url
    }, status=405)