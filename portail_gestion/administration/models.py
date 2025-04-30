from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Profile, Customer

class UserStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Actif')
    INACTIVE = 'INACTIVE', _('Inactif')
    BLOCKED = 'BLOCKED', _('Bloqué')
    SUSPENDED = 'SUSPENDED', _('Suspendu')

class UserLanguage(models.TextChoices):
    FR = 'FR', _('Français')
    EN = 'EN', _('Anglais')
    AR = 'AR', _('Arabe')


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé qui étend AbstractUser
    """
    id = models.AutoField(primary_key=True)
    code = models.CharField(_('Code'), max_length=255, unique=True, default='USER_001')
    first_name = models.CharField(_('Prénom'), max_length=255, blank=True)
    last_name = models.CharField(_('Nom'), max_length=255, blank=True)
    email = models.EmailField(_('Adresse email'), unique=True)
    phone = models.CharField(_('Numéro de téléphone'), max_length=20, blank=True)
    status = models.CharField(
        _('Statut'),
        max_length=10,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE
    )
    attempts = models.IntegerField(_('Nombre de tentatives'), default=0)
    password = models.CharField(_('Mot de passe'), max_length=128)
    language = models.CharField(
        _('Langue'),
        max_length=2,
        choices=UserLanguage.choices,
        default=UserLanguage.EN
    )
    start_validity = models.DateTimeField(_('Date de début de validité'), null=True, blank=True)
    end_validity = models.DateTimeField(_('Date de fin de validité'), null=True, blank=True)
    profile = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name=_('Profil')
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name=_('Client')
    )
    username = None
    

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('Utilisateur')
        verbose_name_plural = _('Utilisateurs')
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
