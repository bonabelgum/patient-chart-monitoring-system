import json
import os
import secrets
from django.http import JsonResponse
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_time
from cryptography.fernet import Fernet
from .models import  Employee, Shift_schedule, Admin_logs


# @csrf_exempt  # Use this decorator if you're not using CSRF token in your AJAX request
def get_nurse_data(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nurse_id = data.get('id')
            if not nurse_id:
                return JsonResponse({'status': 'error', 'message': 'No ID provided'}, status=400)
            
            print(nurse_id)
            # Store in session if needed
            request.session['confirm_nurse_id'] = nurse_id
            
            # Get all shifts for this nurse
            shifts = Shift_schedule.objects.filter(employee_id=nurse_id).order_by('day', 'start_time')
            
            shifts = Shift_schedule.get_shifts_by_employee_id(employee_id=nurse_id)
            for shift in shifts:
                print(shift.day, shift.start_time, shift.end_time)
            
            
            # Convert to list of dictionaries
            shift_data = [
                {
                    'id': shift.id,
                    'day': shift.get_day_display(),
                    'day_number': shift.day,
                    'start_time': shift.start_time.strftime('%H:%M'),
                    'end_time': shift.end_time.strftime('%H:%M')
                } 
                for shift in shifts
            ]
           
            return JsonResponse({
                'status': 'success',
                'nurse_id': nurse_id,
                'shifts': shift_data
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=400) 
# Accept the nurse then send email and change the status in db if correct master_key
def verify_master_key(request):
    if request.method == "POST":
        #print("Enter 1")
        try:
            data = json.loads(request.body)
            master_key = data.get("master_key")
            
            is_valid = verify_master_key_for_all_employees(master_key)
            if is_valid == True: #Create the necessary action
                #print("Enter 3")
                
                confirm_nurse_id = request.session.get('confirm_nurse_id')
                employee = Employee.objects.get(employee_id=confirm_nurse_id)
                print("Request employee "+employee.name)

                # Get the admin's user ID from session
                admin_id = request.session.get('user_id')
                
                send_nurse_confirmation(employee.name, employee.email)
                employee.update_status("Registered")
                Admin_logs.add_log_activity("Nurse: "+employee.name+" is approved by admin " + str(admin_id) + ".")
                return JsonResponse({"status": "success"})
            else:
                #print("Enter 4")
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
                # print("Enter 3")
                
                confirm_nurse_id = request.session.get('confirm_nurse_id')
                employee = Employee.objects.get(employee_id=confirm_nurse_id)
                # print("Request employee "+employee.name)

                # Get the admin's user ID from session
                admin_id = request.session.get('user_id')
                
                reject_nurse_confirmation(employee.name, employee.email)
                employee.remove_by_employee_id(employee.employee_id)
                # employee.update_status("Registered")
                return JsonResponse({"status": "success"})
            else:
                # print("Enter 4")
                Admin_logs.add_log_activity("Nurse: "+employee.name+" is rejected by admin " + str(admin_id) + ".")
                return JsonResponse({"message": "Incorrect Masterkey"})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    else:
        return JsonResponse({"status": "error", "message": "Invalid request method."}, status=405)
    

# @csrf_exempt  # Remove this in production after testing
# Create shift here
def create_shift(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST requests are allowed'}, status=405)

    try:
        data = json.loads(request.body)
        
        # Validate and parse times
        try:
            start_time = parse_time(data['start_time'])
            end_time = parse_time(data['end_time'])
            if not all([start_time, end_time]):
                raise ValueError("Invalid time format")
        except (ValueError, TypeError, KeyError):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid time format. Use HH:MM:SS'
            }, status=400)

        # Get employee
        nurse_id = request.session.get('confirm_nurse_id')
        employee = Employee.objects.get(employee_id=nurse_id)
            
        master_key = secrets.token_hex(4)  # Create a masterkey (16 characters = 8 bytes)
        ferney_key = os.environ.get('FERNET_KEY')  # Get the Fernet key from .env
        encrypted_text = encrypt_string(master_key, ferney_key)

        # Create shift
        shift = Shift_schedule.objects.create(
            employee=employee,
            day=convert_day_to_number(data['day']),
            start_time=start_time,
            end_time=end_time,
            shift_password=encrypted_text
        )

            
        return JsonResponse({
            'status': 'success',
            'shift': {
                'id': shift.id,
                'day': shift.get_day_display(),
                'start_time': shift.start_time.strftime('%H:%M'),
                'end_time': shift.end_time.strftime('%H:%M'),
                'employee': employee.name
            }
        })

    except Employee.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Employee not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
        
def delete_shift(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        # Parse JSON data
        data = json.loads(request.body)
        shift_id = data.get('shift_id')
        
        if not shift_id:
            return JsonResponse({'error': 'shift_id is required'}, status=400)
        
        # Get shift and employee
        shift = Shift_schedule.get_shift_by_id(shift_id)
        if not shift:
            return JsonResponse({'error': f'Shift with ID {shift_id} not found'}, status=404)
            
        employee = shift.employee  # Directly access the employee through the ForeignKey
        
        # Debug prints
        print(f"Processing deletion for shift ID: {shift_id}")
        print(f"Day: {shift.get_day_display()}")
        print(f"Employee: {employee.name}")
        
        # Delete the shift
        deleted = Shift_schedule.delete_shift_by_id(shift_id)
        if not deleted:
            return JsonResponse({'error': 'Failed to delete shift'}, status=500)
        
        # Get the admin's user ID from session
        admin_id = request.session.get('user_id')
        
        # Add admin log
        log_message = f"Admin {admin_id} Deleted {employee.name}'s Shift on {shift.get_day_display()}: {shift.start_time} to {shift.end_time}"
        Admin_logs.add_log_activity(log_message)
        
        return JsonResponse({
            'success': True,
            'message': f'Shift deleted successfully',
            'deleted_id': shift_id,
            'log': log_message
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in delete_shift: {str(e)}")  # Detailed error logging
        return JsonResponse({'error': str(e)}, status=500)
    
# Delete all Employee  
def remove_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body.decode('utf-8'))  # Better decoding
        master_key = data.get('master_key')
        
        if not master_key:
            return JsonResponse({'error': 'Master key required'}, status=400)
        
        
        
        employee_id = request.session.get('confirm_nurse_id')
        employee = Employee.objects.get(employee_id=employee_id)
        print(f"Received master key: {master_key} "+employee_id)  # Debug
        
        success, message = Employee.delete_with_master_key(master_key, employee_id)
        
        # Replace with your actual key validation
        if success:  
            # Add your user deletion logic here
            Admin_logs.add_log_activity("Admin deleted "+ employee.name)
            return JsonResponse({
                'status': 'success',
                'message': 'User removed successfully'
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': message
            })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_all_logs(request):
    # Get all logs using the class method
    logs = Admin_logs.get_all_logs()

    return JsonResponse({
        'status': 'success',
        'data': logs
    })
    

def get_all_shifts(request):
    shifts = Shift_schedule.get_all_shifts()  # Your existing class method
    shift_data = []
    
    for shift in shifts:
        shift_data.append({
            'id': shift.id,
            'day': shift.get_day_display(),
            'start_time': shift.start_time.strftime('%H:%M'),
            'end_time': shift.end_time.strftime('%H:%M'),
            'employee': {
                'id': shift.employee.id,
                'name': shift.employee.name,
                'role': shift.employee.role
            }
        })
    
    return JsonResponse({'shifts': shift_data})

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

# Send email to nurse that they are confirmed 
def reject_nurse_confirmation(name, email):
    """Send OTP to the provided email."""
    subject = "PCMS Rejection"
    message = f"Rejection: Hi {name}, I'm sorry but you're rejected to use PCMS."
    from_email = os.environ.get('EMAIL_HOST_USER')  # Should match the email in settings.py

    send_mail(subject, message, from_email, [email])
    #print('email sent')    
    return True

def convert_day_to_number(day_name):
    day_name = day_name.lower().strip()  # Normalize input
    
    if day_name == 'monday':
        return 1
    elif day_name == 'tuesday':
        return 2
    elif day_name == 'wednesday':
        return 3
    elif day_name == 'thursday':
        return 4
    elif day_name == 'friday':
        return 5
    elif day_name == 'saturday':
        return 6
    elif day_name == 'sunday':
        return 7
    else:
        return None  # or raise an exception for invalid input

# Encrypt a string
def encrypt_string(text, key):
    f = Fernet(key)
    return f.encrypt(text.encode()).decode()  # Encrypt and return as string
