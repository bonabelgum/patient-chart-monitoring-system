
import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
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
        request.session['patient_id'] = patient_id

        try:
            # Retrieve the patient by ID
            patient = PatientInformation.objects.get(id=patient_id)
            patient_vs1 = VitalSigns1.objects.filter(patient_id=patient_id)
            patient_vs2 = VitalSigns2.objects.filter(patient_id=patient_id)
            med = Medication.objects.filter(patient_id=patient_id)
            notes = NurseNotes.objects.filter(patient_id=patient_id).order_by('-date')
            # print("patient ID: " + patient_id)

            # Prepare vitals data
            vitals_data = []
            for vs in patient_vs2:
                vitals_data.append({
                    'datetime': vs.date_and_time.strftime('%Y-%m-%d %H:%M:%S'),
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
    
# add vital signs 
def save_vital_signs(request):
    patient_id = request.session.get('patient_id')  # Get patient ID from session
    patient = get_object_or_404(PatientInformation, id=patient_id)

    if request.method == 'POST':
        data = json.loads(request.body)
        vital_signs = VitalSigns2(
            patient=patient,
            temperature=data.get('temperature'),
            blood_pressure=data.get('blood_pressure'),
            pulse_rate=data.get('pulse'),
            respiratory_rate=data.get('respiratory_rate'),
            oxygen_saturation=data.get('oxygen'),
        )
        
        
        vital_signs.save()

        return JsonResponse({'status': 'success', 'message': 'Vital signs added successfully'})

    return JsonResponse({'status': 'failure', 'message': 'Invalid request'}, status=400)


@require_POST
def update_vs1(request):
    try:
        data = json.loads(request.body)
        patient_id = request.session.get('patient_id')  # Get patient ID from session

        if not patient_id:
            return JsonResponse({'success': False, 'error': 'No patient ID in session'})

        
        is_valid = verify_master_key_for_all_employees(data.get('password')) # Check if shift password is correct
        
        if is_valid == True:
            # Find the VitalSigns1 record for this patient
            vital_signs = VitalSigns1.objects.filter(patient_id=patient_id).first()

            if not vital_signs:
                return JsonResponse({'success': False, 'error': 'Vital signs record not found'})

            # Update fields
            vital_signs.allergies = data.get('allergies')
            vital_signs.family_history = data.get('family_history')
            vital_signs.physical_exam = data.get('physical_exam')
            vital_signs.diagnosis = data.get('diagnosis')

            # Save changes
            vital_signs.save()

            return JsonResponse({'success': True, 'status': 'success', 'message': 'Vital signs updated successfully'})
        
        else:
            # print("wrong shift_password ")s
            return JsonResponse({'status': 'failed', "message": "Incorrect Shift Password"})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    
@require_POST
def update_vital_signs(request):
    try:
        data = json.loads(request.body)

        # print('Received vital signs data:', data)
        
        
        is_valid = verify_master_key_for_all_employees(data.get('password')) # Check if shift password is correct
        
        if is_valid == True:
            
            # Fetch the VitalSigns2 instance
            vs_id = data.get('id')
            if not vs_id:
                return JsonResponse({'status': 'error', 'message': 'ID is required'}, status=400)

            vital_sign = get_object_or_404(VitalSigns2, id=vs_id)

            # Update fields if provided
            if 'temperature' in data:
                vital_sign.temperature = data['temperature'] or None
            if 'blood_pressure' in data:
                vital_sign.blood_pressure = data['blood_pressure'] or None
            if 'pulse' in data:
                vital_sign.pulse_rate = data['pulse'] or None
            if 'respiratory' in data:
                vital_sign.respiratory_rate = data['respiratory'] or None
            if 'oxygen' in data:
                vital_sign.oxygen_saturation = data['oxygen'] or None

            vital_sign.save()

            return JsonResponse({'status': 'success', 'message': 'Vital signs updated successfully'})
        
        else:
            # print("wrong shift_password ")s
            return JsonResponse({'status': 'failed', "message": "Incorrect Shift Password"})

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except VitalSigns2.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Vital signs record not found'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
 
@require_POST
def update_medication(request):
    try:
        data = json.loads(request.body)
        # print("Received medication data:", data)
        
        is_valid = verify_master_key_for_all_employees(data.get('password')) # Check if shift password is correct
        
        if is_valid == True:
            medication = get_object_or_404(Medication, id=data.get('id'))

            # Update fields
            medication.drug_name = data.get('drug_name', medication.drug_name)
            medication.dose = data.get('dose', medication.dose)
            medication.units = data.get('units', medication.units)
            medication.frequency = data.get('frequency', medication.frequency)
            medication.route = data.get('route', medication.route)
            medication.health_diagnostics = data.get('health_diagnostic', medication.health_diagnostics)
            medication.patient_instructions = data.get('patient_instructions', medication.patient_instructions)
            medication.pharmacist_instructions = data.get('pharmacist_instructions', medication.pharmacist_instructions)
            
            # Save the updated Medication
            medication.save()

            return JsonResponse({'status': 'success', 'message': 'Medication updated successfully'})
        else:
            # print("wrong shift_password ")s
            return JsonResponse({'status': 'failed', "message": "Incorrect Shift Password"})
        
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
    
def check_shift_password(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        # password = data.get('password')
        
        is_valid = verify_master_key_for_all_employees(data.get('password')) # Check if shift password is correct
        
        if is_valid == True:
            # print("ytes valid po")
            return JsonResponse({'is_valid': True})
        else:
            return JsonResponse({'is_valid': False})