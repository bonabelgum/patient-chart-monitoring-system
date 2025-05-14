import json, random, secrets, os

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib import messages

from cryptography.fernet import Fernet
from .models import Admin_logs, Employee

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

# Send masterkey to email
def send_master_key(master_key, email):
    """Send OTP to the provided email."""
    subject = "Your Master Key"
    message = f"Your Master key is: {master_key}. Please secure your masterkey in safe storage."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True
    
    
# verify otp then create and encrypt masterkey
def admin_code_verification(request):
    if request.method == "POST":
        try:
            body_unicode = request.body.decode('utf-8')
            body_data = json.loads(body_unicode)
            entered_code = body_data.get('verification_code')  # 🛑 From fetch body
        except Exception as e:
            return JsonResponse({"error": "Invalid data"}, status=400)

        admin_data = request.session.get("admin_data", {})
        email = admin_data.get("email")
        stored_otp = cache.get(email)

        if entered_code == stored_otp:
            master_key = secrets.token_hex(8)
            ferney_key = os.environ.get('FERNET_KEY')
            encrypted_text = encrypt_string(master_key, ferney_key)

            user, created = User.objects.get_or_create(username=email, defaults={"email": email})

            employee = Employee.objects.create(
                user=user,
                name=admin_data.get("name"),
                birthdate=admin_data.get("birthdate"),
                sex=admin_data.get("sex"),
                employee_id=admin_data.get("adminID"),
                role=admin_data.get("role"),
                email=admin_data.get("email"),
                phone_number=admin_data.get("phone_number"),
                master_key=encrypted_text,
                status="Registered"
            ) 

            send_master_key(master_key, admin_data.get("email"))
            return JsonResponse({"status": "success", "message": "Verification successful. Redirecting to login."})
        else:
            return JsonResponse({"status": "fail", "message": "Invalid verification code."})

    return JsonResponse({"error": "Invalid request"}, status=400)
    
###


#getting details from admin registration
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
            conflicting_fields = []
            
            #check if the maximum number of admins has been reached
            admin_count = Employee.objects.filter(role="admin").count()
            if admin_count >= 3:
                errors.append("The limitation for user admin has been reached.")
                return JsonResponse({"success": False, "errors": errors})
            #check for existing employee ID
            if Employee.objects.filter(employee_id=adminID).exists():
                conflicting_fields.append("Employee ID")
            #check for existing email
            if Employee.objects.filter(email=email).exists():
                conflicting_fields.append("Email") 
            #check for existing phone number
            phone_number = data.get("phone_number")
            if phone_number and Employee.objects.filter(phone_number=phone_number).exists():
                conflicting_fields.append("Phone Number")
            if conflicting_fields: #send result back to frontend
                errors.append(f"A user with the same {', '.join(conflicting_fields)} already exists.")
                return JsonResponse({"success": False, "errors": errors})
            
            send_email_otp(email)
            
             #if no duplicates, store admin data in session for later verification
            request.session["admin_data"] = {
                "name": name,
                "birthdate": birthdate,
                "sex":sex,
                "adminID": adminID,
                "phone_number":"(+63)"+phone_number,
                "email": email,
                "role":role,
                "status":"Registered",
            }
            
            # print(f"Received Data - Name: {name}, Birthdate: {birthdate}, role: {role}, Admin ID: {adminID}, Email: {email}")

            Admin_logs.add_log_activity("Admin: "+name+" Signed up.")
            return JsonResponse({"success": True, "message": "Admin verified successfully!"})
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "errors": ["Invalid JSON data"]}, status=400)
    return JsonResponse({"success": False, "errors": ["Invalid request method"]}, status=405)


#getting details from nurse registration
def verify_nurse(request): #from frontend to django
    if request.method == "POST":
        try:
            data = json.loads(request.body)  #getting data from request
            name = data.get("name")
            birthdate = data.get("birthdate")
            sex = data.get("sex")
            nurseID = data.get("nurseID")
            phone_number = data.get("phone_number")
            email = data.get("email")
            role = data.get("role")
            
            errors = []
            conflicting_fields = []
            pending_status = False

            # Check if an admin exists
            admin_exists = Employee.objects.filter(role="admin").exists()
            if not admin_exists:
                errors.append("There is no admin available to handle registrations. Please wait until an admin is available.")
                return JsonResponse({"success": False, "errors": errors})
            #checking existing employee ID
            existing_employee = Employee.objects.filter(employee_id=nurseID).first()
            if existing_employee:
                conflicting_fields.append("Employee ID")
                if existing_employee.status == "Pending":
                    pending_status = True
            #checking existing email
            existing_employee = Employee.objects.filter(email=email).first()
            if existing_employee:
                conflicting_fields.append("Email")
                if existing_employee.status == "Pending":
                    pending_status = True
            #checking existing num
            phone_number = data.get("phone_number")
            if phone_number:
                existing_employee = Employee.objects.filter(phone_number=phone_number).first()
                if existing_employee:
                    conflicting_fields.append("Phone Number")
                    if existing_employee.status == "Pending":
                        pending_status = True
            #if conflicts exist, send error response
            if conflicting_fields:
                error_message = f"A user with the same {', '.join(conflicting_fields)} already exists."
                if pending_status:
                    error_message += " The account is still pending. Please wait for the confirmation. An email will be sent."

                errors.append(error_message)
                return JsonResponse({"success": False, "errors": errors})
            
            # ✅ Create a new user in User model (linked to Employee)
            user, created = User.objects.get_or_create(username=email, defaults={"email": email})
            # ✅ Create the Employee and link it to the User
            employee = Employee.objects.create(
                user=user,
                name=name,
                birthdate=birthdate,
                sex=sex,
                employee_id=nurseID,
                role=role,
                email=email,
                phone_number="(+63)"+phone_number,
                status="Pending"
            )
            
             #if no duplicates, store nurse data in session for later verification
             #possible error (clear nurse_data after using them so no conflict) (not done yet)
            request.session["nurse_data"] = {
                "name": name,
                "birthdate": birthdate,
                "sex":sex,
                "nurseID": nurseID,
                "phone_number": phone_number,
                "email": email,
                "role":role,
                "status":"Pending",
            }
            
            #print(f"Received Data - Name: {name}, Birthdate: {birthdate}, phone: {phone_number}, Nurse ID: {nurseID}, Email: {email}")
            
            Admin_logs.add_log_activity("Nurse: "+name+" Signed up and to be approved.")
            return JsonResponse({"success": True, "message": "Nurse added to the employees DB!"})
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