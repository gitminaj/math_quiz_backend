const express = require('express');
const auth = require('../middleware/auth');
const { addFriend, userList } = require('../controller/friend');
const router = express.Router();

router.post('/add-friend', auth,  addFriend);
router.post('/user-list', auth,  userList);


module.exports = router;
