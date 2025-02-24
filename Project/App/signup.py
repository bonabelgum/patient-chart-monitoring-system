import json
from django.http import JsonResponse

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