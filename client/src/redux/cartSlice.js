import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: [],
  reducers: {
    addCartItem: (state, action) => {
      state.push(action.payload);
    },
    removeCartItem: (state, action) => {
      return state.filter(item => item.id !== action.payload);
    },
    updateCartItem: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.findIndex(item => item.id === id);
      if (index !== -1) {
        state[index] = { ...state[index], ...updates };
      }
    },
    clearCart: () => [],
    setCart: (state, action) => {
      return action.payload;
    },
  },
});

export const { addCartItem, removeCartItem, updateCartItem, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer; 