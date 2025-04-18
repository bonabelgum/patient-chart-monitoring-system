from django.contrib import admin
from django.utils.html import format_html
from .models import Admin_logs, Employee, Shift_schedule

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
    
@admin.register(Admin_logs)
class AdminLogsAdmin(admin.ModelAdmin):
    list_display = ('formatted_date', 'truncated_activity')
    list_filter = ('date_time',)
    search_fields = ('activity',)
    ordering = ('-date_time',)  # Newest first by default
    readonly_fields = ('date_time',)  # Make datetime non-editable
    list_per_page = 20  # Items per page

    def formatted_date(self, obj):
        return obj.date_time.strftime('%Y-%m-%d %H:%M:%S')
    formatted_date.short_description = 'Date/Time'
    formatted_date.admin_order_field = 'date_time'

    def truncated_activity(self, obj):
        return format_html(
            '<span title="{}">{}</span>',
            obj.activity,
            obj.activity[:75] + '...' if len(obj.activity) > 75 else obj.activity
        )
    truncated_activity.short_description = 'Activity'