const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const emailService = require('./emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const calculateTotalPrice = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

const createCheckoutSession = async (userId, cartItems, addresses = null, clientOrigin = null) => {
  try {
    const totalPrice = calculateTotalPrice(cartItems);
    
    // Use client origin if provided, otherwise fall back to CLIENT_URL env var
    const baseUrl = clientOrigin || process.env.CLIENT_URL || 'http://localhost:5173';
    console.log('🔗 Stripe checkout using base URL:', baseUrl);
    
    // Prepare Stripe checkout session options
    const sessionOptions = {
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
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        userId,
      },
    };

    // Add shipping address to Stripe if provided
    if (addresses && addresses.shipping_street) {
      sessionOptions.shipping_address_collection = {
        allowed_countries: ['US', 'CA'], // Add more countries as needed
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    // Determine the initial stage
    const initialStage = 'Awaiting Payment';
    
    // Find department head for the initial stage using the new department_head_stages join table
    const { data: stageAssignment } = await supabase
      .from('department_head_stages')
      .select('department_head_id')
      .eq('stage', initialStage)
      .single();
    
    const assigneeId = stageAssignment ? stageAssignment.department_head_id : null;

    // Prepare order data with addresses
    const orderData = {
      user_id: userId,
      cart_json: cartItems,
      total_price: totalPrice,
      status: 'pending',
      stripe_checkout_id: session.id,
      assignee_id: assigneeId,
      granular_status: initialStage,
    };

    // Add address fields if provided
    if (addresses) {
      orderData.billing_street = addresses.billing_street;
      orderData.billing_city = addresses.billing_city;
      orderData.billing_state = addresses.billing_state;
      orderData.billing_zip = addresses.billing_zip;
      orderData.billing_country = addresses.billing_country || 'US';
      orderData.billing_phone = addresses.billing_phone;
      orderData.shipping_street = addresses.shipping_street;
      orderData.shipping_city = addresses.shipping_city;
      orderData.shipping_state = addresses.shipping_state;
      orderData.shipping_zip = addresses.shipping_zip;
      orderData.shipping_country = addresses.shipping_country || 'US';
      orderData.shipping_phone = addresses.shipping_phone;
    }

    // Create order record in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
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
  console.log(`[Stripe Webhook] Received event: ${event.type}, ID: ${event.id}`);
  
  // Check if we've already processed this webhook event (idempotency)
  try {
    const { data: existingWebhook, error: webhookCheckError } = await supabase
      .from('order_audit_log')
      .select('id')
      .eq('action', 'WEBHOOK_PROCESSED')
      .like('notes', `%${event.id}%`)
      .limit(1)
      .single();
    
    if (!webhookCheckError && existingWebhook) {
      console.log(`[Stripe Webhook] ⚠️ Webhook event ${event.id} already processed. Skipping to prevent duplicate processing.`);
      return; // Already processed, skip
    }
  } catch (checkError) {
    // If check fails, continue anyway (don't block webhook processing)
    console.warn(`[Stripe Webhook] Could not check for duplicate webhook ${event.id}, continuing anyway:`, checkError.message);
  }
  
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

        // Find department head for the new stage using the new department_head_stages join table
        const newStage = 'Payment Confirmed';
        const { data: stageAssignment } = await supabase
          .from('department_head_stages')
          .select('department_head_id')
          .eq('stage', newStage)
          .single();
        
        const newAssigneeId = stageAssignment ? stageAssignment.department_head_id : null;

        // Update order status in Supabase
        const updates = {
          status: 'in_progress',
          granular_status: newStage,
          assignee_id: newAssigneeId, // Auto-assign to department head for new stage
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
        
        // Mark webhook as processed (idempotency)
        try {
          await supabase
            .from('order_audit_log')
            .insert({
              order_id: order.id,
              action: 'WEBHOOK_PROCESSED',
              old_values: JSON.stringify({}),
              new_values: JSON.stringify({ webhook_id: event.id, webhook_type: event.type }),
              updated_by: order.user_id,
              notes: `Stripe webhook event ${event.id} (${event.type}) processed successfully`
            });
          console.log(`[Stripe Webhook] Marked webhook ${event.id} as processed for order ${order.id}`);
        } catch (webhookLogError) {
          console.warn(`[Stripe Webhook] Failed to log webhook processing for ${event.id}:`, webhookLogError.message);
        }
        
        console.log(`[Stripe Webhook] Audit log created for order ${order.id}.`);

        // Send order confirmation email to customer
        console.log(`[Stripe Webhook] Attempting to send order confirmation email for order ${order.id}...`);
        try {
          const emailSent = await emailService.sendOrderConfirmation(order.id);
          if (emailSent) {
            console.log(`[Stripe Webhook] ✅ Order confirmation email sent successfully for order ${order.id}`);
          } else {
            console.warn(`[Stripe Webhook] ⚠️ Failed to send order confirmation email for order ${order.id}, but order processing continues`);
            console.warn(`[Stripe Webhook] Check email configuration and server logs for details`);
          }
        } catch (emailError) {
          // Log error but don't fail webhook processing
          console.error(`[Stripe Webhook] ❌ Error sending order confirmation email for order ${order.id}:`, emailError);
          console.error(`[Stripe Webhook] Error message:`, emailError.message);
          console.error(`[Stripe Webhook] Error code:`, emailError.code);
          console.log(`[Stripe Webhook] Order processing continues despite email error`);
        }

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