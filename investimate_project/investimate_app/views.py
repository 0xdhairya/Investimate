import json
from django.http import JsonResponse, HttpResponseBadRequest
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
import google.generativeai as genai
from django.http import JsonResponse



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
    print(case_id, id)
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
                
            # MAKE API CALL to AI API and populate the output object in the new_insight object
            # replace the dummy 'output' object with the one generated bt AI
            new_insight = {
                "id": max([insight["id"] for insight in case.insights], default=0) + 1,
                "generated_at": now().isoformat(),
                "category": 'Connection',
                "input": {
                    # need to put in entities from the payload
                },
                "output":{
                    "text": "akjsndfkjasfnjas",
                    "files" : {
                        "fbi25.txt": [
                            "FBI [From police in North Bergen, NJ]: In the early morning hours of April 26, 2003 a passerby reported a fire in a carpet shop that is managed by a Erica Hahn of North Bergen .",
                            "The fire seems to have been started the night before when someone tossed a cigarette butt into a waste basket in the basement of the shop.",
                            "While firemen were extinguishing the blaze, they discovered several cartons labeled: PRIVATE: DO NOT OPEN.",
                            "These cartons contained C-4 explosive."
                        ]
                    }
                }
            }
            case.insights.append(new_insight)
            case.save()
            return JsonResponse({"message": "Prediction made successfully!", "insights":case.insights})
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
            prediction_text = data.predictionText
            date = data.date
            start_date = data.startDate
            end_date = data.endDate
            if date:
                event_text = f"Event: {prediction_text}, on {date}"
            elif start_date and end_date:
                event_text = f"Event: {prediction_text}, between {start_date} and {end_date}"
            else:
                event_text = f"Event: {prediction_text}"
                
            # MAKE API CALL to AI API and populate the output object in the new_insight object
            # replace the dummy 'output' object with the one generated bt AI
            new_insight = {
                "id": max([insight["id"] for insight in case.insights], default=0) + 1,
                "generated_at": now().isoformat(),
                "category": 'Prediction',
                "input": {
                    "text": event_text,
                },
                "output":{
                    "text": "akjsndfkjasfnjas",
                    "files" : {
                        "fbi25.txt": [
                            "FBI [From police in North Bergen, NJ]: In the early morning hours of April 26, 2003 a passerby reported a fire in a carpet shop that is managed by a Erica Hahn of North Bergen .",
                            "The fire seems to have been started the night before when someone tossed a cigarette butt into a waste basket in the basement of the shop.",
                            "While firemen were extinguishing the blaze, they discovered several cartons labeled: PRIVATE: DO NOT OPEN.",
                            "These cartons contained C-4 explosive."
                        ]
                    }
                }
            }
            case.insights.append(new_insight)
            case.save()
            return JsonResponse({"message": "Prediction made successfully!", "insights":case.insights})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)

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
def connection_ai(req,all_details,entities):
    with open('key.json') as source:
        key_content = json.load (source)
    credentials = service_account.Credentials.from_service_account_info(key_content)
    vertexai.init(project="primordial-mile-345507", location="us-central1", credentials=credentials)

    # Create the model
    generation_config = {
      "temperature": 1,
      "top_p": 0.95,
      "top_k": 40,
      "max_output_tokens": 8192,
      "response_mime_type": "application/json"
    }
    model = GenerativeModel("gemini-1.5-flash-002")
    # all_details = {"cia33.txt":{"content":"Report Date 12 April, 2003. CIA From French Intelligence: Acting on a tip from an unnamed source, French police arrested an Egyptian named Muhammad Shamzai at his home at 16 Rue St. Sebastien in Paris on 8 April, 2002. In his home police found 200 US and 180 British blank passports. In addition, on the hard drive of Shamzai's laptop computer was a record of a US and British passports that Shamzai had apparently forged. One of these passports was made out in the name Masood Yaser, whose address was listed as 1660 Coal Mine Road, Apartment 206, Denver, Colorado, USA. Another US passport forged was in the name Vincent Lozario, 2229 Marshall Avenue, Minneapolis, Minnesota, USA. A third forged US passport was in the name Khalfan Maulid, 656 Laurel Avenue, Bowling Green, Kentucky, USA.","annotations":{}},"fbi10.txt":{"content":"FBI: A routine check of security at the New York Stock Exchange [NYSE] reveals some anomalies in background checks of several persons who now hold vendor's IDs that allow them access to the NYSE provided that they are accompanied by security guards. (i) A man named Derek Shepherd, employed by the City Computer Services Corp. failed, in his application for a NYSE vendor's ID, to report his arrest and conviction [12 December, 2001 on a charge of assault and battery. He served six months in jail and is now out on probation. (ii) Stephanie Edwards, employed by the Clark & Co. Office Supplies Co., gave her current home address on her application for a vendor's ID as: 1631 Webster Ave.. The Bronx. NYC. There is no one by the name Stephanie Edwards at this residence. (iii) A man named Mark Sloan, reported age 32 years, obtained a social security card and a New York State driver's license in 1999 using a birth certificate now believed to have been forged. He is employed by Empire State Vending Services in Manhattan and he services vending machines such as coffee, soft drink, and candy machines. He lists his home address as: 2462 Myrtle Ave. Apt. 307, Queens, NYC.","annotations":{"miscellaneous":["ie Edwards, employed by the Clark & Co. Office Supplies Co., gave her current home address on her application for a vend"],"contact-number":[]}},"fbi25.txt":{"content":"FBI [From police in North Bergen, NJ]: In the early morning hours of April 26, 2003 a passerby reported a fire in a carpet shop that is managed by a Erica Hahn of North Bergen . The fire seems to have been started the night before when someone tossed a cigarette butt into a waste basket in the basement of the shop. While firemen were extinguishing the blaze, they discovered several cartons labeled: PRIVATE: DO NOT OPEN. These cartons contained C-4 explosive. Attempts to reach Erica Hahn have not been successful. An employee at the carpet shop later told police that Erica Hahn had just gone on a vacation in Canada and that she had left no address.","annotations":{"location":["North Bergen, NJ"],"date":["April 26, 2003"]}}}
    # entities = {
    #   "entity-1": {
    #     "file": "fbi25.txt",
    #     "h_text": "North Bergen, NJ",
    #     "category": "location"
    #   },
    #   "entity-2": {
    #     "file": "fbi25.txt",
    #     "h_text": "April 26, 2003",
    #     "category": "date"
    #   }
    # }

    response = model.generate_content( """
        Imagine you're Sherlock Holmes. Solve the following case. Here's the data in JSON format:
        
        Case Details:
        {content}
        
        Highlighted Entities:
        {entities}
        
        Instructions:
        - Analyze the relationship between `entity-1` and `entity-2`.
        - Provide insights based on the annotations and file content.
        - Ensure the output is in JSON format with the following structure:
          insight as the key and your generated insight as the value, and the files can be second key and the value can be json with file names as the key and an array of  lines in the file used for the insight as the value
        """.format(
            content=json.dumps(all_details),
            entities=json.dumps(entities)
        ), generation_config=generation_config)

    return response.text
