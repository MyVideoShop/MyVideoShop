const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Category = require('../models/Category');

// Startseite
router.get('/', async (req, res) => {
  try {
    // Beliebte Videos laden
    const popularVideos = await Video.find({ status: 'published' })
      .sort({ purchases: -1 })
      .limit(12)
      .populate('creator', 'username')
      .exec();

    // Neue Videos laden
    const newVideos = await Video.find({ status: 'published' })
      .sort({ uploadDate: -1 })
      .limit(12)
      .populate('creator', 'username')
      .exec();

    // Kategorien laden
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .limit(10)
      .exec();

    res.render('customer/index', {
      title: 'Willkommen bei MyVideoShop',
      popularVideos,
      newVideos,
      categories,
      user: req.session.user
    });
  } catch (err) {
    console.error('Fehler beim Laden der Startseite:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden der Startseite aufgetreten.'
    });
  }
});

// Video-Detailseite
router.get('/video/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'username profileImage')
      .exec();

    if (!video || video.status !== 'published') {
      return res.status(404).render('error', {
        title: 'Nicht gefunden',
        message: 'Das angeforderte Video existiert nicht oder ist nicht verfügbar.'
      });
    }

    res.render('customer/video', {
      title: video.title,
      video,
      user: req.session.user
    });
  } catch (err) {
    console.error('Fehler beim Laden des Videos:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden des Videos aufgetreten.'
    });
  }
});

// Kategorie-Seite
router.get('/category/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category || !category.isActive) {
      return res.status(404).render('error', {
        title: 'Nicht gefunden',
        message: 'Die angeforderte Kategorie existiert nicht.'
      });
    }

    const videos = await Video.find({ 
      categories: category.name,
      status: 'published'
    })
    .sort({ uploadDate: -1 })
    .populate('creator', 'username')
    .exec();

    res.render('customer/category', {
      title: `Kategorie: ${category.name}`,
      category,
      videos,
      user: req.session.user
    });
  } catch (err) {
    console.error('Fehler beim Laden der Kategorie:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden der Kategorie aufgetreten.'
    });
  }
});

module.exports = router;
