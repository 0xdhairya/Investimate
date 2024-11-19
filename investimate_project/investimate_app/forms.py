from django import forms
from django.contrib.auth.models import User
from .models import Case

class UserRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    password_confirm = forms.CharField(widget=forms.PasswordInput, label='Confirm Password')
    
    class Meta:
        model = User
        fields = ['username', 'password', 'password_confirm']
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError("Passwords do not match!")
        return cleaned_data
            
class MultiFileInput(forms.ClearableFileInput):
    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs['multiple'] = True  # Allow multiple files
        return super().render(name, value, attrs, renderer)
    
class CaseForm(forms.ModelForm):
    files = forms.FileField(widget=MultiFileInput(), required=False)

    class Meta:
        model = Case
        exclude = ['created_at', 'status']
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
                    'required': False,
                }
            )
        }
    
    def __init__(self, *args, **kwargs):
        super(CaseForm, self).__init__(*args, **kwargs)
        self.fields['notes'].required = False