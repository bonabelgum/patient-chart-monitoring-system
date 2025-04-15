import json, random, os
from django.http import JsonResponse
from django.core.cache import cache
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.contrib.auth.models import User  
from django.contrib.auth import authenticate, login



from .models import Admin_logs, Employee

print("Helllo worllldd")



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
                return JsonResponse({"message": "The account is still pending. Please wait for the confirmation via email."})#, status=403)

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
                #user, created = User.objects.get_or_create(username=employee_id, defaults={"role": employee.role}) #doesn't work for me
                user, created = User.objects.get_or_create(username=employee_id)


                # Log the user in
                login(request, user)  # ✅ Store user session
                request.session["role"] = employee.role  # ✅ Store role in session
                
                # Redirect based on role
                if employee.role == "admin":
                    Admin_logs.add_log_activity("Admin: "+employee.name+" Logged In")
                    response_data = {"message": "Login successful!", "redirect_url": "admin"}
                else:
                    Admin_logs.add_log_activity("Nurse: "+employee.name+" Logged In")
                    response_data = {"message": "Login successful!", "redirect_url": "nurse"}

                return JsonResponse(response_data)  
            else:
                return JsonResponse({"message": "Incorrect password. Request OTP for the password"})
            
    return JsonResponse({"error": "Invalid request"}, status=400)
