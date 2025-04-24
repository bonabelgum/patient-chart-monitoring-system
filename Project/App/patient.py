from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import PatientInformation, VitalSigns1, VitalSigns2, Medication, NurseNotes

# @csrf_exempt  # for demo purposes, not recommended for production without CSRF tokens
def receive_data(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        patient_id = data.get('patient_id')

        try:
            # Retrieve the patient by ID
            patient = PatientInformation.objects.get(id=patient_id)
            patient_vs1 = VitalSigns1.objects.filter(patient_id=patient_id)
            patient_vs2 = VitalSigns2.objects.filter(patient_id=patient_id)
            med = Medication.objects.filter(patient_id=patient_id)
            notes = NurseNotes.objects.filter(patient_id=patient_id)
            print("patient ID: " + patient_id)
            response_object = {
                'status': 'success',
                'patient_data': {
                    #details
                    'id': patient.id,  # UUID field for the patient
                    'name': patient.name,  # Patient's name
                    'sex': patient.get_sex_display(),  # Human-readable sex using choices
                    'birthday': patient.birthday,  # Patient's birthdate
                    'phone_number': patient.phone_number,  # Patient's phone number
                    'status': patient.get_status_display(),  # Human-readable status using choices
                    'ward': patient.get_ward_display(),  # Human-readable ward using choices
                    'qr_code': patient.qr_code.url if patient.qr_code else None,  # Patient's QR code URL
                    'created_at': patient.created_at,  # Timestamp when the patient record was created
                    #vs1
                    'allergies': patient_vs1[0].allergies,
                    'family_history': patient_vs1[0].family_history,
                    'physical_exam': patient_vs1[0].physical_exam,
                    'diagnosis': patient_vs1[0].diagnosis,
                    #vs2
                    'date_and_time': patient_vs2[0].date_and_time,
                    'temperature': patient_vs2[0].temperature,
                    'blood_pressure': patient_vs2[0].blood_pressure,
                    'pulse': patient_vs2[0].pulse_rate,
                    'respiratory': patient_vs2[0].respiratory_rate,
                    'oxygen': patient_vs2[0].oxygen_saturation,
                    #med
                    'drug_name': med[0].drug_name,
                    'dose': med[0].dose,
                    'units': med[0].units,
                    'frequency': med[0].frequency,
                    'route': med[0].route,
                    'duration': med[0].duration,
                    'quantity': med[0].quantity,
                    'start_date': med[0].start_date,
                    'status': med[0].status,
                    'health_diagnostic': med[0].health_diagnostics,
                    'patient_instructions': med[0].patient_instructions,
                    'pharmacist_instructions': med[0].pharmacist_instructions,
                    #note
                    'date': notes[0].date,
                    'notes': notes[0].notes,
                    'nurse_id': notes[0].nurse_id,
                }
            }
            return JsonResponse(response_object)
        except PatientInformation.DoesNotExist:
            return JsonResponse({'status': 'fail', 'error': 'Patient not found'})

    return JsonResponse({'status': 'fail', 'error': 'Invalid request method'})
