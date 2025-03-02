from django.db import models
from django.contrib.auth.models import User



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

    def __str__(self):
        return f"{self.name} ({self.role})"

    @classmethod
    def get_by_employee_id(cls, employee_id):
        """Fetch an employee by employee_id."""
        try:
            return cls.objects.get(employee_id=employee_id)
        except cls.DoesNotExist:
            return None  # Return None if no employee is found