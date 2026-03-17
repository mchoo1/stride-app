import React, { createContext, useContext, useReducer } from 'react';

// ─── Initial State ───────────────────────────────────────────────────────────
const initialState = {
  profile: {
    name: 'Ming',
    goalCalories: 2000,
    goalProtein: 150,  // grams
    goalCarbs: 200,    // grams
    goalFat: 65,       // grams
    goal: 'weight_loss', // weight_loss | muscle_gain | maintenance
  },
  foodLog: [], // { id, name, calories, protein, carbs, fat, timestamp, imageUri? }
  todayTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTodayKey = () => new Date().toDateString();

const computeTodayTotals = (foodLog) => {
  const today = getTodayKey();
  return foodLog
    .filter((entry) => new Date(entry.timestamp).toDateString() === today)
    .reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein:  acc.protein  + (entry.protein  || 0),
        carbs:    acc.carbs    + (entry.carbs     || 0),
        fat:      acc.fat      + (entry.fat       || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_FOOD_ENTRY': {
      const newLog = [
        ...state.foodLog,
        { ...action.payload, id: Date.now().toString(), timestamp: new Date().toISOString() },
      ];
      return { ...state, foodLog: newLog, todayTotals: computeTodayTotals(newLog) };
    }
    case 'REMOVE_FOOD_ENTRY': {
      const newLog = state.foodLog.filter((e) => e.id !== action.payload);
      return { ...state, foodLog: newLog, todayTotals: computeTodayTotals(newLog) };
    }
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addFoodEntry  = (entry)  => dispatch({ type: 'ADD_FOOD_ENTRY',    payload: entry });
  const removeFoodEntry = (id)   => dispatch({ type: 'REMOVE_FOOD_ENTRY', payload: id   });
  const updateProfile   = (data) => dispatch({ type: 'UPDATE_PROFILE',    payload: data });

  return (
    <AppContext.Provider value={{ state, addFoodEntry, removeFoodEntry, updateProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
