from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import PatientInformation

# @csrf_exempt  # for demo purposes, not recommended for production without CSRF tokens
def receive_data(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        patient_id = data.get('patient_id')

        try:
            # Retrieve the patient by ID
            patient = PatientInformation.objects.get(id=patient_id)
            print(patient_id)
            response_object = {
                'status': 'success',
                'patient_data': {
                    'id': patient.id,  # UUID field for the patient
                    'name': patient.name,  # Patient's name
                    'sex': patient.get_sex_display(),  # Human-readable sex using choices
                    'birthday': patient.birthday,  # Patient's birthdate
                    'phone_number': patient.phone_number,  # Patient's phone number
                    'status': patient.get_status_display(),  # Human-readable status using choices
                    'ward': patient.get_ward_display(),  # Human-readable ward using choices
                    'qr_code': patient.qr_code.url if patient.qr_code else None,  # Patient's QR code URL
                    'created_at': patient.created_at,  # Timestamp when the patient record was created
                }
            }
            return JsonResponse(response_object)
        except PatientInformation.DoesNotExist:
            return JsonResponse({'status': 'fail', 'error': 'Patient not found'})

    return JsonResponse({'status': 'fail', 'error': 'Invalid request method'})