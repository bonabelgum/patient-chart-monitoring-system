import json, random, secrets
import os
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password

from cryptography.fernet import Fernet
from .models import Employee

###


# Encrypt a string
def encrypt_string(text, key):
    f = Fernet(key)
    return f.encrypt(text.encode()).decode()  # Encrypt and return as string

# Decrypt a string
def decrypt_string(encrypted_text, key):
    f = Fernet(key)
    return f.decrypt(encrypted_text.encode()).decode()  # Decrypt and return original text

def generate_random_otp():
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))

def send_email_otp(email):
    """Send OTP to the provided email."""
    otp = generate_random_otp()  
    cache.set(email, otp, timeout=300)  # Store OTP for 5 minutes
    subject = "Your OTP Code"
    message = f"Your OTP code is: {otp}. Please enter this to verify your account."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True



def send_master_key(master_key, email):
    """Send OTP to the provided email."""
    subject = "Your Master Key"
    message = f"Your Master key is: {master_key}. Please secure your masterkey in safe storage."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True
    
def admin_code_verification(request):
    if request.method == "POST":
        entered_code = request.POST.get("verification_code")
        admin_data = request.session.get("admin_data", {})
        email = admin_data.get("email")  # Get email from session
        stored_otp = cache.get(email)

        if entered_code == stored_otp:
            master_key = secrets.token_hex(8)  # Create a masterkey (16 characters = 8 bytes)
            ferney_key = os.environ.get('FERNET_KEY')  # Get the ferney key from .env
            encrypted_text = encrypt_string(master_key, ferney_key)
            
            employee = Employee.objects.create(
                name=admin_data.get("name"),
                birthdate=admin_data.get("birthdate"),
                sex = admin_data.get("sex"),
                employee_id=admin_data.get("adminID"),
                role=admin_data.get("role"),
                email=admin_data.get("email"),
                phone_number = admin_data.get("phone_number"),
                master_key=encrypted_text
            )
            send_master_key(master_key, admin_data.get("email"))
            return redirect("admin")  # Redirect to admin page after success
        else:   
            return redirect("signup")  # Redirect back if failed

    return JsonResponse({"error": "Invalid request"}, status=400)
    
###


def verify_admin(request): #from frontend to django
    if request.method == "POST":
        try:
            data = json.loads(request.body)  #getting data from request
            name = data.get("name")
            birthdate = data.get("birthdate")
            sex = data.get("sex")
            adminID = data.get("adminID")
            phone_number = data.get("phone_number")
            email = data.get("email")
            role = data.get("role")

            errors = []
            #cCheck for existing employee ID
            if Employee.objects.filter(employee_id=adminID).exists():
                errors.append("A user with the same Employee ID already exists.")

            #check for existing email
            if Employee.objects.filter(email=email).exists():
                errors.append("A user with the same Email already exists.")

            #check for existing phone number
            phone_number = data.get("phone_number")
            if phone_number and Employee.objects.filter(phone_number=phone_number).exists():
                errors.append("A user with the same Phone Number already exists.")

            if errors: #send errors back to frontend
                return JsonResponse({"success": False, "errors": errors})
            
            send_email_otp(email)
            
             #if no duplicates, store admin data in session for later verification
            request.session["admin_data"] = {
                "name": name,
                "birthdate": birthdate,
                "sex":sex,
                "adminID": adminID,
                "phone_number": phone_number,
                "email": email,
                "role":role,
            }
            
            print(f"Received Data - Name: {name}, Birthdate: {birthdate}, role: {role}, Admin ID: {adminID}, Email: {email}")

            return JsonResponse({"success": True, "message": "Admin verified successfully!"})
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "errors": ["Invalid JSON data"]}, status=400)
    return JsonResponse({"success": False, "errors": ["Invalid request method"]}, status=405)

def get_admin_details(request): #from django to frontend (a test)
    data2 = {
        "admin_name": "fromdjango",
        "admin_id": "fromdjango",
        "email": "fromdjango@example.com",
        "birthdate": "0000-00-00",
    }
    # print("Sending Data to Frontend:", data2)
    return JsonResponse(data2)