import json
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.core.serializers import serialize
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.utils.timezone import now
from django.contrib.auth.models import User
from .forms import CaseForm, UserRegistrationForm
from .models import Case
from django.shortcuts import render
from django.http import JsonResponse
import json
from .services import ai_function

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
    activeCases = Case.objects.filter(status=Case.Status.ACTIVE, user=req.user).count()
    closedCases = Case.objects.filter(status=Case.Status.CLOSED, user=req.user).count()
    return render(req, 'investimate_app/home.html', {'activeCases':activeCases, 'closedCases':closedCases})

# Home API
@login_required
def home_api_view(req):
    cases = list(
        Case.objects.filter(user=req.user).order_by('-created_at')[:3]
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
            case.user = req.user
            file_data = {}
            for file in files:
                try:
                    file_content = file.read().decode('utf-8')
                    if len(file_content) < 1:
                        form.add_error('files', f"Cannot accept empty file: {file.name}")
                    else:
                        # Escape single quotes by serializing to JSON and deserializing back
                        escaped_content = json.dumps(file_content)
                        file_data[file.name] = {'content': json.loads(escaped_content), 'annotations': {}}
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
        Case.objects.filter(user=req.user).order_by('-created_at')
    )
    cases_list = serialize('json', cases)
    return JsonResponse({'cases': cases_list})
 
# Case Page
@login_required
def case_view(req, case_id):
    case = Case.objects.get(id=case_id, user=req.user)
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
    
