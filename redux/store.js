import { configureStore } from "@reduxjs/toolkit";
import languageReducer  from './slices/langSlice'
import cowReducer from './slices/cowSlice' 
import eventReducer from './slices/eventSlice'
import transactionReducer from './slices/transactionSlice'
import milkReducer from './slices/milkSlice'
import healthReducer from './slices/healthSlice'

const store = configureStore({
    reducer: {
         language: languageReducer,
         cows: cowReducer,
         events: eventReducer,
         transactions: transactionReducer,
         milk: milkReducer,
         health: healthReducer
    },
});

export default store;
