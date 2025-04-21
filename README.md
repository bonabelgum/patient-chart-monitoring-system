# patient-chart-monitoring-system
Patient Chart Monitoring and Management System

Instructions to run:
1. After cloning, set up virtual environment
2. Run "venv\Scripts\activate" for Windows or "source venv/bin/activate" for Mac/Linux to activate
3. Inside of the venv, navigate to the first Project folder
4. Install dependencies by running "pip install -r requirements.txt"
5. Create your own env variables
6. To run, "python manage.py runserver"

To run
1. cd to project
2. bin\ngrok.exe authtoken YOUR_AUTHTOKEN_HERE
3. ngrok.exe http 8000
or
1. bin\ngrok.exe http -config=ngrok.yml 8000
or
1. python manage.py shell
2. from django.conf import settings
settings.ALLOWED_HOSTS += ['LINK']