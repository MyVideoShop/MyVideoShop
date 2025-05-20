const express = require('express');
const router = express.Router();
const Creator = require('../models/Creator');
const Video = require('../models/Video');
const Coupon = require('../models/Coupon');
const Purchase = require('../models/Purchase');
const SupportMessage = require('../models/SupportMessage');

// Middleware für Creator-Authentifizierung
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'creator') {
    return res.redirect('/auth/login');
  }
  next();
});

// Creator Dashboard
router.get('/', async (req, res) => {
  try {
    const creator = await Creator.findById(req.session.user.id);
    const videoCount = await Video.countDocuments({ creator: req.session.user.id });
    const totalEarnings = await Purchase.aggregate([
      { $match: { 
        status: 'completed',
        video: { $in: await Video.find({ creator: req.session.user.id }).distinct('_id') }
      } },
      { $group: { _id: null, total: { $sum: '$creatorEarnings' } } }
    ]);
    
    res.render('creator/dashboard', {
      title: 'Creator Dashboard',
      user: req.session.user,
      creator,
      stats: {
        videoCount,
        totalEarnings: totalEarnings[0]?.total || 0
      }
    });
  } catch (err) {
    console.error('Creator Dashboard Fehler:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden des Creator Dashboards aufgetreten.'
    });
  }
});

// Video Upload Formular
router.get('/videos/upload', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.render('creator/video-upload', {
      title: 'Video hochladen',
      user: req.session.user,
      categories
    });
  } catch (err) {
    console.error('Video Upload Form Fehler:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden des Upload-Formulars aufgetreten.'
    });
  }
});

// Video Upload Verarbeitung
router.post('/videos/upload', async (req, res) => {
  try {
    const { title, description, price, isFree, categories } = req.body;
    
    // Neues Video erstellen
    const newVideo = new Video({
      title,
      description,
      price: isFree ? 0 : parseFloat(price),
      isFree: isFree === 'true',
      categories: Array.isArray(categories) ? categories : [categories],
      creator: req.session.user.id,
      status: 'processing'
    });
    
    await newVideo.save();
    
    // Hier würde normalerweise die Video-Verarbeitung gestartet werden
    // z.B. durch einen Worker-Service
    
    res.redirect('/creator/videos');
  } catch (err) {
    console.error('Video Upload Fehler:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Hochladen des Videos aufgetreten.'
    });
  }
});

// Weitere Creator-Routen hier hinzufügen...

module.exports = router;
