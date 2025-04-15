import os
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet, InvalidToken
from django.utils import timezone



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
        """
        Remove an employee by employee_id.
        :param employee_id: The employee_id of the employee to remove.
        :return: True if the employee was removed, False otherwise.
        """
        try:
            employee = cls.objects.get(employee_id=employee_id)
            employee.delete()
            return True
        except cls.DoesNotExist:
            return False  # Employee not found
        

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
    def get_employee_by_shift_id(cls, shift_id):
        """Get the employee object corresponding to the given shift_id."""
        try:
            shift = cls.objects.get(pk=shift_id)
            return shift.employee
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_employee_by_shift_id(cls, shift_id):
        """Get the employee object corresponding to the given shift_id."""
        try:
            shift = cls.objects.get(pk=shift_id)
            return shift.employee
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