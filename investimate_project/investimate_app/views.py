from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views import View
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
    recentCases = Case.objects.order_by('-created_at')[:3]
    activeCases = Case.objects.filter(status=Case.Status.ACTIVE).count()
    closedCases = Case.objects.filter(status=Case.Status.CLOSED).count()
    print('Recent Cases', recentCases)
    return render(req, 'investimate_app/home.html', {'recentCases': recentCases, 'activeCases':activeCases, 'closedCases':closedCases})

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
                file_content = file.read().decode('utf-8')
                if len(file_content) < 1:
                    form.add_error('files', f"Cannot accept empty file: {file.name}")
                else:
                    file_data[file.name] = file_content

            if not form.errors:
                case.files = file_data
                case.save()
                return redirect(reverse('case', args=[case.id]))

        print('Add new case form error:', form.errors)
    else:
        form = CaseForm()
    return render(req, 'investimate_app/new-case-form.html', {'form': form})

# Cases List Page
@login_required
def cases_view(req):
    cases = Case.objects.all()
    return render(req, 'investimate_app/cases.html', {'cases':cases})

# Case Page
@login_required
def case_view(req, case_id):
    case = Case.objects.get(id=case_id)
    return render(req, 'investimate_app/case.html', {'case':case})