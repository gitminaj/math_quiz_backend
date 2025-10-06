const express = require('express');
const auth = require('../middleware/auth');
const { addFriend, userList, rejectFrndRequest, acceptFrndRequest, searchUser } = require('../controller/friend');
const router = express.Router();

router.post('/add-friend', auth,  addFriend);
router.post('/accept-friend', auth,  acceptFrndRequest);
router.post('/reject-friend', auth,  rejectFrndRequest);
router.post('/search-user-list', auth,  searchUser);
router.post('/alluser-list', auth,  userList);


module.exports = router;
