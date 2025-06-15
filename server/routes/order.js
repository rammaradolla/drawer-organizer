const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Submit order
router.post('/submit', async (req, res) => {
  try {
    const { name, email, address, design, totalPrice } = req.body;

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to admin
      subject: `New Drawer Organizer Order from ${name}`,
      html: `
        <h2>New Order Details</h2>
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Shipping Address:</strong> ${address}</p>
        
        <h3>Order Details</h3>
        <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
        
        <h3>Design Specifications</h3>
        <p><strong>Overall Dimensions:</strong> ${design.width}" × ${design.depth}" × ${design.height}"</p>
        <p><strong>Number of Compartments:</strong> ${design.compartments.length}</p>
        
        <h4>Compartment Details:</h4>
        ${design.compartments.map((comp, index) => `
          <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #333;">
            <strong>Compartment ${index + 1}:</strong><br>
            Position: ${comp.x.toFixed(2)}", ${comp.y.toFixed(2)}" from top-left<br>
            Size: ${comp.width.toFixed(2)}" × ${comp.height.toFixed(2)}"
          </div>
        `).join('')}
      `,
      // Send confirmation to customer
      cc: email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Order submitted successfully'
    });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit order',
      error: error.message
    });
  }
});

// Fetch all orders for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router; 