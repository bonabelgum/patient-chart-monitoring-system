from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'employee_id', 'phone_number','status')  # Display fields
    search_fields = ('name', 'email')  # Search by name and email
    list_filter = ('sex', 'role', 'status')  # Use 'role' instead of 'position'
    ordering = ('name',)  # Sort by name
