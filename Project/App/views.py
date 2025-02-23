import os
import json

from django.shortcuts import render
from django.http import JsonResponse

from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

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

<<<<<<< HEAD
=======
def verify_admin(request): #from frontend to django
    if request.method == "POST":
        try:
            data = json.loads(request.body)  #getting data from request
            name = data.get("name")
            birthdate = data.get("birthdate")
            adminID = data.get("adminID")
            email = data.get("email")

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
>>>>>>> 79e15d3 (sending data from django to js)
