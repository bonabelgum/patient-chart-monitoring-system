
import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.core.serializers import serialize
from django.core.exceptions import ValidationError
from datetime import datetime
from django.utils.timezone import localtime, now

from .models import Employee, Nurse_logs, PatientInformation, Shift_schedule, VitalSigns1, VitalSigns2, Medication, NurseNotes, MedicationLogs

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
            logs = MedicationLogs.objects.filter(patient_id=patient_id)
            notes = NurseNotes.objects.filter(patient_id=patient_id).order_by('-date')
            # print("patient ID: " + patient_id)

            # Prepare vitals data
            vitals_data = []
            for vs in patient_vs2:
                vitals_data.append({
                    'datetime': localtime(vs.date_and_time).strftime('%B %d, %Y %H:%M:%S'),
                    'temperature': vs.temperature,
                    'blood_pressure': vs.blood_pressure,
                    'pulse': vs.pulse_rate,
                    'respiratory': vs.respiratory_rate,
                    'oxygen': vs.oxygen_saturation,
                    'remarks': vs.remarks,
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
                    'start_date': drug.start_date.strftime('%B %d, %Y') if drug.start_date else None,
                    'end_date': drug.end_date.strftime('%B %d, %Y') if drug.end_date else None,
                    'status': drug.status,
                    'health_diagnostic': drug.health_diagnostics,
                    'patient_instructions': drug.patient_instructions,
                    'pharmacist_instructions': drug.pharmacist_instructions,
                    'id': drug.id
                })

            #med logs
            med_dict = {drug['id']: drug for drug in med_data}
            # Get medication logs
            logs = MedicationLogs.objects.filter(patient=patient).order_by('-date_time')
            med_logs = []
            for log in logs:
                log_data = {
                    'datetime': localtime(log.date_time).strftime('%B %d, %Y %H:%M:%S'),
                    'administered_by': log.administered_by,
                    'status': log.get_status_display(),
                    'remarks': log.remarks,
                    'medication_id': log.medication.id if log.medication else None
                }
                # print("sorted "+localtime(log.date_time).strftime('%B %d, %Y %H:%M:%S'))
                # Add drug_name if medication exists in med_dict
                if log.medication and log.medication.id in med_dict:
                    log_data['drug_name'] = med_dict[log.medication.id]['drug_name']
                else:
                    log_data['drug_name'] = None  
                
                med_logs.append(log_data)

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
                    'name': patient.name, 
                    'sex': patient.get_sex_display(),  
                    'birthday': patient.birthday.strftime('%B %d, %Y'), 
                    'weight': patient.weight, 
                    'height': patient.height,
                    'phone_number': patient.phone_number, 
                    'pt_status': patient.get_status_display(), 
                    'number': str(patient.number) if patient.number else None,
                    'ward': patient.ward,
                    'qr_code': patient.qr_code.url if patient.qr_code else None, 
                    'created_at': patient.created_at, 
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
                'notes_data': notes_data,
                'med_logs': med_logs
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
        
        nurse_id = request.session.get('user_id')
        nurse = Employee.objects.get(employee_id=nurse_id)
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
                'weight': data.get('editedWeight'), 
                'height': data.get('editedHeight'),
                'number': data.get('editedNumber'),
                'ward': data.get('editedWard'),
                'status': data.get('editedStatus'),
                'physician_name': data.get('editedPhysician'),
                'phone_number': data.get('editedPhone')
            }
            
            # Validate and clean data
            try:
                # Convert birthday string to date object if provided
                if update_fields['birthday']:
                    update_fields['birthday'] = datetime.strptime(update_fields['birthday'], '%Y-%m-%d')
                
                # Update patient fields
                for field, value in update_fields.items():
                    if value is not None:  # Only update if value was provided
                        setattr(patient, field, value)
                
                print("Reason "+data.get('editedReason'))
                # Full clean and save
                patient.full_clean()
                patient.save()
                Nurse_logs.add_log_activity("Nurse "+nurse.name+" Updated Patient "+ data.get('editedName')+" Data: "+data.get('editedReason'))
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Patient information updated successfully',
                    'updated_patient': {
                        'id': patient.id,
                        'name': patient.name,
                        'sex': patient.sex,
                        'birthday': patient.birthday.strftime('%B %d, %Y'),
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
    
def save_vital_signs(request):
    patient_id = request.session.get('patient_id')
    patient = get_object_or_404(PatientInformation, id=patient_id)
    nurse_id = request.session.get('user_id')
    nurse = Employee.objects.get(employee_id=nurse_id)

    if request.method == 'POST':
        data = json.loads(request.body)
        remarks = data.get('remark') or 'N/A'  # Default to 'N/A' if empty or null

        vital_signs = VitalSigns2(
            patient=patient,
            temperature=data.get('temperature'),
            blood_pressure=data.get('blood_pressure'),
            pulse_rate=data.get('pulse'),
            respiratory_rate=data.get('respiratory_rate'),
            oxygen_saturation=data.get('oxygen'),
            remarks=remarks
        )

        vital_signs.save()

        Nurse_logs.add_log_activity(
            f"Nurse {nurse.name} recorded vital signs for patient {patient.name}: "
            f"Temp {vital_signs.temperature}°C, BP {vital_signs.blood_pressure}, "
            f"Pulse {vital_signs.pulse_rate} bpm."
        )

        return JsonResponse({'status': 'success', 'message': 'Vital signs added successfully'})

    return JsonResponse({'status': 'failure', 'message': 'Invalid request'}, status=400)


@require_POST
def update_vs1(request):
    try:
        data = json.loads(request.body)
        patient_id = request.session.get('patient_id')  # Get patient ID from session

        if not patient_id:
            return JsonResponse({'success': False, 'error': 'No patient ID in session'})

        is_valid = verify_master_key_for_all_employees(data.get('password'))  # Check if shift password is correct

        if is_valid:
            # Find the VitalSigns1 record for this patient
            vital_signs = VitalSigns1.objects.filter(patient_id=patient_id).first()
            nurse_id = request.session.get('user_id')
            nurse = Employee.objects.get(employee_id=nurse_id)

            # If not found, create a new VitalSigns1 record
            if not vital_signs:
                # Create new vital signs record
                vital_signs = VitalSigns1.objects.create(
                    patient_id=patient_id,
                    allergies=data.get('allergies'),
                    family_history=data.get('family_history'),
                    physical_exam=data.get('physical_exam'),
                    diagnosis=data.get('diagnosis')
                )

                # Log activity for creation
                Nurse_logs.add_log_activity("Nurse "+nurse.name+" Updated Patient  "+data.get('name')+ " Data: "+ data.get('reason'))

            else:
                # If found, update the existing record
                vital_signs.allergies = data.get('allergies')
                vital_signs.family_history = data.get('family_history')
                vital_signs.physical_exam = data.get('physical_exam')
                vital_signs.diagnosis = data.get('diagnosis')
                
                Nurse_logs.add_log_activity("Nurse "+nurse.name+" Updated Patient  "+data.get('name')+ " Data: "+ data.get('reason'))

            # Save changes (whether it's a new or updated record)
            vital_signs.save()

            return JsonResponse({'success': True, 'status': 'success', 'message': 'Vital signs updated successfully'})

        else:
            return JsonResponse({'status': 'failed', "message": "Incorrect Shift Password"})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_POST
def update_vital_signs(request):
    try:
        data = json.loads(request.body)
        
        patient_id = request.session.get('patient_id')  # Get patient ID from session
        patient = get_object_or_404(PatientInformation, id=patient_id)
        
        nurse_id = request.session.get('user_id')
        nurse = Employee.objects.get(employee_id=nurse_id)

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
            if 'remarks' in data:
                vital_sign.remarks = data['remarks']

            vital_sign.save()

            Nurse_logs.add_log_activity("Nurse "+nurse.name+" Patient  "+patient.name+ " Vital Sign: "+data.get('reason'))
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
    
# add med
def save_medication(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Get patient_id from session
            patient_id = request.session.get('patient_id')
            patient = PatientInformation.objects.get(id=patient_id)
            
            nurse_id = request.session.get('user_id')
            nurse = Employee.objects.get(employee_id=nurse_id)
            if not patient_id:
                return JsonResponse({'error': 'Patient ID not found in session.'}, status=400)

            # Optional: Check if patient exists
            try:
                patient = PatientInformation.objects.get(id=patient_id)
            except PatientInformation.DoesNotExist:
                return JsonResponse({'error': 'Patient does not exist.'}, status=404)

            # Map UI values to model choices
            frequency_mapping = {
                'Once daily': 'daily',
                'Twice daily': 'bid',
                'Three times daily': 'tid',
                'Four times daily': 'qid',
                'As needed': 'prn',
                'Every 6 hours': 'q6h',
                'Every 8 hours': 'q8h',
            }
            route_mapping = {
                'Oral': 'oral',
                'IV': 'iv',
                'IM': 'im',
                'Subcutaneous': 'sc',
                'Topical': 'topical',
                'Inhalation': 'inhalation',
            }
            unit_mapping = {
                'mg': 'mg',
                'g': 'g',
                'ml': 'ml',
                'tablet(s)': 'tablet',
                'capsule(s)': 'capsule',
                'drop(s)': 'drop',
            }

            # Create and save Medication object
            medication = Medication.objects.create(
                patient=patient,
                drug_name=data.get('drugName'),
                dose=data.get('dose'),
                units=unit_mapping.get(data.get('units').lower(), 'mg'),  # Default to 'mg' if not mapped
                frequency=frequency_mapping.get(data.get('frequency'), 'daily'),  # Default to 'daily'
                route=route_mapping.get(data.get('route'), 'oral'),  # Default to 'oral'
                duration=data.get('duration'),
                quantity=data.get('quantity'),
                start_date=data.get('startDate'),
                health_diagnostics=data.get('healthDiagnostics') or '',
                patient_instructions=data.get('patientInstructions') or '',
                pharmacist_instructions=data.get('physicianInstructions') or '',
            )

            
            log_message = (
                f"Nurse {nurse.name} added a new medication for patient {patient.name}: "
                f"Drug Name: {medication.drug_name}, Dose: {medication.dose}{medication.units}, "
                f"Frequency: {medication.get_frequency_display()}, Route: {medication.get_route_display()}, "
                f"Duration: {medication.duration} days, Quantity: {medication.quantity}, "
                f"Start Date: {medication.start_date}."
            )

            Nurse_logs.add_log_activity(log_message)
            # Nurse_logs.add_log_activity("Nurse "+nurse.name+" Added Patient  "+patient.name+ " Medication: ")
            return JsonResponse({'message': 'Medication added successfully!', 'medication_id': medication.id})

        except Exception as e:
            print(e)
            return JsonResponse({'error': 'Something went wrong.'}, status=500)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)
 
# edit med
@require_POST
def update_medication(request):
    try:
        data = json.loads(request.body)
        # print("Received medication data:", data)
        patient_id = request.session.get('patient_id')
            
        patient = PatientInformation.objects.get(id=patient_id)
        
        nurse_id = request.session.get('user_id')
        nurse = Employee.objects.get(employee_id=nurse_id)
        print(data)
        
        is_valid = verify_master_key_for_all_employees(data.get('password')) # Check if shift password is correct
        
        if is_valid == True:
            new_logs = data.get('newly_added_logs', [])  # Save this to db

            medication = get_object_or_404(Medication, id=data.get('id'))

            for log in new_logs:
                print("Log Entry:")
                print("Datetime:", log.get('datetime'))
                print("Status:", log.get('status'))
                print("Administered By:", log.get('administered_by'))

                # Create and save a new MedicationLogs entry using the fetched medication
                MedicationLogs.objects.create(
                    patient=patient,
                    medication=medication,  # Associate the fetched medication object
                    date_time=log.get('datetime'),
                    administered_by=log.get('administered_by'),
                    status=log.get('status')
                )

                # Update Medication fields
            if data.get('drug_name') is not None:
                medication.drug_name = data['drug_name']
            if data.get('dose') is not None:
                medication.dose = data['dose']
            if data.get('units') is not None:
                medication.units = data['units']
            if data.get('frequency') is not None:
                medication.frequency = data['frequency']
            if data.get('route') is not None:
                medication.route = data['route']
            if data.get('duration') is not None:
                medication.duration = data['duration']
            if data.get('status') is not None:
                medication.status = data['status']
            if data.get('health_diagnostic') is not None:
                medication.health_diagnostics = data['health_diagnostic']
            if data.get('patient_instructions') is not None:
                medication.patient_instructions = data['patient_instructions']
            if data.get('pharmacist_instructions') is not None:
                medication.pharmacist_instructions = data['pharmacist_instructions']

            # Save updates to medication
            medication.save()



            log_message = (
                f"Nurse {nurse.name} updated medication for patient {patient.name}: "
                f"Drug Name: {medication.drug_name}, Dose: {medication.dose}{medication.units}, "
                f"Frequency: {medication.frequency}, Route: {medication.route}, "
                f"Duration: {medication.duration} days, Status: {medication.status}."
            )

            Nurse_logs.add_log_activity(log_message)
            # Nurse_logs.add_log_activity("Nurse "+nurse.name+" Updated Patient  "+patient.name+ " Medication: ")
            return JsonResponse({'status': 'success', 'message': 'Medication updated successfully'})
        else:
            # print("wrong shift_password ")s
            return JsonResponse({'status': 'failed', "message": "Incorrect Shift Password"})
        
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    

# Med logs
def medication_log(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        nurse_id = request.session.get('user_id')

        try:
            nurse = Employee.objects.get(employee_id=nurse_id)
        except Employee.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Nurse not found'}, status=404)

        # Save to the database or process the data
        print("Received:", data)

        # Example response with nurse name
        return JsonResponse({
            'status': 'success',
            'message': 'Medication logged.',
            'nurse_name': nurse.name  # or use first_name + last_name
        })

    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)

def get_medication_logs(request, patient_id, medication_id):
    logs = MedicationLogs.objects.filter(patient_id=patient_id, medication_id=medication_id).order_by('-date_time')
    print("hello loaded hehe")
    
    data = []
    for log in logs:
        local_dt = localtime(log.date_time)  # Convert to local time (Asia/Manila if settings are correct)
        data.append({
            'id': log.id,
            'datetime': local_dt.strftime('%B %d, %Y %H:%M:%S'),  # e.g., May 08, 2025 14:35:00
            'administered_by': log.administered_by,
            'status': log.status,
            'remarks': log.remarks
        })

    return JsonResponse(data, safe=False)

#  add notes
def save_notes(request):
    if request.method == 'POST':
        try:
            # Parse the incoming JSON data
            note_data = json.loads(request.body)
            # Extract data from the note
            content = note_data.get('content')
            time = note_data.get('time')
            patient_id = request.session.get('patient_id')  # Get patient ID from session
            nurse_id = request.session.get('user_id')
            # print('sdfsdfd'+nurse_id)

            # Validate the data
            if not content or not time or not patient_id or not nurse_id:
                return JsonResponse({'message': 'Missing required fields'}, status=400)

            # Fetch the patient and nurse objects using their IDs
            try:
                patient = PatientInformation.objects.get(id=patient_id)
                nurse = Employee.objects.get(employee_id=nurse_id)
            except PatientInformation.DoesNotExist:
                return JsonResponse({'message': 'Patient not found'}, status=404)
            except Employee.DoesNotExist:
                return JsonResponse({'message': 'Nurse not found'}, status=404)

            # Create and save the nurse note
            nurse_note = NurseNotes(
                patient=patient,
                nurse=nurse,
                notes=content,
                date=time  # Assuming `time` is a valid datetime string or use `datetime.strptime()` to parse it
            )
            nurse_note.save()

            # Return a success response
            return JsonResponse({'result': True, 'id': nurse_note.id,'message': 'Note saved successfully'}, status=200)

        except Exception as e:
            # Handle unexpected errors
            return JsonResponse({'message': f'Error: {str(e)}'}, status=400)

    return JsonResponse({'message': 'Invalid method'}, status=405)

# delete note
def delete_note(request):
    if request.method == 'DELETE':
        try:
            # Parse the incoming JSON data
            note_data = json.loads(request.body)
            note_id = note_data.get('id')

            if not note_id:
                return JsonResponse({'message': 'Note ID is required'}, status=400)

            # Try to find the note in the database and delete it
            try:
                note = NurseNotes.objects.get(id=note_id)
                note.delete()  # Delete the note from the database
                return JsonResponse({'status': 'success', 'message': 'Note deleted successfully'}, status=200)
            except NurseNotes.DoesNotExist:
                return JsonResponse({'message': 'Note not found'}, status=404)

        except Exception as e:
            return JsonResponse({'message': f'Error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Invalid method'}, status=405)

# edit note
def edit_note(request):
    if request.method == 'POST':
        try:
            note_data = json.loads(request.body)
            note_id = note_data.get('id')
            content = note_data.get('content')
            time = note_data.get('time')

            if not note_id or not content or not time:
                return JsonResponse({'message': 'Missing required fields'}, status=400)

            # Find the note in the database and update it
            try:
                note = NurseNotes.objects.get(id=note_id)
                note.notes = content
                note.save()

                return JsonResponse({'status': 'success', 'message': 'Note updated successfully'}, status=200)
            except NurseNotes.DoesNotExist:
                return JsonResponse({'message': 'Note not found'}, status=404)

        except Exception as e:
            return JsonResponse({'message': f'Error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Invalid method'}, status=405)

    
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