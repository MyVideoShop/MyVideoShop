const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Creator = require('../models/Creator');
const Video = require('../models/Video');
const Coupon = require('../models/Coupon');
const SupportMessage = require('../models/SupportMessage');
const Purchase = require('../models/Purchase');

// Middleware für Admin-Authentifizierung
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/auth/login');
  }
  next();
});

// Admin Dashboard
router.get('/', async (req, res) => {
  try {
    // Statistikdaten sammeln
    const videoCount = await Video.countDocuments();
    const creatorCount = await Creator.countDocuments({ status: 'active' });
    const pendingCreators = await Creator.countDocuments({ status: 'pending' });
    const openSupportTickets = await SupportMessage.countDocuments({ status: 'open' });
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      stats: {
        videoCount,
        creatorCount,
        pendingCreators,
        openSupportTickets
      }
    });
  } catch (err) {
    console.error('Admin Dashboard Fehler:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden des Admin Dashboards aufgetreten.'
    });
  }
});

// Statistikseite
router.get('/stats', async (req, res) => {
  if (!req.session.user.permissions.stats) {
    return res.status(403).render('error', {
      title: 'Zugriff verweigert',
      message: 'Sie haben keine Berechtigung für diesen Bereich.'
    });
  }

  try {
    // Einnahmen berechnen
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const dailyEarnings = await Purchase.aggregate([
      { $match: { status: 'completed', purchaseDate: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$platformEarnings' } } }
    ]);
    
    const monthlyEarnings = await Purchase.aggregate([
      { $match: { status: 'completed', purchaseDate: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$platformEarnings' } } }
    ]);
    
    const totalEarnings = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$platformEarnings' } } }
    ]);
    
    // Top Creators nach Einnahmen
    const topCreators = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { 
        _id: '$video', 
        total: { $sum: '$creatorEarnings' } 
      } },
      { $lookup: {
        from: 'videos',
        localField: '_id',
        foreignField: '_id',
        as: 'video'
      } },
      { $unwind: '$video' },
      { $group: {
        _id: '$video.creator',
        total: { $sum: '$total' }
      } },
      { $lookup: {
        from: 'creators',
        localField: '_id',
        foreignField: '_id',
        as: 'creator'
      } },
      { $unwind: '$creator' },
      { $project: {
        name: '$creator.username',
        total: 1
      } },
      { $sort: { total: -1 } },
      { $limit: 3 }
    ]);
    
    // Top Videos nach Käufen
    const topVideos = await Video.find({ status: 'published' })
      .sort({ purchases: -1 })
      .limit(1)
      .populate('creator', 'username')
      .exec();
    
    // Top Kategorien
    const topCategories = await Video.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$categories' },
      { $group: {
        _id: '$categories',
        count: { $sum: '$purchases' }
      } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.render('admin/stats', {
      title: 'Statistiken',
      user: req.session.user,
      earnings: {
        day: dailyEarnings[0]?.total || 0,
        month: monthlyEarnings[0]?.total || 0,
        total: totalEarnings[0]?.total || 0
      },
      topCreators,
      topVideo: topVideos[0],
      topCategories
    });
  } catch (err) {
    console.error('Admin Stats Fehler:', err);
    res.status(500).render('error', {
      title: 'Fehler',
      message: 'Ein Fehler ist beim Laden der Statistiken aufgetreten.'
    });
  }
});

// Weitere Admin-Routen hier hinzufügen...

module.exports = router;
