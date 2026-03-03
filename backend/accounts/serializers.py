from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()




class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()

    def validate_new_password(self, value):
        validate_password(value)
        return value

class AdminResetPasswordSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    new_password = serializers.CharField()

    def validate_new_password(self, value):
        validate_password(value)
        return value