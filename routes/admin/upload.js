const express = require('express');
const router = express.Router();

// GET /admin/upload – Zeigt die Upload-Seite
router.get('/', (req, res) => {
  res.render('admin-upload');
});

module.exports = router;
