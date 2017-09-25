const express = require('express');
const router = express.Router();

router.get('/demo', function(req, res, next) {
  res.send('api works');
});

module.exports = router;
