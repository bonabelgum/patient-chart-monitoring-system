import json, random, os, threading, time
from django.http import JsonResponse
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.contrib.auth.models import User  
from django.contrib.auth import authenticate, login, logout
from django.urls import reverse



from .models import Admin_logs, Employee, Shift_schedule
from django.utils.timezone import localtime, now

# print("Helllo worllldd")



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

def handle_request(request):
    if request.method == "POST":
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
                    print(nurse_id)
                    Admin_logs.add_log_activity("Admin: "+employee.name+" Logged In")
                    response_data = {"message": "Login successful!", "redirect_url": "admin", "user_id": employee_id}
                else:
                    is_active = get_active_shift(employee_id)
                    # print(is_active.start_time)   
                    if is_active is None:
                        # print("No active shift found for employee")
                        return JsonResponse({'error': 'No active shift'}, status=400)

                    # print(f"Employee is working now until {is_active.end_time}")
                    # Log the user in
                    login(request, user)  # ✅ Store user session
                    # Start the thread to keep checking if sched is finished
                    nurse_id = employee_id  # Replace with actual ID
                    thread = threading.Thread(target=check_shift, args=(request,), daemon=True)
                    thread.start()
                    Admin_logs.add_log_activity("Nurse: "+employee.name+" Logged In")
                    
                    
                    response_data = {"message": "Login successful!", "redirect_url": "nurse", "user_id": employee_id}

                return JsonResponse(response_data)  
            else:
                return JsonResponse({"message": "Incorrect password. Request OTP for the password"})
            
    return JsonResponse({"error": "Invalid request"}, status=400)


def check_shift(request):
    # Remove the infinite loop - check once and return
    current_day = localtime(now()).isoweekday()
    current_time = localtime(now()).time()
    
    nurse_id = request.session.get("user_id")
    if not nurse_id:
        # Session expired case
        return JsonResponse({
            'session_expired': True,
            'message': 'Session expired',
            'redirect': reverse('index')
        })
    
    nurse_shift = Shift_schedule.get_nearest_shift_by_employee_id(nurse_id)
        # return JsonResponse({'redirect': reverse('index')})
    if nurse_shift is None: # If no schedule for today
        # Handle if nurse_shift return has nothing
        logout(request)
        return JsonResponse({'redirect': reverse('index')})
    if current_time > nurse_shift.end_time:
        print(f"Shift ended for nurse ID {nurse_id} at {nurse_shift.end_time}")
        deleted = Shift_schedule.delete_shift(nurse_shift.id)
        if(deleted):
            print("yes deleted na po")
        logout(request)
        return JsonResponse({
            'shift_ended': True,
            'message': 'Your shift has ended',
            'redirect': reverse('index')
        })
    
    
    print(f"Shift is not ended for {nurse_id} today.")
    return JsonResponse({'status': 'shift_active'})


# Check if nurse shift is active
def get_active_shift(employee_id):
        """
        Check if employee has any active shift right now (Manila time)
        Returns the active shift or None
        """
        # Get current Manila time
        manila_now = localtime(now())
        current_day = manila_now.isoweekday()
        current_time = manila_now.time()
        
        # Get all shifts for this employee
        shifts = Shift_schedule.get_shifts_by_employee_id(employee_id)
        
        # Check each shift
        for shift in shifts:
            if (shift.day == current_day and 
                shift.start_time <= current_time <= shift.end_time):
                return shift  # Return the active shift
        
        return None  # No active shift