from django.contrib import admin
from django.utils.html import format_html
from .models import Admin_logs, Employee, MedicationLogs, PatientInformation, Shift_schedule, VitalSigns1, VitalSigns2, Medication, NurseNotes
    

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
    
@admin.register(PatientInformation)
class PatientInformationAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'status', 'ward', 'created_at', 'qr_code')
    search_fields = ('name', 'phone_number', 'status')
    list_filter = ('status', 'sex', 'ward', 'created_at')
    ordering = ('name',)
    fieldsets = (
        (None, {
            'fields': ('name', 'sex', 'birthday', 'phone_number', 'status', 'ward', 'qr_code')
        }),
        ('Dates', {
            'fields': ('created_at',),
        }),
    )
    readonly_fields = ('created_at', 'id')
    
@admin.register(VitalSigns1)
class VitalSigns1Admin(admin.ModelAdmin):
    list_display = ('patient', 'created_at', 'updated_at')
    search_fields = ('patient__name',)
    list_filter = ('created_at',)

@admin.register(VitalSigns2)
class VitalSigns2Admin(admin.ModelAdmin):
    list_display = ('patient', 'date_and_time', 'temperature', 'blood_pressure', 'pulse_rate')
    search_fields = ('patient__name',)
    list_filter = ('date_and_time',)

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('patient', 'drug_name', 'dose', 'units', 'status', 'start_date')
    search_fields = ('patient__name', 'drug_name')
    list_filter = ('status', 'start_date', 'route')

@admin.register(NurseNotes)
class NurseNotesAdmin(admin.ModelAdmin):
    list_display = ('patient', 'nurse', 'date', 'last_updated')
    search_fields = ('patient__name', 'nurse__employee_id')
    list_filter = ('date',)

@admin.register(MedicationLogs)
class MedicationLogsAdmin(admin.ModelAdmin):
    list_display = ('patient', 'medication', 'date_time', 'administered_by', 'status')
    search_fields = ('patient__name', 'medication__name', 'administered_by')
    list_filter = ('status', 'date_time')
    list_editable = ('status',)
    ordering = ('-date_time',)
    fieldsets = ((None, {'fields': ('patient', 'medication', 'date_time', 'administered_by', 'status')}),)
