import os
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet, InvalidToken
from django.utils import timezone

#strogin qr
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image
import uuid

from django.utils.timezone import localtime, now
from datetime import timedelta



class Employee(models.Model): 
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Link to User model
    name = models.CharField(max_length=255)
    birthdate = models.DateField()
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    employee_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    master_key = models.TextField(blank=True, null=True) # Optional field
    status = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.role})"

    @classmethod
    def get_by_employee_id(cls, employee_id):
        """Fetch an employee by employee_id."""
        try:
            return cls.objects.get(employee_id=employee_id)
        except cls.DoesNotExist:
            return None  # Return None if no employee is found
        
    def decrypt_master_key(self):
        """Decrypt the master_key using Fernet."""
        ferney_key = os.environ.get('FERNET_KEY')  # Get the Fernet key from .env
        if not self.master_key:
            return None
        fernet = Fernet(ferney_key)
        try:
            decrypted_key = fernet.decrypt(self.master_key.encode())
            return decrypted_key.decode()
        except InvalidToken:
            return None  # Handle invalid or corrupted data
        
    def verify_master_key(self, expected_key):
            """Verify if the decrypted master_key matches the expected key."""
            decrypted_key = self.decrypt_master_key()
            if decrypted_key is None:
                return False  # Invalid or corrupted data
            return decrypted_key == expected_key    
        
    def update_status(self, new_status):
        self.status = new_status
        self.save()  # Save the changes to the database
        
    @classmethod
    def remove_by_employee_id(cls, employee_id):
        try:
            employee = cls.objects.get(employee_id=employee_id)
            employee.delete()
            return True
        except cls.DoesNotExist:
            return False  # Employee not found
        
    @classmethod
    def assign_master_key_to_nurse(cls, employee_id, master_key):
        if not master_key:
            raise ValueError("Master key cannot be empty")
        
        try:
            employee = cls.objects.get(employee_id=employee_id)
            
            if not employee.master_key:
                employee.master_key = master_key
                employee.save()
                return employee, True
            
            return employee, False
            
        except cls.DoesNotExist:
            raise cls.DoesNotExist(f"Employee with ID {employee_id} not found")
        
        
    # delete employee
    @classmethod
    def delete_with_master_key(cls, master_key_input, employee_id_to_delete):
        try:
            employee_to_delete = cls.objects.get(employee_id=employee_id_to_delete)
            potential_admins = cls.objects.exclude(master_key__isnull=True).exclude(master_key='')
            valid_admin = None
            for admin in potential_admins:
                if admin.verify_master_key(master_key_input):
                    valid_admin = admin
                    break
            if not valid_admin:
                return (False, "Invalid master key")
            if valid_admin.employee_id == employee_id_to_delete:
                return (False, "Cannot delete yourself with your own master key")
            employee_to_delete.delete()
            return (True, f"Employee {employee_id_to_delete} deleted successfully")
            
        except cls.DoesNotExist:
            return (False, "Employee not found")
        except Exception as e:
            return (False, f"Error: {str(e)}")
        

class Shift_schedule(models.Model):
    DAYS_OF_WEEK = [
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    ]
    
    
    day = models.PositiveSmallIntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    shift_password = models.TextField(blank=True, null=True) # Optional field
    
    @classmethod
    def get_all_shifts(cls):
        return cls.objects.all().select_related('employee')
    
    @classmethod
    def get_employee_by_shift_id(cls, shift_id):
        """Get the employee object corresponding to the given shift_id."""
        try:
            shift = cls.objects.get(pk=shift_id)
            return shift.employee
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_shift_by_id(cls, shift_id):
        try:
            return cls.objects.get(pk=shift_id)
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_shifts_by_employee_id(cls, employee_id):
        return cls.objects.filter(employee__employee_id=employee_id)
    
    @classmethod
    def get_nearest_shift_by_employee_id(cls, employee_id):
        today = localtime(now()).isoweekday()  # 1 (Monday) to 7 (Sunday)
        
        for i in range(7):  # Check today + next 6 days
            day_to_check = (today + i - 1) % 7 + 1  # Ensures it loops 1-7
            shift = cls.objects.filter(
                employee__employee_id=employee_id,
                day=day_to_check
            ).order_by('start_time').first()
            if shift:
                return shift

        return None
    
    @classmethod
    def delete_shift_by_id(cls, shift_id):
        """Delete a single shift by its ID (primary key)"""
        try:
            deleted_count, _ = cls.objects.filter(id=shift_id).delete()
            return deleted_count
        except Exception as e:
            # Log the error if needed
            print(f"Error deleting shift: {e}")
            return 0
    
    @classmethod
    def delete_shift(cls, shift_id):
        try:
            shift = cls.objects.get(id=shift_id)
            shift.delete()
            return True, f"Shift {shift_id} deleted successfully"
        except cls.DoesNotExist:
            return False, f"Shift with ID {shift_id} does not exist"
        except Exception as e:
            return False, f"Error deleting shift: {str(e)}"
        
        
        
