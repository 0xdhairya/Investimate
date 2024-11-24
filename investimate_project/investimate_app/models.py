from django.db import models
from django.utils import timezone

class Case(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'Active'
        CLOSED = 'Closed'

    name= models.CharField(max_length=64)
    description = models.CharField(max_length=256)
    notes = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    files = models.JSONField()
    insights = models.JSONField(default=list)

    def __str__(self):
        return self.name