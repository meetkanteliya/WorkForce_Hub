import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import chatReducer from './slices/chatSlice';
import employeeReducer from './slices/employeeSlice';
import departmentReducer from './slices/departmentSlice';
import leaveReducer from './slices/leaveSlice';
import payrollReducer from './slices/payrollSlice';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        theme: themeReducer,
        chat: chatReducer,
        employees: employeeReducer,
        departments: departmentReducer,
        leaves: leaveReducer,
        payroll: payrollReducer,
        dashboard: dashboardReducer,
    },
});

export default store;
