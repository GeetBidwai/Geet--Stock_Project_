from django.contrib.auth.models import AbstractUser

class Staff(AbstractUser):
    def __str__(self):
        return self.username
