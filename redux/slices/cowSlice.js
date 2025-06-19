import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabase } from '../../data/database';
import { deleteAllCowEvents } from './eventSlice';

// Async action: Insert cow into SQLite
export const addCow = createAsyncThunk(
  'cows/addCow',
  async (cowData, { rejectWithValue, dispatch }) => {
    try {
      const start = Date.now();
      const db = await getDatabase();
      const end = Date.now();
      console.log("database init time",end - start)
      
      // Validate required fields
      if (!cowData.earTagNumber || !cowData.gender || !cowData.cattleObtained) {
        throw new Error('Missing required fields');
      }

      // Check for duplicate ear tag number
      const existingCow = await db.getAllAsync(
        'SELECT * FROM cattle WHERE earTagNumber = ?',
        [cowData.earTagNumber]
      );

      if (existingCow && existingCow.length > 0) {
        throw new Error('Ear tag number already exists');
      }

      // Insert cow into database
      const result = await db.runAsync(
        `INSERT INTO cattle (
          earTagNumber, name, gender, cattleObtained, cattleBreed,
          cattleStage, cattleStatus, weight, dateOfBirth,
          dateOfEntry, motherTagNo, purchasePrice, isSick,
          inseminationDate, lastDeliveryDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cowData.earTagNumber,
          cowData.name || '',
          cowData.gender,
          cowData.cattleObtained,
          cowData.cattleBreed || '',
          cowData.cattleStage || '',
          cowData.cattleStatus || '',
          cowData.weight || '',
          cowData.dateOfBirth || '',
          cowData.dateOfEntry || '',
          cowData.motherTagNo || '',
          cowData.purchasePrice || null,
          cowData.isSick ? 1 : 0,
          cowData.inseminationDate || null,
          cowData.lastDeliveryDate || null
        ]
      );

      // If cow was purchased, create a transaction
      if (cowData.cattleObtained === 'purchase' && cowData.purchasePrice) {
        await db.runAsync(
          `INSERT INTO transactions (
            type, amount, category, date, description
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            'expense',
            cowData.purchasePrice,
            'cattle_purchase',
            new Date().toISOString(),
            `Purchase of cow with ear tag ${cowData.earTagNumber}`
          ]
        );
      }

      // Fetch the newly inserted cow
      const [newCow] = await db.getAllAsync(
        'SELECT * FROM cattle WHERE id = ?',
        [result.lastInsertRowId]
      );

      return newCow;
    } catch (error) {
      console.error('Error adding cow:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Fetch cows from SQLite
export const fetchCows = createAsyncThunk(
  'cows/fetchCows',
  async (_ , { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      let query = 'SELECT * FROM cattle';
      const params = [];

      query += ' ORDER BY createdAt DESC';
      const rows = await db.getAllAsync(query, params);
      // console.log(rows)
      return rows;
    } catch (error) {
      console.error('Error fetching cows:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Update cow status
export const updateCowStatus = createAsyncThunk(
  'cows/updateStatus',
  async ({ cowId, status, saleAmount, isSick }, { rejectWithValue, dispatch }) => {
    try {
      const db = await getDatabase();
      
      // First verify the cow exists
      const [existingCow] = await db.getAllAsync(
        'SELECT * FROM cattle WHERE id = ?',
        [cowId]
      );

      if (!existingCow) {
        throw new Error('Cow not found');
      }

      // Update cow status and isPresent
      await db.runAsync(
        `UPDATE cattle 
         SET isPresent = CASE 
           WHEN ? IS NOT NULL THEN ? 
           ELSE isPresent 
         END,
         status = CASE 
           WHEN ? IS NOT NULL THEN ? 
           ELSE status 
         END,
         saleAmount = ?,
         isSick = CASE 
           WHEN ? IS NOT NULL THEN ? 
           ELSE isSick 
         END,
         updatedAt = datetime('now')
         WHERE id = ?`,
        [
          status, status === 'alive' ? 1 : 0,
          status, status,
          saleAmount || null,
          isSick, isSick ? 1 : 0,
          cowId
        ]
      );

      // Update Transaction also
      if(saleAmount > 0){
        await db.runAsync(
          `INSERT INTO transactions(
            type, 
            amount, 
            description, 
            date, 
            category, 
            createdAt, 
            updatedAt
          ) VALUES(?, ?, ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
          [
            'income',
            saleAmount,
            `Cow sale - ${existingCow.earTagNumber}`,
            'cattleSales'
          ]
        );
      }

      // Delete all events for this cow if it's being sold or died
      if (status === 'sold' || status === 'died') {
        await dispatch(deleteAllCowEvents(cowId)).unwrap();
      }

      // Fetch updated cow data
      const [updatedCow] = await db.getAllAsync(
        'SELECT * FROM cattle WHERE id = ?',
        [cowId]
      );
      console.log("updated cow", updatedCow)
      if (!updatedCow) {
        throw new Error('Failed to fetch updated cow data');
      }

      return updatedCow;
    } catch (error) {
      console.error('Error updating cow status:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Add this new thunk for updating cow details
export const updateCow = createAsyncThunk(
  'cows/updateCow',
  async ({ cowId, cowData }, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // First verify the cow exists and log the query
      console.log('Checking for cow with ID:', cowId);
      const existingCows = await db.getAllAsync(
        'SELECT * FROM cattle WHERE id = ?',
        [cowId]
      );
      console.log('Found cows:', existingCows);

      if (!existingCows || existingCows.length === 0) {
        console.error('No cow found with ID:', cowId);
        return rejectWithValue(`No cow found with ID: ${cowId}`);
      }

      const existingCow = existingCows[0];
      console.log('Existing cow data:', existingCow);

      // Prepare the update query dynamically based on provided fields
      const updateFields = [];
      const params = [];

      // Add fields to update if they are provided in cowData
      if (cowData.name !== undefined) {
        updateFields.push('name = ?');
        params.push(cowData.name);
      }
      if (cowData.earTagNumber !== undefined) {
        updateFields.push('earTagNumber = ?');
        params.push(cowData.earTagNumber);
      }
      if (cowData.gender !== undefined) {
        updateFields.push('gender = ?');
        params.push(cowData.gender);
      }
      if (cowData.cattleBreed !== undefined) {
        updateFields.push('cattleBreed = ?');
        params.push(cowData.cattleBreed);
      }
      if (cowData.cattleStage !== undefined) {
        updateFields.push('cattleStage = ?');
        params.push(cowData.cattleStage);
      }
      if (cowData.cattleStatus !== undefined) {
        updateFields.push('cattleStatus = ?');
        params.push(cowData.cattleStatus);
      }
      if (cowData.weight !== undefined) {
        updateFields.push('weight = ?');
        params.push(cowData.weight);
      }
      if (cowData.dateOfBirth !== undefined) {
        updateFields.push('dateOfBirth = ?');
        params.push(cowData.dateOfBirth);
      }
      if (cowData.dateOfEntry !== undefined) {
        updateFields.push('dateOfEntry = ?');
        params.push(cowData.dateOfEntry);
      }
      if (cowData.motherTagNo !== undefined) {
        updateFields.push('motherTagNo = ?');
        params.push(cowData.motherTagNo);
      }
      if (cowData.purchasePrice !== undefined) {
        updateFields.push('purchasePrice = ?');
        params.push(cowData.purchasePrice);
      }
      if (cowData.inseminationDate !== undefined) {
        updateFields.push('inseminationDate = ?');
        params.push(cowData.inseminationDate);
      }
      if (cowData.lastDeliveryDate !== undefined) {
        updateFields.push('lastDeliveryDate = ?');
        params.push(cowData.lastDeliveryDate);
      }

      // If no fields to update, return the existing cow
      if (updateFields.length === 0) {
        console.log('No fields to update, returning existing cow');
        return existingCow;
      }

      // Always update the updatedAt timestamp
      updateFields.push('updatedAt = datetime("now")');

      // Add the cowId to params
      params.push(cowId);

      // Log the update query and params
      const updateQuery = `UPDATE cattle SET ${updateFields.join(', ')} WHERE id = ?`;
      console.log('Update query:', updateQuery);
      console.log('Update params:', params);


      // Execute the update query
      await db.runAsync(updateQuery, params);

      if (cowData.cattleObtained === 'purchase' && cowData.purchasePrice) {
        await db.runAsync(
          `INSERT INTO transactions (
            type, amount, category, date, description
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            'expense',
            cowData.purchasePrice,
            'cattle_purchase',
            new Date().toISOString(),
            `Purchase of cow with ear tag ${cowData.earTagNumber}`
          ]
        );
      }

      // Fetch and return the updated cow data
      const [updatedCow] = await db.getAllAsync(
        'SELECT * FROM cattle WHERE id = ?',
        [cowId]
      );

      if (!updatedCow) {
        console.error('Failed to fetch updated cow data for ID:', cowId);
        return rejectWithValue('Failed to fetch updated cow data');
      }

      console.log('Successfully updated cow:', updatedCow);
      return updatedCow;
    } catch (error) {
      console.error('Error updating cow:', error);
      return rejectWithValue(error.message || 'Failed to update cow');
    }
  }
);

// Helper function to safely parse JSON
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return [];
  }
};


// Only store present cows in cows array

const presentCows = (cows) => {
  return cows.filter(cow => cow.isPresent === 1)
}

// Store deleted cows in deletedCow array
const deletedCows = (cows) =>{
  return cows.filter(cow => cow.isPresent != 1)
}

// Calculate statistics from cows data
const calculateStats = (cows) => {
  const stats = {
    total: cows.length,
    cows: cows.filter(cow => cow.cattleStage === 'cow' && cow.isPresent === 1).length,
    heifers: cows.filter(cow => cow.cattleStage === 'heifer' && cow.isPresent === 1).length,
    calves: cows.filter(cow => cow.cattleStage === 'calf' && cow.isPresent === 1).length,
    bulls: cows.filter(cow => cow.gender === 'male' && cow.isPresent === 1).length,
    pregnant: cows.filter(cow => (cow.cattleStatus === 'pregnant'|| cow.cattleStatus === 'lactatingAndPregnant' || cow.cattleStatus === 'nonLactatingAndPregnant') && cow.isPresent === 1).length,
    lactating: cows.filter(cow => (cow.cattleStatus === 'lactating' || cow.cattleStatus === 'inseminatedAndLactating' || cow.cattleStatus === 'lactatingAndPregnant') && cow.isPresent === 1).length,
    inseminated: cows.filter(cow => (cow.cattleStatus === 'inseminated' || cow.cattleStatus === 'inseminatedAndLactating' || cow.cattleStatus === 'inseminatedAndNonLactating')  && cow.isPresent === 1).length,
    nonLactating: cows.filter(cow => (cow.cattleStatus === 'nonLactating' || cow.cattleStatus === 'nonLactatingAndPregnant'|| cow.cattleStatus === 'inseminatedAndNonLactating') && cow.isPresent === 1).length,
    sick: cows.filter(cow => cow.isSick === 1 && cow.isPresent === 1).length,
    open: cows.filter(cow => cow.cattleStatus === 'nonLactating' && cow.cattleStage !== 'calf' && cow.gender === 'female' && cow.isPresent === 1).length,
    died: cows.filter(cow => cow.status === 'died').length,
    sold: cows.filter(cow => cow.status === 'sold').length,
    disposed: cows.filter(cow => cow.status === 'died' || cow.status === 'sold').length,
    presentCows : cows.filter(cow => cow.isPresent === 1).length
  };
  return stats;
};



const cowSlice = createSlice({
  name: 'cows',
  initialState: { 
    cows: [], 
    deletedCows: [],
    stats: {
      total: 0,
      cows: 0,
      heifers: 0,
      calves: 0,
      bulls: 0,
      pregnant: 0,
      lactating: 0,
      nonLactating: 0,
      inseminated:0,
      sick: 0,
      open:0,
      disposed: 0,
      died:0,
      sold:0,
      presentCows: 0
    },
    loading: false, 
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addCow.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCow.fulfilled, (state, action) => {
        state.loading = false;
        state.cows.push(action.payload);
        state.stats = calculateStats(state.cows);
      })
      .addCase(addCow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCows.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCows.fulfilled, (state, action) => {
        state.loading = false;
        state.cows = presentCows(action.payload);
        state.deletedCows = deletedCows(action.payload);
        state.stats = calculateStats(action.payload);
      })
      .addCase(fetchCows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCowStatus.fulfilled, (state, action) => {
        const index = state.cows.findIndex(cow => cow.id === action.payload.id);
        if (index !== -1) {
          state.cows[index] = action.payload;
        }
      })
      .addCase(updateCow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCow.fulfilled, (state, action) => {
        state.loading = false;
        // Update the cow in the state
        const index = state.cows.findIndex(cow => cow.id === action.payload.id);
        if (index !== -1) {
          state.cows[index] = action.payload;
        }
      })
      .addCase(updateCow.rejected, (state, action) => {
        state.loading = false;
      });
  }
});

export default cowSlice.reducer;