import json
import os
from django.http import JsonResponse
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from .models import Employee

# @csrf_exempt  # Use this decorator if you're not using CSRF token in your AJAX request
def get_nurse_data(request):
    # print("hello nurse")
    if request.method == 'POST':
        data = json.loads(request.body)
        id = data.get('id')
        request.session['confirm_nurse_id'] = id
        # Process the ID as needed
        # print(f"Received ID: {id}")
        
        # Return a JSON response
        return JsonResponse({'status': 'success', 'received_id': id})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400)
    
# Accept the nurse then send email and change the status in db if correct master_key
def verify_master_key(request):
    if request.method == "POST":
        print("Enter 1")
        try:
            data = json.loads(request.body)
            master_key = data.get("master_key")
            
            is_valid = verify_master_key_for_all_employees(master_key)
            if is_valid == True: #Create the necessary action
                print("Enter 3")
                
                confirm_nurse_id = request.session.get('confirm_nurse_id')
                employee = Employee.objects.get(employee_id=confirm_nurse_id)
                print("Request employee "+employee.name)
                
                send_nurse_confirmation(employee.name, employee.email)
                employee.update_status("Registered")
                return JsonResponse({"status": "success"})
            else:
                print("Enter 4")
                return JsonResponse({"message": "Incorrect Masterkey"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "Invalid request method."}, status=405)
    
# Reject the Nurse then delete if correct master_key 
def reject_master_key(request):
    if request.method == "POST":
        print("Enter 1")
        try:
            data = json.loads(request.body)
            master_key = data.get("master_key")
            
            is_valid = verify_master_key_for_all_employees(master_key)
            if is_valid == True: #Create the necessary action
                print("Enter 3")
                
                confirm_nurse_id = request.session.get('confirm_nurse_id')
                employee = Employee.objects.get(employee_id=confirm_nurse_id)
                # print("Request employee "+employee.name)
                
                # send_nurse_confirmation(employee.name, employee.email)
                employee.remove_by_employee_id(employee.employee_id)
                # employee.update_status("Registered")
                return JsonResponse({"status": "success"})
            else:
                print("Enter 4")
                return JsonResponse({"message": "Incorrect Masterkey"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "Invalid request method."}, status=405)
    

def verify_master_key_for_all_employees(master_key_input):
    for employee in Employee.objects.all():
        if employee.master_key and employee.verify_master_key(master_key_input):
            return True  # Match found
    return False  # No match found
    
# Send email to nurse that they are confirmed 
def send_nurse_confirmation(name, email):
    """Send OTP to the provided email."""
    subject = "PCMS Confirmation"
    message = f"Confirmation: Hi {name}, You are now confirmed to use PCMS."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True


# employee = Employee.objects.get(employee_id="123456")
# is_valid = employee.verify_master_key("182ca57243078629")
# print(is_valid)  # True if the key is correct, False otherwise

# for employee in Employee.objects.all():
#     if employee.master_key:
#         is_valid = employee.verify_master_key("expected-key")  # Replace with the expected key
#         print(f"Employee {employee.employee_id}: {'Valid' if is_valid else 'Invalid'}")