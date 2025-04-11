from django.contrib import admin
from .models import Employee, Shift_schedule

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'employee_id', 'phone_number','status')  # Display fields
    search_fields = ('name', 'email')  # Search by name and email
    list_filter = ('sex', 'role', 'status')  # Use 'role' instead of 'position'
    ordering = ('name',)  # Sort by name


@admin.register(Shift_schedule)
class ShiftScheduleAdmin(admin.ModelAdmin):
    list_display = ('get_day_name', 'employee', 'start_time', 'end_time')
    list_filter = ('day', 'employee')
    search_fields = ('employee__name',)
    ordering = ('day', 'start_time')
    
    def get_day_name(self, obj):
        return dict(Shift_schedule.DAYS_OF_WEEK).get(obj.day, 'Unknown')
    get_day_name.short_description = 'Day'
    get_day_name.admin_order_field = 'day'