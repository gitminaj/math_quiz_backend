const express = require('express');
const auth = require('../middleware/auth');
const { addFriend } = require('../controller/friend');
const router = express.Router();

router.post('/add-friend', auth,  addFriend);

module.exports = router;
