import json, random, os, threading, time
from django.http import JsonResponse
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.contrib.auth.models import User  
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse
from cryptography.fernet import Fernet



from .models import Admin_logs, Employee, Shift_schedule
from django.utils.timezone import localtime, now
from django.utils import timezone
from datetime import datetime, timedelta

def get_finished_shifts():
    now = timezone.localtime()

    # Get all shifts 
    shifts = Shift_schedule.objects.all()
    finished_shifts = []

    for shift in shifts:
        shift_start_time = shift.start_time
        shift_end_time = shift.end_time
        shift_date = shift.date

        # If it's an overnight shift (starts today, ends next day)
        if shift_end_time < shift_start_time:
            shift_end_datetime = timezone.make_aware(datetime.combine(shift_date + timedelta(days=1), shift_end_time))
        else:
            shift_end_datetime = timezone.make_aware(datetime.combine(shift_date, shift_end_time))

        if now > shift_end_datetime:
            finished_shifts.append(shift)

    # Delete finished shifts
    for shift in finished_shifts:
        print(f"Deleting finished shift ID {shift.id} on {shift.date}")
        shift.delete()

    return finished_shifts



def decrypt_string(encrypted_text: str) -> str:
    """Decrypts a Fernet-encrypted string"""
    try:
        fernet_key = os.environ.get('FERNET_KEY')
        f = Fernet(fernet_key.encode())
        decrypted_data = f.decrypt(encrypted_text.encode())
        return decrypted_data.decode()
    except Exception as e:
        print(f"Decryption failed: {str(e)}")
        return None


def send_login_otp(email):
    """Send OTP to the provided email."""
    otp = str(random.randint(100000, 999999))
    cache.set(email, otp, timeout=300)  # Store OTP for 5 minutes
    subject = "Your OTP Code"
    message = f"Your OTP code is: {otp}. Please enter this to login your account."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True


def send_nurse_shift_password(email, shift):
    
    shift_password = decrypt_string(shift.shift_password)
    # print("helloo shift "+shift_password)
    subject = "Your Shift Password"
    message = f"Your shift password is: {shift_password}. Please enter this when making changes in PCMS."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True

def handle_request(request):
    if request.method == "POST":
        
        
        shifts_over = get_finished_shifts()
        # for shift in shifts_over:
            # print(f"Shift ID {shift.date} is finished.")
        data = json.loads(request.body)
        action = data.get("action")

        if action == "get_otp":
            employee_id = data.get("employeeID")
            employee = Employee.get_by_employee_id(employee_id)

            if not employee: #user not found
                return JsonResponse({"message": "User not found"}, status=404)
            
            if employee.status == "Pending": #status check if still Pending
                return JsonResponse({"message": "The account is still pending. Please wait for the confirmation via email."})

            send_login_otp(employee.email)
            #print(f"Generating OTP for Employee ID: {employee_id}")
            return JsonResponse({"message": "OTP sent successfully!"})

        elif action == "login":
            employee_id = data.get("employeeID")
            password = data.get("password")
            employee = Employee.get_by_employee_id(employee_id)

            if not employee: #user not found
                return JsonResponse({"message": "User not found"}, status=404)

            stored_otp = cache.get(employee.email)
            if password == stored_otp:
                # Check if user exists; create only if necessary
                user, created = User.objects.get_or_create(username=employee_id)


                request.session["role"] = employee.role  # ✅ Store role in session
                request.session['user_id'] = employee_id
                
                # Redirect based on role
                if employee.role == "admin":
                    # Log the user in
                    login(request, user)  # ✅ Store user session
                    nurse_id = request.session.get("employeeID")
                    cache.delete(employee.email)
                    Admin_logs.add_log_activity("Admin: "+employee.name+" Logged In")
                    response_data = {"message": "Login successful!", "redirect_url": "admin_user", "user_id": employee_id}
                else:
                    is_active = get_active_shift(employee_id)
                    print(is_active)
                    # Check if use has active shift
                    if is_active is None:
                        # print("No active shift found for employee")
                        return JsonResponse({'error': 'No active shift'}, status=400)
                    
                    # Log the user in
                    login(request, user)  # ✅ Store user session
                    # Start the thread to keep checking if sched is finished
                    send_nurse_shift_password(employee.email, is_active)
                    nurse_id = employee_id  
                    thread = threading.Thread(target=check_shift, args=(request,), daemon=True)
                    thread.start()
                    cache.delete(employee.email)
                    Admin_logs.add_log_activity("Nurse: "+employee.name+" Logged In")
                    
                    
                    response_data = {"message": "Login successful!", "redirect_url": "nurse", "user_id": employee_id}

                return JsonResponse(response_data)  
            else:
                return JsonResponse({"message": "Incorrect password. Request OTP for the password"})
            
    return JsonResponse({"error": "Invalid request"}, status=400)


from datetime import timedelta

def check_shift(request):
    current_datetime = localtime(now())
    current_day = current_datetime.isoweekday()
    current_time = current_datetime.time()
    
    nurse_id = request.session.get("user_id")
    if not nurse_id:
        # Session expired case
        return JsonResponse({
            'session_expired': True,
            'message': 'Session expired',
            'redirect': reverse('index')
        })

    nurse_shift = Shift_schedule.get_nearest_shift_by_employee_id(nurse_id)
    if nurse_shift is None:
        logout(request)
        return JsonResponse({'redirect': reverse('index')})

    if nurse_shift.start_time <= nurse_shift.end_time:
        # Normal shift (does not pass midnight)
        if current_time > nurse_shift.end_time:
            Shift_schedule.delete_shift(nurse_shift.id)
            logout(request)
            return JsonResponse({
                'shift_ended': True,
                'message': 'Your shift has ended',
                'redirect': reverse('index')
            })
    else:
        # Overnight shift (crosses midnight)
        if not (current_time >= nurse_shift.start_time or current_time <= nurse_shift.end_time):
            # Current time is outside the overnight shift
            Shift_schedule.delete_shift(nurse_shift.id)
            logout(request)
            return JsonResponse({
                'shift_ended': True,
                'message': 'Your shift has ended',
                'redirect': reverse('index')
            })

    return JsonResponse({'status': 'shift_active'})

# Check if nurse shift is active
def get_active_shift(employee_id):
    manila_now = localtime(now())
    current_day = manila_now.isoweekday()
    current_time = manila_now.time()

    # Also calculate yesterday's day number (1 = Monday, 7 = Sunday)
    yesterday_day = 7 if current_day == 1 else current_day - 1

    shifts = Shift_schedule.get_shifts_by_employee_id(employee_id)

    for shift in shifts:
        if shift.day == current_day:
            # Normal shift
            if shift.start_time <= shift.end_time:
                if shift.start_time <= current_time <= shift.end_time:
                    return shift
            else:
                # Overnight shift starting today
                if current_time >= shift.start_time:
                    return shift
        elif shift.day == yesterday_day:
            # Overnight shift continuing from yesterday
            if shift.start_time > shift.end_time:
                if current_time <= shift.end_time:
                    return shift
    return None