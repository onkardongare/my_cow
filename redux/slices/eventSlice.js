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

// Async action: Add event for one or multiple cows
export const addEvent = createAsyncThunk(
  'events/addEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Validate required fields
      if (!eventData.type || !eventData.date || !eventData.cowIds || eventData.cowIds.length === 0) {
        throw new Error('Missing required fields');
      }

      // Ensure cowIds is an array
      const cowIds = Array.isArray(eventData.cowIds) ? eventData.cowIds : [eventData.cowIds];

      // Create a single event record with multiple cowIds
      const result = await db.runAsync(
        `INSERT INTO events (
          type, date, description, cowIds, status, createdAt
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          eventData.type,
          eventData.date,
          eventData.description || '',
          JSON.stringify(cowIds),
          'pending'
        ]
      );

      // Fetch the newly inserted event
      const [newEvent] = await db.getAllAsync(
        'SELECT * FROM events WHERE id = ?',
        [result.lastInsertRowId]
      );

      // Parse cowIds from JSON string
      newEvent.cowIds = safeJsonParse(newEvent.cowIds);

      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Fetch all events
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      const events = await db.getAllAsync(
        'SELECT * FROM events ORDER BY date DESC'
      );

      // Parse cowIds from JSON string for each event
      console.log(events)
      return events.map(event => ({
        ...event,
        cowIds: safeJsonParse(event.cowIds)
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Update event status
export const updateEventStatus = createAsyncThunk(
  'events/updateEventStatus',
  async ({ eventId, status }, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE events SET status = ?, updatedAt = datetime("now") WHERE id = ?',
        [status, eventId]
      );
      return { eventId, status };
    } catch (error) {
      console.error('Error updating event status:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Delete completed event
export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // First check if the event is completed
      const [event] = await db.getAllAsync(
        'SELECT status FROM events WHERE id = ?',
        [eventId]
      );

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'completed') {
        throw new Error('Only completed events can be deleted');
      }

      // Delete the event
      await db.runAsync('DELETE FROM events WHERE id = ?', [eventId]);
      return eventId;
    } catch (error) {
      console.error('Error deleting event:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Fetch events for a specific cow
export const fetchCowEvents = createAsyncThunk(
  'events/fetchCowEvents',
  async (cowId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Fetch all events
      const events = await db.getAllAsync(
        'SELECT * FROM events ORDER BY date DESC'
      );
      
      // Filter events for this specific cow
      const cowEvents = events.filter(event => {
        try {
          const cowIds = safeJsonParse(event.cowIds);
          
          // Convert both to strings for comparison to avoid type issues
          const cowIdStr = String(cowId);
          const includesCow = cowIds.some(id => String(id) === cowIdStr);
          
          return Array.isArray(cowIds) && includesCow;
        } catch (error) {
          console.error('Error parsing cowIds:', error);
          return false;
        }
      });

      // Parse cowIds from JSON string for each event
      return cowEvents.map(event => ({
        ...event,
        cowIds: safeJsonParse(event.cowIds)
      }));
    } catch (error) {
      console.error('Error fetching cow events:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Delete event for a cow
export const deleteCowEvent = createAsyncThunk(
  'events/deleteCowEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // First verify the event exists
      const [existingEvent] = await db.getAllAsync(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );

      if (!existingEvent) {
        throw new Error('Event not found');
      }

      // Delete the event
      await db.runAsync(
        'DELETE FROM events WHERE id = ?',
        [eventId]
      );

      return eventId;
    } catch (error) {
      console.error('Error deleting event:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Delete all events for a specific cow
export const deleteAllCowEvents = createAsyncThunk(
  'events/deleteAllCowEvents',
  async (cowId, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Fetch all events
      const events = await db.getAllAsync(
        'SELECT * FROM events'
      );
      
      // Filter events that contain this cow
      const eventsToDelete = events.filter(event => {
        try {
          const cowIds = safeJsonParse(event.cowIds);
          const cowIdStr = String(cowId);
          return Array.isArray(cowIds) && cowIds.some(id => String(id) === cowIdStr);
        } catch (error) {
          console.error('Error parsing cowIds:', error);
          return false;
        }
      });

      // Delete each event
      for (const event of eventsToDelete) {
        await db.runAsync(
          'DELETE FROM events WHERE id = ?',
          [event.id]
        );
      }

      return cowId;
    } catch (error) {
      console.error('Error deleting cow events:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Async action: Update event
export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, ...eventData }, { rejectWithValue }) => {
    try {
      const db = await getDatabase();
      
      // Validate required fields
      if (!eventData.type || !eventData.date || !eventData.cowIds || eventData.cowIds.length === 0) {
        throw new Error('Missing required fields');
      }

      // Ensure cowIds is an array
      const cowIds = Array.isArray(eventData.cowIds) ? eventData.cowIds : [eventData.cowIds];

      // Update the event
      await db.runAsync(
        `UPDATE events 
         SET type = ?, date = ?, description = ?, cowIds = ?, updatedAt = datetime('now')
         WHERE id = ?`,
        [
          eventData.type,
          eventData.date,
          eventData.description || '',
          JSON.stringify(cowIds),
          eventId
        ]
      );

      // Fetch the updated event
      const [updatedEvent] = await db.getAllAsync(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );

      // Parse cowIds from JSON string
      updatedEvent.cowIds = safeJsonParse(updatedEvent.cowIds);

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      return rejectWithValue(error.message);
    }
  }
);

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    cowEvents: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(addEvent.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = [action.payload, ...state.events];
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateEventStatus.fulfilled, (state, action) => {
        const { eventId, status } = action.payload;
        const event = state.events.find(e => e.id === eventId);
        if (event) {
          event.status = status;
          event.updatedAt = new Date().toISOString();
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(event => event.id !== action.payload);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchCowEvents.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCowEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.cowEvents = action.payload;
      })
      .addCase(fetchCowEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCowEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(event => event.id !== action.payload);
        state.cowEvents = state.cowEvents.filter(event => event.id !== action.payload);
      })
      .addCase(deleteAllCowEvents.fulfilled, (state, action) => {
        // Remove all events for this cow from both events and cowEvents arrays
        state.events = state.events.filter(event => {
          try {
            const cowIds = safeJsonParse(event.cowIds);
            const cowIdStr = String(action.payload);
            return !cowIds.some(id => String(id) === cowIdStr);
          } catch (error) {
            return true;
          }
        });
        state.cowEvents = [];
      })
      .addCase(updateEvent.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default eventSlice.reducer; 