import json
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.core.serializers import serialize
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .forms import CaseForm, UserRegistrationForm
from .models import Case

def signup_view(req):
    if req.method == 'POST':
        form = UserRegistrationForm(req.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = User.objects.create_user(username=username, password=password)
            login(req, user)
            return redirect('home')
    else:
        form = UserRegistrationForm()
    return render(req, 'accounts/signup.html', {'form':form})
        
def login_view(req):
    error_message = None
    if req.method == 'POST':
        username = req.POST.get('username')
        password = req.POST.get('password')
        user = authenticate(req, username=username, password=password)
        if user is not None:
            login(req, user)
            nextUrl = req.POST.get('next') or req.POST.get('next') or 'home'
            return redirect(nextUrl)
        else:
            error_message = 'Invalid Credentials!'
    return render(req, 'accounts/login.html', {'error': error_message})
    
def logout_view(req):
    if req.method == 'POST':
        logout(req)
        return redirect('login')
    else:
        return redirect('home')

# Home Page
@login_required
def home_view(req):
    activeCases = Case.objects.filter(status=Case.Status.ACTIVE).count()
    closedCases = Case.objects.filter(status=Case.Status.CLOSED).count()
    return render(req, 'investimate_app/home.html', {'activeCases':activeCases, 'closedCases':closedCases})

# Home API
@login_required
def home_api_view(req):
    cases = list(
        Case.objects.all()
        .order_by('-created_at')[:3]
    )
    cases_list = serialize('json', cases)
    return JsonResponse({'recentCases': cases_list})


# Add Case Page
@login_required
def add_case_view(req):
    if req.method == 'POST':
        form = CaseForm(req.POST, req.FILES)
        form.errors.pop('files', None)
        files = req.FILES.getlist('files')
        
        if not files:
                form.add_error('files', "No files submitted.")
                
        invalid_files = [file.name for file in files if not file.name.endswith('.txt')]
        if invalid_files:
            for file in invalid_files:
                form.add_error('files', f'Invalid file type for file: {file}. Only .txt files are allowed.')
                
        if form.is_valid():
            case = form.save(commit=False)
            file_data = {}
            for file in files:
                try:
                    file_content = file.read().decode('utf-8')
                    if len(file_content) < 1:
                        form.add_error('files', f"Cannot accept empty file: {file.name}")
                    else:
                        # Escape single quotes by serializing to JSON and deserializing back
                        escaped_content = json.dumps(file_content)
                        file_data[file.name] = {'content': json.loads(escaped_content), 'annotations': {'date': []}}
                except UnicodeDecodeError:
                    form.add_error('files', f"Unable to decode file: {file.name}. Ensure it is UTF-8 encoded.")
            
            if not form.errors:
                case.files = json.dumps(file_data)  # Store as a JSON string
                case.save()
                return redirect(reverse('case', args=[case.id]))

        print('Add new case form error:', form.errors)
    else:
        form = CaseForm()
    return render(req, 'investimate_app/new-case-form.html', {'form': form})

# Cases List Page
@login_required
def cases_view(req):
    return render(req, 'investimate_app/cases.html')

# Cases List API
@login_required
def cases_api_view(req):
    cases = list(
        Case.objects.all()
        .order_by('-created_at')
    )
    cases_list = serialize('json', cases)
    return JsonResponse({'cases': cases_list})
 
# Case Page
@login_required
def case_view(req, case_id):
    case = Case.objects.get(id=case_id)
    return render(req, 'investimate_app/case.html', {'case':case})

# Case Data API
@login_required
def case_api_view(req, case_id):
    case = get_object_or_404(Case, id=case_id)
    case_data = serialize('json', [case])
    return JsonResponse({'case': case_data})

# Delete Case
@login_required
def delete_case_view(req, case_id):
    if req.method == 'POST':
        case = get_object_or_404(Case, id=case_id)
        case.delete()
        return redirect('home')
    
# Close Case
@login_required
def close_case_view(req, case_id):
    if req.method == 'POST':
        case = get_object_or_404(Case, id=case_id)
        if case.status != Case.Status.CLOSED:
            case.status = Case.Status.CLOSED
            case.save()
        return redirect('case', case_id=case.id)
    
@csrf_exempt
def save_highlight_view(req, case_id):
    if req.method == "POST":
        try:
            case = get_object_or_404(Case, id=case_id)
            data = json.loads(req.body)
            updated_content = data.get("updatedContent")
            if updated_content:
                # Save the updated content persistently
                case.files = updated_content  # Assuming "files" is a JSONField
                case.save()
                return JsonResponse({"message": "Highlight saved successfully."}, status=200)
            return JsonResponse({"error": "No content to update."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method."}, status=400)