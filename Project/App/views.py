import os

from django.shortcuts import render

from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import random

# Create your views here.

def test_env(): #just testing env
    secret_test = os.getenv("SECRET_TEST", "Not Found")
    print("Environment Variable:", secret_test)
test_env()

def index(request):
    template = "main/index.html"
    return render(request, template)
def signup(request):
    template = "main/signup.html"
    return render(request, template)
def admin(request):
    template = "main/admin.html"
    return render(request, template)
def on_duty(request):
    template = "main/on_duty.html"
    return render(request, template)



def send_email_otp(email, otp):
    subject = "Your OTP Code"
    message = f"Your OTP code is: {otp}. Please enter this to verify your account."
    from_email = "your_email@gmail.com"  # Same email as in settings.py
    recipient_list = [email]

    send_mail(subject, message, from_email, recipient_list)
    return True

def generate_random_otp():
    return str(random.randint(100000, 999999))  # Generate a 6-digit OTP

@csrf_exempt  # Remove this when using templates
def send_otp(request):
    if request.method == "POST":
        email = request.POST.get("email")  # Get email from POST request
        otp = generate_random_otp()  # Generate OTP
        
        send_email_otp(email, otp)  # Send OTP via email
        
        request.session["otp"] = otp  # Store OTP in session

        return JsonResponse({"message": f"OTP sent to {email}"})  

    return JsonResponse({"error": "Invalid request"}, status=400)
