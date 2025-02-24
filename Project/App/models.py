from django.db import models



class Employee(models.Model):
    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    name = models.CharField(max_length=255)
    birthdate = models.DateField()
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    employee_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True)

    def __str__(self):
        return f"{self.name} ({self.role})"
