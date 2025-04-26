
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.exceptions import ValidationError
from datetime import datetime
from django.utils.timezone import localtime, now

from .models import PatientInformation, Shift_schedule, VitalSigns1, VitalSigns2, Medication, NurseNotes

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
            notes = NurseNotes.objects.filter(patient_id=patient_id).order_by('-date')
            print("patient ID: " + patient_id)

            # Prepare vitals data
            vitals_data = []
            for vs in patient_vs2:
                vitals_data.append({
                    'datetime': vs.date_and_time,
                    'temperature': vs.temperature,
                    'blood_pressure': vs.blood_pressure,
                    'pulse': vs.pulse_rate,
                    'respiratory': vs.respiratory_rate,
                    'oxygen': vs.oxygen_saturation,
                    'id': vs.id  
                })
            # Prepare med data
            med_data = []
            for drug in med:
                med_data.append({
                    'drug_name': drug.drug_name,
                    'dose': drug.dose,
                    'units': drug.units,
                    'frequency': drug.frequency,
                    'route': drug.route,
                    'duration': drug.duration,
                    'quantity': drug.quantity,
                    'start_date': drug.start_date,
                    'status': drug.status,
                    'health_diagnostic': drug.health_diagnostics,
                    'patient_instructions': drug.patient_instructions,
                    'pharmacist_instructions': drug.pharmacist_instructions,
                    'id': drug.id
                })
                #prepare notes data
            notes_data = []
            for note in notes:
                notes_data.append({
                    'id': note.id,
                    'date': note.date.isoformat(),
                    'notes': note.notes,
                    'nurse_id': note.nurse_id
                })

            response_object = {
                'status': 'success',
                'patient_data': {
                    #details
                    'id': patient.id,  # UUID field for the patient
                    'name': patient.name,  # Patient's name
                    'sex': patient.get_sex_display(),  # Human-readable sex using choices
                    'birthday': patient.birthday,  # Patient's birthdate
                    'phone_number': patient.phone_number,  # Patient's phone number
                    'pt_status': patient.get_status_display(),  # Human-readable status using choices
                    'ward': patient.get_ward_display(),  # Human-readable ward using choices
                    'qr_code': patient.qr_code.url if patient.qr_code else None,  # Patient's QR code URL
                    'created_at': patient.created_at,  # Timestamp when the patient record was created
                    'physician_name': patient.physician_name,
                    #vs1
                    'allergies': patient_vs1[0].allergies if patient_vs1 else None,
                    'family_history': patient_vs1[0].family_history if patient_vs1 else None,
                    'physical_exam': patient_vs1[0].physical_exam if patient_vs1 else None,
                    'diagnosis': patient_vs1[0].diagnosis if patient_vs1 else None,
                    #vs2
                    '''date_and_time': patient_vs2[0].date_and_time if patient_vs2 else None,
                    'temperature': patient_vs2[0].temperature if patient_vs2 else None,
                    'blood_pressure': patient_vs2[0].blood_pressure if patient_vs2 else None,
                    'pulse': patient_vs2[0].pulse_rate if patient_vs2 else None,
                    'respiratory': patient_vs2[0].respiratory_rate if patient_vs2 else None,
                    'oxygen': patient_vs2[0].oxygen_saturation if patient_vs2 else None,'''
                    #med
                    '''drug_name': med[0].drug_name if med else None,
                    'dose': med[0].dose if med else None,
                    'units': med[0].units if med else None,
                    'frequency': med[0].frequency if med else None,
                    'route': med[0].route if med else None,
                    'duration': med[0].duration if med else None,
                    'quantity': med[0].quantity if med else None,
                    'start_date': med[0].start_date if med else None,
                    'status': med[0].status if med else None,
                    'health_diagnostic': med[0].health_diagnostics if med else None,
                    'patient_instructions': med[0].patient_instructions if med else None,
                    'pharmacist_instructions': med[0].pharmacist_instructions if med else None,'''
                    #note
                    'date': notes[0].date if notes else None,
                    'notes': notes[0].notes if notes else None,
                    'nurse_id': notes[0].nurse_id if notes else None,
                },
                'vitals_data': vitals_data,
                'med_data': med_data,
                'notes_data': notes_data
            }
            #print(vitals_data)
            return JsonResponse(response_object)
        except PatientInformation.DoesNotExist:
            return JsonResponse({'status': 'fail', 'error': 'Patient not found'})

    return JsonResponse({'status': 'fail', 'error': 'Invalid request method'})


@require_POST # Add logs for editing patient and reason
def update_patient(request):
    try:
        data = json.loads(request.body)
        
        # Get the patient ID and validate it exists
        patient_id = data.get('patientId')
        if not patient_id:
            return JsonResponse({'status': 'error', 'message': 'Patient ID is required'}, status=400)
        
        try: #
            patient = PatientInformation.objects.get(id=patient_id)
        except PatientInformation.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Patient not found'}, status=404)
        
        
        
        nurse_id = request.session.get('confirm_nurse_id') # Get nurse id
        is_active = get_active_shift(nurse_id) # Get active shift
        is_valid = verify_master_key_for_all_employees(data.get('editedPassword')) # Check if shift password is correct
        
        if is_valid == True:
            print('dd')
            # Prepare update data
            update_fields = {
                'name': data.get('editedName'),
                'sex': data.get('editedSex'),
                'birthday': data.get('editedBday'),
                'ward': data.get('editedWard'),
                'status': data.get('editedStatus'),
                'physician_name': data.get('editedPhysician'),
                'phone_number': data.get('editedPhone')
            }
            
            # Validate and clean data
            try:
                # Convert birthday string to date object if provided
                if update_fields['birthday']:
                    update_fields['birthday'] = datetime.strptime(update_fields['birthday'], '%Y-%m-%d').date()
                
                # Update patient fields
                for field, value in update_fields.items():
                    if value is not None:  # Only update if value was provided
                        setattr(patient, field, value)
                
                # Full clean and save
                patient.full_clean()
                patient.save()
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Patient information updated successfully',
                    'updated_patient': {
                        'id': patient.id,
                        'name': patient.name,
                        'sex': patient.sex,
                        'birthday': patient.birthday.strftime('%Y-%m-%d'),
                        'ward': patient.ward,
                        'status': patient.status,
                        'physician_name': patient.physician_name,
                        'phone_number': patient.phone_number
                    }
                })
                
            except ValidationError as e:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Validation error',
                    'errors': e.message_dict
                }, status=400)
                
            except ValueError as e:
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)
                
        else:
            # print("wrong shift_password ")s
            return JsonResponse({"message": "Incorrect Shift Password"})
            
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
def verify_master_key_for_all_employees(master_key_input):
    for shift in Shift_schedule.objects.all():
        if shift.shift_password and shift.verify_shift_password(master_key_input):
            return True  # Match found
    return False  # No match found
    
    
# Check if nurse shift is active
def get_active_shift(employee_id):
        # Get current Manila time
        manila_now = localtime(now())
        current_day = manila_now.isoweekday()
        current_time = manila_now.time()
        
        # Get all shifts for this employee
        shifts = Shift_schedule.get_shifts_by_employee_id(employee_id)
        
        # Check each shift
        for shift in shifts:
            if (shift.day == current_day and 
                shift.start_time <= current_time <= shift.end_time):
                return shift  # Return the active shift
        
        return None  # No active shift