from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    ProfileSerializer,
    ChangePasswordSerializer,
    AdminResetPasswordSerializer,
)

User = get_user_model()


class ProfileView(RetrieveAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Wrong password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password changed successfully'})


from .permissions import IsAdminOrHR

class AdminResetPasswordView(GenericAPIView):
    serializer_class = AdminResetPasswordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(id=user_id)
            # Ensure managers can't reset admin passwords (handled strictly below but simple check here)
            if request.user.role == 'hr' and user.role == 'admin':
                return Response({'detail': 'HR cannot reset admin password.'}, status=status.HTTP_403_FORBIDDEN)
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password reset successfully for user.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)