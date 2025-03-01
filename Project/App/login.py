import json
from django.http import JsonResponse

print("Helllo worllldd")

def handle_request(request):
    if request.method == "POST":
        data = json.loads(request.body)
        action = data.get("action")

        if action == "get_otp":
            employee_id = data.get("employeeID")
            print(f"Generating OTP for Employee ID: {employee_id}")
            return JsonResponse({"message": "OTP sent successfully!"})

        elif action == "login":
            employee_id = data.get("employeeID")
            password = data.get("password")
            print(f"Logging in with Employee ID: {employee_id} and Password: {password}")
            return JsonResponse({"message": "Login successful!"})

    return JsonResponse({"error": "Invalid request"}, status=400)