class Admin_logs(models.Model):
    # Stores as UTC (correct for database), displays as local time
    date_time = models.DateTimeField(default=timezone.now)
    activity = models.TextField()

    def __str__(self):
        # Convert to Philippine time before display
        ph_time = localtime(self.date_time)
        return f"[{ph_time.strftime('%Y-%m-%d %H:%M:%S %Z')}] {self.activity}"

    @classmethod
    def add_log_activity(cls, activity_message):
        """Creates log with automatic UTC timestamp"""
        return cls.objects.create(activity=activity_message)
    
    @classmethod
    def get_all_logs(cls):
        """Returns all logs converted to Philippine time"""
        return [
            {
                'date_time': localtime(log.date_time).strftime('%Y-%m-%d %H:%M:%S'),
                'activity': log.activity,
                'timezone': 'Asia/Manila'  # Explicitly state the timezone
            }
            for log in cls.objects.all().order_by('-date_time')
        ]
#storing with qr
class PatientInformation(models.Model):
    STATUS_CHOICES = [
        ('Inpatient', 'Inpatient'),
        ('Outpatient', 'Outpatient'),
        ('Discharge', 'Discharge'),
    ]
    
    SEX_CHOICES = [
        ('Female', 'Female'),
        ('Male', 'Male'),
        ('Other', 'Other'),
    ]
    
    WARD_CHOICES = [
        ('General Ward', 'General Ward'),
        ('Pediatrics', 'Pediatrics'),
        ('ICU', 'Intensive Care Unit'),
        ('Maternity', 'Maternity Ward'),
        ('None', 'None'),
    ]
    
    # id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    birthday = models.DateField()
    phone_number = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    ward = models.CharField(max_length=20, choices=WARD_CHOICES)
    qr_code = models.ImageField(upload_to='qr_codes', blank=True)
    physician_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_patient_by_id(cls, id):
        try:
            return cls.objects.get(id=id)
        except cls.DoesNotExist:
            return None
    @classmethod
    def id_exists(cls, id):    
        return cls.objects.filter(id=id).exists()
        
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None  # Check if it's a new object (no ID yet)

        super().save(*args, **kwargs)  # Save once to get self.id

        if is_new or not self.qr_code:  # Only generate if it's new or QR is missing
            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )

            qr_data = self.id
            qr.add_data(qr_data)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            img = img.resize((300, 300))

            buffer = BytesIO()
            img.save(buffer, format="PNG", dpi=(300, 300))

            fname = f'qr_wristband_{self.id}.png'
            self.qr_code.save(fname, File(buffer), save=False)
            buffer.close()

            # Save ONLY the qr_code field now, so no duplicate insert
            super().save(update_fields=['qr_code'])


#vs
class VitalSigns1(models.Model):
    patient = models.ForeignKey(
        PatientInformation,
        on_delete=models.CASCADE,  # Delete vital signs if patient is deleted
        related_name='vital_signs'  # Allows querying via patient.vital_signs.all()
    )
    allergies = models.TextField(blank=True, null=True)  # Large text for paragraphs
    family_history = models.TextField(blank=True, null=True)
    physical_exam = models.TextField(blank=True, null=True)
    diagnosis = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Auto-set on creation
    updated_at = models.DateTimeField(auto_now=True)      # Auto-updates on save

    def __str__(self):
        return f"Vitals for {self.patient.name} (ID: {self.patient.id})"
