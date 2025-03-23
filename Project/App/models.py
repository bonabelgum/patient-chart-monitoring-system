import os
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet, InvalidToken



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
    master_key = models.CharField(max_length=16, blank=True, null=True, unique=True)  # Optional field
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