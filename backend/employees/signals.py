from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Employee

User = get_user_model()


def _employee_payload(user):
    full_name = (user.get_full_name() or "").strip() or user.username
    try:
        profile_picture = user.employee.profile_picture.url if user.employee.profile_picture else None
    except Exception:
        profile_picture = None
    return {"user_id": user.id, "full_name": full_name, "profile_picture": profile_picture, "is_active": user.is_active}


def _broadcast(event, payload):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "company_chat",
        {"type": "employee_event", "event": event, "payload": payload},
    )


@receiver(pre_save, sender=Employee)
def employee_pre_save(sender, instance: Employee, **kwargs):
    if not instance.pk:
        instance._old_profile_picture = None
        return
    try:
        old = Employee.objects.select_related("user").get(pk=instance.pk)
        instance._old_profile_picture = getattr(old, "profile_picture", None)
    except Exception:
        instance._old_profile_picture = None


@receiver(post_save, sender=Employee)
def employee_post_save(sender, instance: Employee, created: bool, **kwargs):
    user = instance.user
    payload = _employee_payload(user)
    if created:
        _broadcast("joined", payload)
        return

    old_pic = getattr(instance, "_old_profile_picture", None)
    new_pic = instance.profile_picture
    if (old_pic != new_pic):
        _broadcast("updated", payload)


@receiver(pre_save, sender=User)
def user_pre_save(sender, instance: User, **kwargs):
    if not instance.pk:
        instance._old_is_active = None
        instance._old_first_name = ""
        instance._old_last_name = ""
        return
    try:
        old = User.objects.get(pk=instance.pk)
        instance._old_is_active = old.is_active
        instance._old_first_name = old.first_name
        instance._old_last_name = old.last_name
    except Exception:
        instance._old_is_active = None
        instance._old_first_name = ""
        instance._old_last_name = ""


@receiver(post_save, sender=User)
def user_post_save(sender, instance: User, created: bool, **kwargs):
    # Only broadcast for users that are employees (have Employee profile)
    if not hasattr(instance, "employee"):
        return

    old_is_active = getattr(instance, "_old_is_active", None)
    if old_is_active is not None and old_is_active != instance.is_active:
        _broadcast("left" if not instance.is_active else "joined", _employee_payload(instance))
        return

    if (
        getattr(instance, "_old_first_name", None) != instance.first_name
        or getattr(instance, "_old_last_name", None) != instance.last_name
    ):
        _broadcast("updated", _employee_payload(instance))

