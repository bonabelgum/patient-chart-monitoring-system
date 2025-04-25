import json
from django.http import JsonResponse
from django.utils import timezone  # ✅ this one
import random
from .models import PatientInformation, Shift_schedule
import time
import threading



# print("hello nurse")

# nurse_id =  ""
def get_patients(request):
    # global nurse_id 
    patients = PatientInformation.objects.all()
    patient_list = []
    nurse_id = request.session['user_id']
    # print(nurse_id)
    nurse_shift = Shift_schedule.get_nearest_shift_by_employee_id(nurse_id)
    # if nurse_shift:
    #     print(nurse_shift)
    # else:
    #     print("No shift found for today.")
    

    for patient in patients:
        patient_list.append({
            'id': patient.id,  # UUID field for patient ID
            'name': patient.name,  # Patient's full name
            'sex': patient.get_sex_display(),  # Human-readable sex using choices
            'birthday': patient.birthday.strftime("%Y-%m-%d"),  # Patient's birthdate formatted
            'phone_number': patient.phone_number,  # Patient's phone number
            'status': patient.get_status_display(),  # Human-readable status using choices
            'ward': patient.get_ward_display(),  # Human-readable ward using choices
            'qr_code': patient.qr_code.url if patient.qr_code else None,  # QR code URL or None
            'created_at': patient.created_at.strftime("%Y-%m-%d %H:%M"),  # Timestamp formatted
            'end_time': nurse_shift.end_time,
            
        })
    return JsonResponse({'patients': patient_list})


# Check if patient exist
def check_patient_id(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            hospital_id = data.get('hospital_id')
            # print(hospital_id)
            if not hospital_id:
                return JsonResponse({'error': 'hospital_id is required'}, status=400)

            exists = PatientInformation.id_exists(hospital_id)
            print(exists)
            return JsonResponse({'exists': exists})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)




# def check_every_minute():
#     print(nurse_id)
    
    
#     while True:
#         print("Running task...")
#         # Place your logic here
#         time.sleep(60)  # Wait for 60 seconds

# # Start in background
# thread = threading.Thread(target=check_every_minute, daemon=True)
# thread.start()










# Sample data
# names = [
#     "John Doe",
#     "Maria Santos",
#     "Juan Dela Cruz",
#     "Carlos Mendoza",
#     "Anna dela Peña"
# ]

# sex_choices = ["Female", "Male", "Other"]
# wards = ["General", "Pediatrics", "ICU", "Maternity", "None"]
# statuses = ["Inpatient", "Outpatient", "Discharge"]
# phone_numbers = ["09171234567", "09231234567", "09321234567", "09431234567", "09551234567"]

# # Create 5 sample patients
# for i in range(5):
#     patient = PatientInformation.objects.create(
#         name=random.choice(names),
#         sex=random.choice(sex_choices),
#         birthday=timezone.now().date(),
#         phone_number=random.choice(phone_numbers),
#         status=random.choice(statuses),
#         ward=random.choice(wards),
#         qr_code=None,  # Optionally, you can generate and save a QR code image if you have that functionality
#         created_at=timezone.now()
#     )
#     print(f"Created patient: {patient.name} in {patient.ward} ward, status: {patient.status}")