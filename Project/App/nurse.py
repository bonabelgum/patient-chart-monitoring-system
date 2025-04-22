import json
from django.http import JsonResponse
from django.utils import timezone  # ✅ this one
import random
from .models import PatientInformation


# print("hello nurse")


def get_patients(request):
    patients = PatientInformation.objects.all()
    patient_list = []

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