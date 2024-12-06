from google.oauth2 import service_account
import vertexai
from vertexai.generative_models import GenerativeModel
import json

def ai_function(prompt):
    with open('key.json') as source:
        key_content = json.load (source)
    credentials = service_account.Credentials.from_service_account_info(key_content)
    vertexai.init(project="primordial-mile-345507", location="us-central1", credentials=credentials)
    
    generation_config = {
      "temperature": 1,
      "top_p": 0.95,
      "top_k": 40,
      "max_output_tokens": 8192,
      "response_mime_type": "application/json"
    }
    model = GenerativeModel("gemini-1.5-flash-002")
    response = model.generate_content(prompt, generation_config=generation_config)
    print('AI response:',response)
    return response.text