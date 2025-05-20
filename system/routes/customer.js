const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const Purchase = require('../models/Purchase');

// Video-Kaufprozess
router.post('/video/:id/purchase', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video || video.status !== 'published') {
      return res.status(404).json({ 
        success: false,
        message: 'Video nicht gefunden oder nicht verfügbar.' 
      });
    }
    
    // Kauf erstellen
    const newPurchase = new Purchase({
      video: video._id,
      amountPaid: video.isFree ? 0 : video.price,
      paymentMethod: 'paypal', // oder coupon, wenn angewendet
      status: 'pending'
    });
    
    await newPurchase.save();
    
    // Hier würde normalerweise die Zahlung mit PayPal initiiert werden
    
    res.json({ 
      success: true,
      message: 'Kauf erfolgreich initiiert.',
      purchaseId: newPurchase._id
    });
  } catch (err) {
    console.error('Kauf Fehler:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ein Fehler ist beim Kaufprozess aufgetreten.' 
    });
  }
});

// Coupon validieren
router.post('/coupon/validate', async (req, res) => {
  try {
    const { code, videoId } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { isGlobal: true },
        { creator: await Video.findById(videoId).select('creator') }
      ]
    });
    
    if (!coupon) {
      return res.json({ 
        valid: false,
        message: 'Ungültiger Gutscheincode.' 
      });
    }
    
    res.json({ 
      valid: true,
      value: coupon.value,
      isPercentage: coupon.isPercentage,
      message: 'Gutschein erfolgreich angewendet.'
    });
  } catch (err) {
    console.error('Coupon Validierung Fehler:', err);
    res.status(500).json({ 
      valid: false,
      message: 'Ein Fehler ist bei der Gutscheinprüfung aufgetreten.' 
    });
  }
});

// Support-Nachricht senden
router.post('/support', async (req, res) => {
  try {
    const { title, message } = req.body;
    
    const newMessage = new SupportMessage({
      title,
      message,
      sender: 'customer',
      senderEmail: req.body.email
    });
    
    await newMessage.save();
    
    res.json({ 
      success: true,
      message: 'Ihre Nachricht wurde erfolgreich versendet.' 
    });
  } catch (err) {
    console.error('Support Nachricht Fehler:', err);
    res.status(500).json({ 
      success: false,
      message: 'Ein Fehler ist beim Versenden der Nachricht aufgetreten.' 
    });
  }
});

module.exports = router;
