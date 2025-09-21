import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabase } from '../../data/database';

// Helper function to safely parse JSON
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return [];
  }
};

// Async action: Add milk record
export const addMilkRecord = createAsyncThunk(
  'milk/addRecord',
  async (milkData, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Validate required fields
      if (!milkData.date || !milkData.cowIds || milkData.cowIds.length === 0) {
        throw new Error('Missing required fields');
      }

      // Ensure cowIds is an array
      const cowIds = Array.isArray(milkData.cowIds) ? milkData.cowIds : [milkData.cowIds];

      // Insert milk record into database
      const result = await db.runAsync(
        `INSERT INTO milk (
          date, cowIds, amTotal, pmTotal,
          totalProduced, milkRateAm, milkRatePm, totalIncome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          milkData.date,
          JSON.stringify(cowIds),
          milkData.amTotal,
          milkData.pmTotal,
          milkData.totalProduced,
          milkData.milkRateAm,
          milkData.milkRatePm,
          milkData.totalIncome
        ]
      );

      // Fetch the newly inserted record
      const [newRecord] = await db.getAllAsync(
        'SELECT * FROM milk WHERE id = ?',
        [result.lastInsertRowId]
      );

      return newRecord;
    } catch (error) {
      console.error('Error adding milk record:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Fetch milk records
export const fetchMilkRecords = createAsyncThunk(
  'milk/fetchRecords',
  async (dateRange, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      let query = 'SELECT * FROM milk';
      const params = [];

      if (dateRange) {
        const { startDate, endDate } = dateRange;
        query += ' WHERE datetime(date) BETWEEN datetime(?) AND datetime(?)';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY datetime(date) DESC';
      console.log('Executing query:', query, 'with params:', params); // Add logging
      const rows = await db.getAllAsync(query, params);

      // Parse cowIds from JSON string for each record
      return rows.map(record => ({
        ...record,
        cowIds: safeJsonParse(record.cowIds)
      }));
    } catch (error) {
      console.error('Error fetching milk records:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Update milk record
export const updateMilkRecord = createAsyncThunk(
  'milk/updateRecord',
  async ({ id, milkData }, { rejectWithValue }) => {
    try {
      const db = await getDatabase();

      // Update milk record in database
      await db.runAsync(
        `UPDATE milk SET 
          date = ?,
          cowIds = ?,
          amTotal = ?,
          pmTotal = ?,
          totalProduced = ?,
          milkRateAm = ?,
          milkRatePm = ?,
          totalIncome = ?,
          updatedAt = datetime('now')
        WHERE id = ?`,
        [
          milkData.date,
          JSON.stringify(milkData.cowIds),
          milkData.amTotal,
          milkData.pmTotal,
          milkData.totalProduced,
          milkData.milkRateAm,
          milkData.milkRatePm,
          milkData.totalIncome,
          id
        ]
      );

      // Fetch the updated record
      const [updatedRecord] = await db.getAllAsync(
        'SELECT * FROM milk WHERE id = ?',
        [id]
      );

      return updatedRecord;
    } catch (error) {
      console.error('Error updating milk record:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Delete milk record
export const deleteMilkRecord = createAsyncThunk(
  'milk/deleteRecord',
  async (id, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      await db.runAsync('DELETE FROM milk WHERE id = ?', [id]);
      
      return id;
    } catch (error) {
      console.error('Error deleting milk record:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Add this new thunk for fetching milk records by cow ID
export const fetchMilkRecordsByCowId = createAsyncThunk(
  'milk/fetchRecordsByCowId',
  async (cowId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Fetch all milk records
      const records = await db.getAllAsync(
        'SELECT * FROM milk ORDER BY date DESC'
      );

      if (!records) {
        return rejectWithValue('No milk records found');
      }

      // Filter records to only include those specific to this cow
      const filteredRecords = records.filter(record => {
        const cowIds = safeJsonParse(record.cowIds);
        return cowIds.includes(cowId.toString());
      });

      // Parse cowIds for each record
      return filteredRecords.map(record => ({
        ...record,
        cowIds: safeJsonParse(record.cowIds)
      }));
    } catch (error) {
      console.error('Error fetching milk records:', error);
      return rejectWithValue(error.message || 'Failed to fetch milk records');
    }
  }
);

const milkSlice = createSlice({
  name: 'milk',
  initialState: {
    records: [],
    cowRecords: [], // Add this new state for individual cow records
    loading: false,
    error: null,
    selectedRange: 'last7Days'
  },
  reducers: {
    setDateRange: (state, action) => {
      state.selectedRange = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMilkRecords.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilkRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchMilkRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addMilkRecord.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMilkRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift({
          ...action.payload,
          cowIds: safeJsonParse(action.payload.cowIds)
        });
      })
      .addCase(addMilkRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMilkRecord.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMilkRecord.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex(record => record.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = {
            ...action.payload,
            cowIds: safeJsonParse(action.payload.cowIds)
          };
        }
      })
      .addCase(updateMilkRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMilkRecord.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMilkRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.records = state.records.filter(record => record.id !== action.payload);
      })
      .addCase(deleteMilkRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMilkRecordsByCowId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilkRecordsByCowId.fulfilled, (state, action) => {
        state.loading = false;
        state.cowRecords = action.payload;
      })
      .addCase(fetchMilkRecordsByCowId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setDateRange } = milkSlice.actions;
export default milkSlice.reducer;