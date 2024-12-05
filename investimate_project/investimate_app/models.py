from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

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

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cases"
    )

    def __str__(self):
        return self.name