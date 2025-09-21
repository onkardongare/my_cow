import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabase } from '../../data/database';

// Async action: Add transaction
export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Validate required fields
      if (!transactionData.type || !transactionData.amount || !transactionData.date) {
        throw new Error('Missing required fields');
      }

      // Insert transaction into database
      const result = await db.runAsync(
        `INSERT INTO transactions (
          type, amount, description, date, category, cowId
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          transactionData.type,
          transactionData.amount,
          transactionData.description || '',
          transactionData.date,
          transactionData.category || '',
          transactionData.cowId || null
        ]
      );

      // Fetch the newly inserted transaction
      const [newTransaction] = await db.getAllAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [result.lastInsertRowId]
      );

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Fetch transactions
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(
        'SELECT * FROM transactions ORDER BY date DESC'
      );
      return rows;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return rejectWithValue(error.message);
    }
  }
);
export const fetchTransactionsByCowId = createAsyncThunk(
  'transactions/fetchTransactionsByCowId',
  async (id, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(
        'SELECT * FROM transactions WHERE cowId = ? ORDER BY date DESC',
        [id]    
      );
      return rows;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Delete transaction
export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
      return transactionId;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Update transaction 
export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ transactionId, ...transactionData }, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Validate required fields
      if (!transactionData.type || !transactionData.amount || !transactionData.date) {
        throw new Error('Missing required fields');
      }

      // Update transaction in database
      await db.runAsync(
        `UPDATE transactions 
         SET type = ?, amount = ?, description = ?, date = ?, category = ?, cowId = ?
         WHERE id = ?`,
        [
          transactionData.type,
          transactionData.amount,
          transactionData.description || '',
          transactionData.date,
          transactionData.category || '',
          transactionData.cowId || null,
          transactionId
        ]
      );

      // Fetch the updated transaction
      const [updatedTransaction] = await db.getAllAsync(
        'SELECT * FROM transactions WHERE id = ?',
        [transactionId]
      );

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return rejectWithValue(error.message);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    transactionsByCowId: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addTransaction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = [action.payload, ...state.transactions];
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTransactions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(
          transaction => transaction.id !== action.payload
        );
      })
      .addCase(fetchTransactionsByCowId.fulfilled, (state, action) => {
        state.transactionsByCowId = action.payload;
      })
      .addCase(fetchTransactionsByCowId.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateTransaction.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default transactionSlice.reducer; 