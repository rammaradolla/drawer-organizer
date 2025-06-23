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

    // Create audit log entry for order creation
    await supabase
      .from('order_audit_log')
      .insert({
        order_id: order.id,
        action: 'ORDER_CREATED',
        old_values: JSON.stringify({}),
        new_values: JSON.stringify({
          status: 'pending',
          total_price: totalPrice,
          cart_items_count: cartItems.length
        }),
        updated_by: userId, // Use the customer's user ID
        notes: `Order created with ${cartItems.length} items, total: $${totalPrice.toFixed(2)}`
      });

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
  console.log(`[Stripe Webhook] Received event: ${event.type}`);
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`[Stripe Webhook] Processing checkout.session.completed for session: ${session.id}`);
        
        // Get the order first to get the old status
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_checkout_id', session.id)
          .single();

        if (orderError) {
          console.error(`[Stripe Webhook] Error finding order with session ID ${session.id}:`, orderError);
          throw orderError;
        }

        if (!order) {
            console.error(`[Stripe Webhook] Order with session ID ${session.id} not found.`);
            return; // Stop processing if order not found
        }
        
        console.log(`[Stripe Webhook] Found order ${order.id}. Current status: ${order.status}`);

        // Update order status in Supabase
        const updates = {
          status: 'in_progress',
          granular_status: 'Payment Confirmed',
        };
        
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update(updates)
          .eq('stripe_checkout_id', session.id)
          .select()
          .single();

        if (updateError) {
          console.error(`[Stripe Webhook] Error updating order ${order.id}:`, updateError);
          throw updateError;
        }

        console.log(`[Stripe Webhook] Successfully updated order ${order.id} to status: in_progress / Payment Confirmed`);

        // Create audit log entry for payment
        await supabase
          .from('order_audit_log')
          .insert({
            order_id: order.id,
            action: 'PAYMENT_RECEIVED',
            old_values: JSON.stringify({ status: order.status, granular_status: order.granular_status }),
            new_values: JSON.stringify(updates),
            updated_by: order.user_id, // Use the customer's user ID
            notes: `Payment completed via Stripe. Status changed to In Progress / Payment Confirmed.`
          });
        
        console.log(`[Stripe Webhook] Audit log created for order ${order.id}.`);

        break;
      }
      // Add other webhook event handlers as needed
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('[Stripe Webhook] Unhandled error in webhook handler:', error);
    // Do not throw error here to prevent Stripe from resending the webhook for unhandled errors
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
}; 