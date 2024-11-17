from django import forms
from .models import Case

class CaseForm(forms.ModelForm):
    class Meta:
        model = Case
        exclude = ['created_at']
        fields = '__all__'
        labels = {
            'name' : 'Name',
            'description' : 'Description',
            'notes' : 'Notes',
            'files': 'Files'
        }
        widgets = {
            'name': forms.TextInput(
                attrs={
                    'placeholder': 'Case Name',
                    'class': 'form-control',
                }
            ),
            'description': forms.TextInput(
                attrs={
                    'placeholder': 'Case Description',
                    'class': 'form-control',
                }
            ),
            'notes': forms.Textarea(
                attrs={
                    'placeholder': 'Case Notes',
                    'class': 'form-control',
                }
            ),
            'files': forms.FileInput(
                attrs={
                    'class': 'form-control',
                }
            ),
        }