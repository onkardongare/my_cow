import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabase } from '../../data/database';

// Async thunks
export const fetchHealthRecords = createAsyncThunk(
  'health/fetchHealthRecords',
  async (cowId) => {
    const db = await getDatabase();
    const records = await db.getAllAsync(
      `SELECT * FROM health WHERE cowId = ? ORDER BY startDate DESC`,
      [cowId]
    );
    return records;
  }
);

export const addHealthRecord = createAsyncThunk(
  'health/addHealthRecord',
  async (record) => {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO health (
        cowId, disease, symptoms, diagnosis, treatment, 
        startDate, endDate, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.cowId,
        record.disease,
        record.symptoms,
        record.diagnosis,
        record.treatment,
        record.startDate,
        record.endDate,
        record.status,
        record.notes
      ]
    );
    return { ...record, id: result.lastInsertRowId };
  }
);

export const updateHealthRecord = createAsyncThunk(
  'health/updateHealthRecord',
  async (record) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE health SET 
        disease = ?, symptoms = ?, diagnosis = ?, 
        treatment = ?, startDate = ?, endDate = ?, 
        status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        record.disease,
        record.symptoms,
        record.diagnosis,
        record.treatment,
        record.startDate,
        record.endDate,
        record.status,
        record.notes,
        record.id
      ]
    );
    return record;
  }
);

export const deleteHealthRecord = createAsyncThunk(
  'health/deleteHealthRecord',
  async (recordId) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM health WHERE id = ?', [recordId]);
    return recordId;
  }
);

const initialState = {
  records: [],
  loading: false,
  error: null
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearHealthRecords: (state) => {
      state.records = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch records
      .addCase(fetchHealthRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add record
      .addCase(addHealthRecord.fulfilled, (state, action) => {
        state.records.unshift(action.payload);
      })
      // Update record
      .addCase(updateHealthRecord.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      // Delete record
      .addCase(deleteHealthRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r.id !== action.payload);
      });
  }
});

export const { clearHealthRecords } = healthSlice.actions;
export default healthSlice.reducer; 