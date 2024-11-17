from django.shortcuts import render, redirect
from django.urls import reverse
from .forms import CaseForm
from .models import Case

# Home Page
def home_view(req):
    return render(req, 'investimate_app/home.html')

# Add Case Page
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
def cases_view(req):
    cases = Case.objects.all()
    return render(req, 'investimate_app/cases.html', {'cases':cases})

# Case Page
def case_view(req, case_id):
    case = Case.objects.get(id=case_id)
    return render(req, 'investimate_app/cases.html', {'case':case})