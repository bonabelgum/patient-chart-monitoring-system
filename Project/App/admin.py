from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'employee_id', 'phone_number')  # Display fields
    search_fields = ('name', 'email')  # Search by name and email
    list_filter = ('sex', 'role')  # Use 'role' instead of 'position'
    ordering = ('name',)  # Sort by name
