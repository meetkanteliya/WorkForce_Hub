from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee, Department

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role")


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.CharField(write_only=True, required=False)
    department_name = serializers.CharField(source="department.name", read_only=True, default="Unassigned")

    class Meta:
        model = Employee
        fields = (
            "id",
            "user",
            "user_id",
            "email",
            "username",
            "password",
            "role",
            "employee_code",
            "department",
            "department_name",
            "phone",
            "designation",
            "date_of_joining",
            "address",
            "city",
            "emergency_contact_name",
            "emergency_contact_phone",
            "profile_picture",
        )

    def create(self, validated_data):
        user_id = validated_data.pop("user_id", None)
        email = validated_data.pop("email", None)
        username = validated_data.pop("username", None)
        password = validated_data.pop("password", None)
        role = validated_data.pop("role", "employee")

        if user_id:
            user = User.objects.get(id=user_id)
            if email:
                user.email = email
                user.save()
        else:
            if not username or not password or not email:
                raise serializers.ValidationError("Username, password, and email are required to create a new user.")
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role
            )
            
        return Employee.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)

        if email:
            instance.user.email = email
            instance.user.save()

        return super().update(instance, validated_data)

class EmployeeProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)
    department_id = serializers.IntegerField(required=False, write_only=True)
    
    class Meta:
        model = Employee
        fields = (
            "email",
            "phone",
            "address",
            "city",
            "emergency_contact_name",
            "emergency_contact_phone",
            "employee_code",
            "designation",
            "date_of_joining",
            "department_id",
            "profile_picture",
        )
        
    def update(self, instance, validated_data):
        user = self.context['request'].user
        role = user.role
        
        # Employees can only update personal info
        if role == 'employee':
            allowed_fields = [
                'phone', 'address', 'city', 
                'emergency_contact_name', 'emergency_contact_phone', 'email',
                'profile_picture'
            ]
            for key in list(validated_data.keys()):
                if key not in allowed_fields:
                    validated_data.pop(key)

        email = validated_data.pop("email", None)
        if email:
            instance.user.email = email
            instance.user.save()
            
        department_id = validated_data.pop("department_id", None)
        if department_id and role != 'employee':
            instance.department_id = department_id

        return super().update(instance, validated_data)