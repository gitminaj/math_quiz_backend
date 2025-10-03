const express = require('express');
const auth = require('../middleware/auth');
const { addFriend, userList, rejectFrndRequest, acceptFrndRequest } = require('../controller/friend');
const router = express.Router();

router.post('/add-friend', auth,  addFriend);
router.post('/accept-friend', auth,  acceptFrndRequest);
router.post('/reject-friend', auth,  rejectFrndRequest);
router.post('/user-list', auth,  userList);

module.exports = router;
