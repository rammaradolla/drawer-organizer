const { cartItems, quantities, user, layout } = req.body;
const session = await stripe.checkout.sessions.create({
  payment_method_types: [ 'card' ],
  line_items: cartItems.map(item => ({ price_data: { currency: 'usd', product_data: { name: 'Drawer Organizer (Custom)' }, unit_amount: (item.price || 0) * (quantities[item.id] || 1) * 100 }, quantity: 1 })),
  mode: 'payment',
  success_url: (process.env.CLIENT_URL || 'http://localhost:3000') + '/checkout-success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: (process.env.CLIENT_URL || 'http://localhost:3000') + '/cart',
  customer_email: user?.email,
  metadata: { layout: JSON.stringify(layout) }
}); 