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
    clearCart: () => [],
    setCart: (state, action) => {
      return action.payload;
    },
  },
});

export const { addCartItem, removeCartItem, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer; 