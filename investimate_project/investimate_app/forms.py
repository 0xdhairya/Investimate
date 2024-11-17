from django import forms
from .models import Case

class MultiFileInput(forms.ClearableFileInput):
    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs['multiple'] = True  # Allow multiple files
        return super().render(name, value, attrs, renderer)
    
class CaseForm(forms.ModelForm):
    files = forms.FileField(widget=MultiFileInput(), required=False)

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
                    'required': False,
                }
            )
        }
    
    def __init__(self, *args, **kwargs):
        super(CaseForm, self).__init__(*args, **kwargs)
        self.fields['notes'].required = False