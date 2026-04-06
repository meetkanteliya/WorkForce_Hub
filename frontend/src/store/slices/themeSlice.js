import { createSlice } from '@reduxjs/toolkit';

// ── Initial State ──
const initialState = {
    isDarkMode: localStorage.getItem('theme') === 'dark',
};

// ── Slice ──
const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme(state) {
            state.isDarkMode = !state.isDarkMode;

            // Side-effect: sync DOM + localStorage
            if (state.isDarkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        },
        setDarkMode(state, action) {
            state.isDarkMode = action.payload;

            if (state.isDarkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        },
    },
});

// ── Actions ──
export const { toggleTheme, setDarkMode } = themeSlice.actions;

// ── Selectors ──
export const selectIsDarkMode = (state) => state.theme.isDarkMode;

export default themeSlice.reducer;
