#storing qr
from rest_framework import serializers
from .models import PatientInformation

class PatientInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientInformation
        fields = '__all__'