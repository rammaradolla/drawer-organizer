const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// Export design as PDF
router.post('/export', async (req, res) => {
  try {
    const { design } = req.body;
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Create HTML content for the design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .design-container { border: 2px solid #333; padding: 20px; margin: 20px 0; }
            .measurements { margin: 20px 0; }
            .compartment { margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #333; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .tolerance-note { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Drawer Organizer Design</h1>
          <div class="design-container">
            <div class="tolerance-note">
              <strong>Manufacturing Note:</strong> Dimensions include a 1/16" (0.0625") tolerance reduction on width and depth to ensure proper fit inside the drawer box.
              ${design.originalWidth ? `<br><strong>Customer-ordered dimensions:</strong> ${design.originalWidth}" × ${design.originalDepth}" × ${design.height}"` : ''}
            </div>
            <div class="measurements">
              <h2>Manufacturing Dimensions (Cut Size)</h2>
              <p><strong>Width:</strong> ${design.width.toFixed(4)}"</p>
              <p><strong>Depth:</strong> ${design.depth.toFixed(4)}"</p>
              <p><strong>Height:</strong> ${design.height}"</p>
            </div>
            <h2>Compartments (${design.compartments.length} total)</h2>
            ${design.compartments.map((comp, index) => `
              <div class="compartment">
                <strong>Compartment ${index + 1}:</strong><br>
                Position: ${comp.x.toFixed(2)}", ${comp.y.toFixed(2)}" from top-left<br>
                Size: ${comp.width.toFixed(2)}" × ${comp.height.toFixed(2)}"
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=drawer-design.pdf');
    res.send(pdf);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export design',
      error: error.message
    });
  }
});

module.exports = router; 