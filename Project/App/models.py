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
        
        
    # delete employee
    @classmethod
    def delete_with_master_key(cls, master_key_input, employee_id_to_delete):
    
        try:
            # Get the employee to be deleted
            employee_to_delete = cls.objects.get(employee_id=employee_id_to_delete)
            
            # Get all employees with master keys
            potential_admins = cls.objects.exclude(master_key__isnull=True).exclude(master_key='')
            
            # Check if any admin has the matching master key
            valid_admin = None
            for admin in potential_admins:
                if admin.verify_master_key(master_key_input):
                    valid_admin = admin
                    break
            
            if not valid_admin:
                return (False, "Invalid master key")
                
            # Prevent self-deletion
            if valid_admin.employee_id == employee_id_to_delete:
                return (False, "Cannot delete yourself with your own master key")
                
            # Proceed with deletion
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
    def delete_shift_by_id(cls, shift_id):
        """Delete a single shift by its ID (primary key)"""
        try:
            deleted_count, _ = cls.objects.filter(id=shift_id).delete()
            return deleted_count
        except Exception as e:
            # Log the error if needed
            print(f"Error deleting shift: {e}")
            return 0
        
class Admin_logs(models.Model):
    date_time = models.DateTimeField(default=timezone.now)
    activity = models.TextField()

    def __str__(self):
        return f"[{self.date_time}] {self.activity}"

    @classmethod
    def add_log_activity(cls, activity_message):
        """Class method to quickly create a new log entry."""
        return cls.objects.create(activity=activity_message)
    
    @classmethod
    def get_all_logs(cls):
        """Class method to return all logs as a list of dicts."""
        return [
            {
                'date_time': log.date_time.strftime('%Y-%m-%d %H:%M:%S'),
                'activity': log.activity
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
        ('General', 'General Ward'),
        ('Pediatrics', 'Pediatrics'),
        ('ICU', 'Intensive Care Unit'),
        ('Maternity', 'Maternity Ward'),
        ('None', 'None'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    birthday = models.DateField()
    phone_number = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    ward = models.CharField(max_length=20, choices=WARD_CHOICES)
    qr_code = models.ImageField(upload_to='qr_codes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.qr_code:  # Only generate if doesn't exist
            qr = qrcode.QRCode(
                version=1,  # Smaller version (1-40, 1 is smallest)
                error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
                box_size=8,  # Smaller pixels but still readable
                border=2,    # Minimal border
            )
        
            # Minimal data - just ID and initials for smaller QR
            qr_data = f"ID:{self.id}"
            qr.add_data(qr_data)
            qr.make(fit=True)
        
            # Create blank white image with QR code
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to 300dpi for better print quality
            img = img.resize((300, 300))  # Fixed size for wristband
            
            buffer = BytesIO()
            img.save(buffer, format="PNG", dpi=(300, 300))
            
            fname = f'qr_wristband_{self.id}.png'
            self.qr_code.save(fname, File(buffer), save=False)
            buffer.close()
    
        super().save(*args, **kwargs)