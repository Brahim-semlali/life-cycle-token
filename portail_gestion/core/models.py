from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.

class Profile(models.Model):
    """
    Modèle pour les profils utilisateurs
    """
    code = models.CharField(_('Code du profil'), max_length=100, unique=True)
    name = models.CharField(_('Nom du profil'), max_length=100)
    description = models.TextField(_('Description'), blank=True)
    is_active = models.BooleanField(_('Actif'), default=True)

    class Meta:
        verbose_name = _('Profil')
        verbose_name_plural = _('Profils')

    def __str__(self):
        return self.name

class Customer(models.Model):
    """
    Modèle pour les clients
    """
    code = models.CharField(_('Code du client'), max_length=100, unique=True)
    name = models.CharField(_('Nom du client'), max_length=100)
    is_active = models.BooleanField(_('Actif'), default=True)

    class Meta:
        verbose_name = _('Client')
        verbose_name_plural = _('Clients')

    def __str__(self):
        return self.name
