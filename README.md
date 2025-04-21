# Patient Chart Monitoring System
---

## 📦 Instructions to Download Dependencies:

1. After cloning, set up a virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate it:
   - **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Inside the venv, navigate to the first project folder.
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Navigate again to the project directory and create your own `.env` file.
6. Go back to the main project directory and run:
   ```bash
   python manage.py runserver
   ```

---

## 🚀 Alternative Ways to Run (if QR isn't working):

1. `cd` to the project folder  
2. Create a `bin` folder:
   ```bash
   mkdir bin
   ```
3. Put `ngrok.exe` inside the `bin` folder  
4. Run:
   ```bash
   bin\ngrok.exe authtoken YOUR_AUTHTOKEN_HERE
   ```
5. Then:
   ```bash
   .\bin\ngrok.exe http 8000
   ```
   or:
   ```bash
   ngrok.exe http 8000
   ```
---

## 📄 If You Have a `yml` File

1. In the project root, create a `ngrok.yml` file:
   ```yaml
   agent:
     authtoken: YOUR_AUTHTOKEN_HERE
   ```
2. Run:
   ```bash
   bin\ngrok.exe http -config=ngrok.yml 8000
   ```
---

## 🛠️ Django Shell Quick Add
If you want to allow external ngrok links temporarily:
1. 
```bash
python manage.py shell
```
Then:
2. 
```python
from django.conf import settings
settings.ALLOWED_HOSTS += ['LINK']
```

---