@login_required
def save_highlight_view(req, case_id):
    if req.method == "POST":
        try:
            case = get_object_or_404(Case, id=case_id)
            data = json.loads(req.body)
            updated_content = data.get("updatedContent")
            if updated_content:
                case.files = updated_content
                case.save()
                return JsonResponse({"message": "Annotation saved successfully."}, status=200)
            return JsonResponse({"error": "No content to update."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method."}, status=400)

@login_required
def update_notes_api_view(req, case_id):
    if req.method == "POST":
        try:
            case = get_object_or_404(Case, id=case_id)
            data = json.loads(req.body)
            print("Received data:", data)
            updated_content = data.get("updatedContent")
            if updated_content:
                case.notes = updated_content
                case.save()
                return JsonResponse({"message": "Notes successfully updated!"})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

@login_required
def summary_view(req):
    # Hardcoded case data
    context = {
        "case_id": 1,
        "case_name": "Hardcoded Sample Case",
        "case_description": "This is a description of the hardcoded case.",
        "insights": ["Insight 1: Example detail", "Insight 2: Another detail"],
        "detailed_summary": "This is a detailed summary of the hardcoded case.",
    }
    return render(req, "investimate_app/summary.html", context)

@login_required
def insight_view(req, case_id,insight_id):
    case = get_object_or_404(Case, id=case_id)
    insight = next((insight for insight in case.insights if insight["id"] == insight_id), None)
    if not insight:
        return render(req, "404.html", {"error_message": "Insight not found."}, status=404)
    context = {
        "case": {
            "id": case.pk,
            "name": case.name,
            "description": case.description,
        },
        "insight": {
            "id": insight_id,
            "category": insight['category'],
        }
    }
    return render(req, "investimate_app/insight.html", context )

# Insight Data API
@login_required
def insight_api_view(req, case_id, insight_id):
    case = get_object_or_404(Case, id=case_id)
    insight_index = next((index for index, insight in enumerate(case.insights) if insight["id"] == insight_id), None)
    if insight_index is None:
        return JsonResponse({"error": "Insight not found."}, status=404)
    return JsonResponse({'caseFiles': case.files, 'insight': case.insights[insight_index]})

@login_required
def remove_insight_view(req, case_id, id):
    if req.method == "POST":
        case = get_object_or_404(Case, id=case_id)
        insight_index = next((index for index, insight in enumerate(case.insights) if insight["id"] == id), None)
        if insight_index is None:
            return JsonResponse({"error": "Insight not found."}, status=404)
        del case.insights[insight_index]
        case.save()
        return redirect("case", case_id=case_id)
    
@login_required
def connection_api_view(req, case_id):
    if req.method == "POST":
        try:
            data = json.loads(req.body)
            print("Received data:", data)
            case = get_object_or_404(Case, id=case_id)
            file_content = {filename: details["content"] for filename, details in json.loads(case.files).items()}
            prompt =  """
                Assume you are a super intellegent, pattern recognisation, connection identifying agent.
                
                Case Files:
                {content}
                
                Highlighted Entities:
                {entities}
                
                Case Notes:
                {notes}
                
                Instructions:
                - Check if a connection exists between the "Highlighted Entities".
                - Derive the connection based on the "Case Files" and real world facts only.
                - It might be possible that not all files are relevant. So, figure out relevant files and derive from those files only, do not consider irrelevant files.
                - Also, take case notes into consideration with 10% weightage into decision making. These notes are user given so it may or may not be accurate.
                - Ensure the output is in JSON format with the following structure:
                    insight as the key and your generated insight as the value, and the files can be second key and the value can be json with file names as the key and an array of lines in the file used to derive the connection as the value
                """.format(
                    content=json.dumps(file_content),
                    entities=json.dumps(data),
                    notes=case.notes,
                )
            try:
                aiOutput = ai_function(prompt)
            except:
                return JsonResponse({"error": "AI connection error"}, status=400)
            new_insight = {
                "id": max([insight["id"] for insight in case.insights], default=0) + 1,
                "generated_at": now().isoformat(),
                "category": 'Connection',
                "input": {
                    "entities": data,
                },
                "output": json.loads(aiOutput)
            }
            case.insights.append(new_insight)
            case.save()
            return JsonResponse({"message": "Connection generated!", "insights":case.insights})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)
    
@login_required
def prediction_api_view(req, case_id):
    if req.method == "POST":
        try:
            data = json.loads(req.body)
            print("Received data:", data)
            case = get_object_or_404(Case, id=case_id)
            prediction_text = data.get('predictionText')
            prediction_files = data.get('predictionFiles')
            date = data.get('date')
            start_date = data.get('startDate')
            end_date = data.get('endDate')
            if date:
                event_text = f"{prediction_text}, on {date}"
            elif start_date and end_date:
                event_text = f"{prediction_text}, between {start_date} and {end_date}"
            else:
                event_text = prediction_text
            
            all_files = json.loads(case.files)
            file_content = {filename: details["content"] for filename, details in all_files.items() if filename in prediction_files}

            # MAKE API CALL to AI API and populate the output object in the new_insight object
            # replace the dummy 'output' object with the one generated bt AI
            prompt =  """
                Assume you are a super intellegent, pattern recognisation agent.
                
                Case Files:
                {content}
                
                Hypothesis Text:
                {event_text}
                
                Case Notes:
                {notes}
                
                Instructions:
                - Generate a hypothesis for "Hypothesis Text".
                - Generate the hypothesis based on the "Case Files" and real world facts only.
                - It might be possible that not all files are relevant. So, figure out relevant files and derive from those files only, do not consider irrelevant files.
                - Also, take case notes into consideration with 10% weightage into decision making. These notes are user given so it may or may not be accurate.
                - Ensure the output is in JSON format with the following structure:
                    insight as the key and your generated insight as the value, and the files can be second key and the value can be json with file names as the key and an array of lines in the file used to derive the hypothesis as the value
                """.format(
                    content=json.dumps(file_content),
                    event_text=event_text,
                    notes=case.notes,
                )
            try:
                aiOutput = ai_function(prompt)
            except Exception as e:
                print("AI error",e )
                return JsonResponse({"error": "AI connection error"}, status=400)
            
            new_insight = {
                "id": max([insight["id"] for insight in case.insights], default=0) + 1,
                "generated_at": now().isoformat(),
                "category": 'Hypothesis',
                "input": {
                    "text": event_text,
                    "files": prediction_files,
                },
                "output": json.loads(aiOutput)
            }
            case.insights.append(new_insight)
            case.save()
            return JsonResponse({"message": "Hypothesis generated!", "insights":case.insights})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)