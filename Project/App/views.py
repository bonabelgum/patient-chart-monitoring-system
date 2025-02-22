import os

from django.shortcuts import render

# Create your views here.

def test_env(): #just testing env
    secret_test = os.getenv("SECRET_TEST", "Not Found")
    print("Environment Variable:", secret_test)
test_env()

def index(request):
    template = "main/index.html"
    return render(request, template)
def signup(request):
    template = "main/signup.html"
    return render(request, template)
def admin(request):
    template = "main/admin.html"
    return render(request, template)
def on_duty(request):
    template = "main/on_duty.html"
    return render(request, template)