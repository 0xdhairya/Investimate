from django.db import models
from django.utils import timezone

# Create your models here.
class Case(models.Model):
    name= models.CharField(max_length=64)
    description = models.CharField(max_length=256)
    notes = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    files = models.JSONField()

    def __str__(self):
        return self.name