from django.shortcuts import render, redirect
from .forms import CaseForm
from .models import Case

# Create your views here.

# Home Page
def home_view(req):
    return render(req, 'investimate_app/home.html')

# Add Case Page
def add_case_view(req):
    form = CaseForm()
    if req.method == 'POST':
        form = CaseForm(req.POST)
        if form.is_valid():
            # id = form.save().id
            return redirect('home')
    return render(req, 'investimate_app/new-case-form.html', {'form':form})

# Cases List Page
def cases_view(req):
    cases = Case.objects.all()
    return render(req, 'investimate_app/cases.html', {'cases':cases})

# Case Page
def case_view(req, case_id):
    case = Case.objects.get(id=case_id)
    return render(req, 'investimate_app/cases.html', {'case':case})