#vs2
class VitalSigns2(models.Model):
    patient = models.ForeignKey(
        PatientInformation,
        on_delete=models.CASCADE,  # Delete vitals if patient is deleted
        related_name='vital_signs2'  # Allows querying via patient.vital_signs2.all()
    )
    date_and_time = models.DateTimeField(auto_now_add=True)  # Auto-set on creation
    temperature = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Temperature in °C (e.g., 36.6)",
        null=True,
        blank=True
    )
    blood_pressure = models.CharField(
        max_length=10,
        help_text="Format: '120/80'",
        null=True,
        blank=True
    )
    pulse_rate = models.PositiveIntegerField(
        help_text="Beats per minute (e.g., 72)",
        null=True,
        blank=True
    )
    respiratory_rate = models.PositiveIntegerField(
        help_text="Breaths per minute (e.g., 16)",
        null=True,
        blank=True
    )
    oxygen_saturation = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="SpO2 percentage (e.g., 98.5)",
        null=True,
        blank=True
    )
    def __str__(self):
        return f"Vitals for {self.patient.name} at {self.date_and_time}"
    class Meta:
        ordering = ['-date_and_time']  # Newest entries first
        verbose_name_plural = "Vital Signs 2"  # Human-readable name in admin

#med
from django.db import models
from .models import PatientInformation  # Adjust import as needed

class Medication(models.Model):
    # Status choices (e.g., Active, Completed, Discontinued)
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('inactive', 'Inactive'),
    ]

    # Route choices (e.g., Oral, IV, Topical)
    ROUTE_CHOICES = [
        ('oral', 'Oral'),
        ('iv', 'Intravenous (IV)'),
        ('im', 'Intramuscular (IM)'),
        ('sc', 'Subcutaneous (SC)'),
        ('topical', 'Topical'),
        ('inhalation', 'Inhalation'),
    ]

    # Frequency choices (e.g., Daily, BID, TID)
    FREQUENCY_CHOICES = [
        ('daily', 'Once Daily'),
        ('bid', 'Twice Daily (BID)'),
        ('tid', 'Three Times Daily (TID)'),
        ('qid', 'Four Times Daily (QID)'),
        ('prn', 'As Needed (PRN)'),
    ]

    # Unit choices (e.g., mg, mL, tablets)
    UNIT_CHOICES = [
        ('mg', 'Milligrams (mg)'),
        ('g', 'Grams (g)'),
        ('ml', 'Milliliters (mL)'),
        ('tablet', 'Tablets'),
        ('capsule', 'Capsules'),
        ('drop', 'Drops'),
    ]

    # Patient reference
    patient = models.ForeignKey(
        PatientInformation,
        on_delete=models.CASCADE,
        related_name='medications'  # Query via patient.medications.all()
    )

    # Core medication details
    drug_name = models.CharField(max_length=100)
    dose = models.DecimalField(max_digits=10, decimal_places=2) 
    units = models.CharField(max_length=20, choices=UNIT_CHOICES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    route = models.CharField(max_length=20, choices=ROUTE_CHOICES)
    duration = models.PositiveIntegerField(help_text="e.g., '7 days'") #
    quantity = models.PositiveIntegerField(help_text="Total quantity dispensed")
    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Text fields for notes/instructions
    health_diagnostics = models.TextField(
        blank=True, 
        null=True,
        help_text="Relevant health conditions for this medication"
    )
    patient_instructions = models.TextField(
        blank=True, 
        null=True,
        help_text="Instructions for the patient"
    )
    pharmacist_instructions = models.TextField(
        blank=True, 
        null=True,
        help_text="Special instructions for the pharmacist"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.drug_name} ({self.dose}{self.units}) for {self.patient.name}"

    class Meta:
        ordering = ['-start_date']  # Newest medications first
        verbose_name_plural = "Medications"

#nurse notes
class NurseNotes(models.Model):
    patient = models.ForeignKey(
        PatientInformation,
        on_delete=models.CASCADE,
        related_name='nurse_notes',  # Access via patient.nurse_notes.all()
        verbose_name="Patient"
    )
    nurse = models.ForeignKey(
        'Employee',  # Employee model
        on_delete=models.SET_NULL,  # Preserve notes even if nurse is deleted
        null=True,
        blank=True,
        related_name='nurse_notes',  # Access via employee.nurse_notes.all()
        verbose_name="Nurse",
        to_field='employee_id'  # References Employee.employee_id
    )
    notes = models.TextField(
        verbose_name="Clinical Notes",
        help_text="Detailed nursing notes (supports paragraphs and formatting)"
    )
    date = models.DateTimeField(
        auto_now_add=True,  # Automatically set on creation
        verbose_name="Note Date"
    )
    last_updated = models.DateTimeField(
        auto_now=True,  # Updates on every save
        verbose_name="Last Updated"
    )

    def __str__(self):
        return f"Note for {self.patient.name} by Nurse ID {self.nurse.employee_id if self.nurse else 'Unknown'} on {self.date}"

    class Meta:
        ordering = ['-date']  # Newest notes first
        verbose_name_plural = "Nurse Notes"