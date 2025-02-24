<<<<<<< HEAD
import json, random
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib import messages
from .models import Employee

###

def generate_random_otp():
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))

def send_email_otp(email):
    """Send OTP to the provided email."""
    otp = generate_random_otp()  
    cache.set(email, otp, timeout=300)  # Store OTP for 5 minutes
    subject = "Your OTP Code"
    message = f"Your OTP code is: {otp}. Please enter this to verify your account."
    from_email = "aundraytafalla@gmail.com"  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')
    return True

def print_lang():
    print('hello print world')
    
def admin_code_verification(request):
    if request.method == "POST":
        entered_code = request.POST.get("verification_code")
        admin_data = request.session.get("admin_data", {})
        email = admin_data.get("email")  # Get email from session
        stored_otp = cache.get(email)

        if entered_code == stored_otp:
            
            employee = Employee.objects.create(
                name=admin_data.get("name"),
                birthdate=admin_data.get("birthdate"),
                # sex=sex,
                employee_id=admin_data.get("adminID"),
                # role=role,
                email=admin_data.get("email"),
                # phone_number=phone_number
            )
            return redirect("admin")  # Redirect to admin page after success
        else:
            # messages.error(request, "Invalid code. Please try again.")
            return redirect("signup")  # Redirect back if failed

    return JsonResponse({"error": "Invalid request"}, status=400)
    
###

=======
import json
from django.http import JsonResponse
>>>>>>> 9b84290 (separate some func from views to diff files for better project structure)

def verify_admin(request): #from frontend to django
    if request.method == "POST":
        try:
            data = json.loads(request.body)  #getting data from request
            name = data.get("name")
            birthdate = data.get("birthdate")
            adminID = data.get("adminID")
            email = data.get("email")

<<<<<<< HEAD
            send_email_otp(email)
            
             # Store admin data in session for later verification
            request.session["admin_data"] = {
                "name": name,
                "birthdate": birthdate,
                "adminID": adminID,
                "email": email,
            }
            
=======
>>>>>>> 9b84290 (separate some func from views to diff files for better project structure)
            print(f"Received Data - Name: {name}, Birthdate: {birthdate}, Admin ID: {adminID}, Email: {email}")

            return JsonResponse({"message": "Admin verified successfully!"})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

def get_admin_details(request): #from django to frontend (a test)
    data2 = {
        "admin_name": "fromdjango",
        "admin_id": "fromdjango",
        "email": "fromdjango@example.com",
        "birthdate": "0000-00-00",
    }
    print("Sending Data to Frontend:", data2)
    return JsonResponse(data2)