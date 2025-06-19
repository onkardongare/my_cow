import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import i18n from '../../data/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async action: Initialize language from storage
export const initializeLanguage = createAsyncThunk(
  'language/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const savedLang = await AsyncStorage.getItem('selectedLanguage');
      const lang = savedLang || 'en';
      await i18n.changeLanguage(lang);
      return lang;
    } catch (error) {
      console.error('Error initializing language:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Change language and save to storage
export const changeLanguage = createAsyncThunk(
  'language/changeLanguage',
  async (lang, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', lang);
      await i18n.changeLanguage(lang);
      return lang;
    } catch (error) {
      console.error('Error changing language:', error);
      return rejectWithValue(error.message);
    }
  }
);

const languageSlice = createSlice({
  name: 'language',
  initialState: { lang: 'en', loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      // Initialize language cases
      .addCase(initializeLanguage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeLanguage.fulfilled, (state, action) => {
        state.loading = false;
        state.lang = action.payload;
        state.error = null;
      })
      .addCase(initializeLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Change language cases
      .addCase(changeLanguage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeLanguage.fulfilled, (state, action) => {
        state.loading = false;
        state.lang = action.payload;
        state.error = null;
      })
      .addCase(changeLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default languageSlice.reducer;
