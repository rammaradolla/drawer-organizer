const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const calculateTotalPrice = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

const createCheckoutSession = async (userId, cartItems) => {
  try {
    const totalPrice = calculateTotalPrice(cartItems);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map(item => {
        const unit_amount = Math.max(50, Math.round(Number(item.price) * 100)); // Minimum $0.50
        console.log('Stripe unit_amount:', unit_amount, 'for price:', item.price);
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.wood_type} Drawer Organizer`,
              description: `${item.dimensions.width}" x ${item.dimensions.height}" x ${item.dimensions.depth}"`,
            },
            unit_amount,
          },
          quantity: item.quantity,
        };
      }),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        userId,
      },
    });

    // Create order record in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        cart_json: cartItems,
        total_price: totalPrice,
        status: 'pending',
        stripe_checkout_id: session.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      checkoutUrl: session.url,
      orderId: order.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

const handleWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Update order status in Supabase
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('stripe_checkout_id', session.id);

        if (error) throw error;
        break;
      }
      // Add other webhook event handlers as needed
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
}; 