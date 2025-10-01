const Friend = require("../models/Friend");
const Player = require("../models/Player");

exports.addFriend = async (req, res) => {
  try {
    //   const { _id:userId, friends, friendRequest  } = req.user
    const { requester, recipient, status = "pending" } = req.body;

    console.log("req user", req.user);

    if (requester == recipient) {
      return res.status(400).json({
        success: false,
        message: "you cannot add yourself as friend",
      });
    }

    const existUser = await Player.findById(recipient);

    if (!existUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // check if user is already a dost friend

    const alreadyFrnd = await Friend.findOne({
      $or: [
        { requester, recipient, status: "accepted" },
        { requester: recipient, recipient: requester, status: "accepted" },
      ],
    });

    console.log("alrdyfrnd", alreadyFrnd);

    if (alreadyFrnd) {
      return res.status(400).json({
        success: false,
        message: "You are already friend with the user",
      });
    }

    // check if user is already sent dost request

    const alreadyFrndReq = await Friend.findOne({
      $or: [
        { requester, recipient, status: "pending" },
        { requester: recipient, recipient: requester, status: "pending" },
      ],
    });

    console.log("alrdyfrndrqst", alreadyFrndReq);

    if (alreadyFrndReq) {
      return res.status(400).json({
        success: false,
        message: "You have already sent or recived friend request to/from user",
      });
    }

    const response = await Friend.create({
      requester,
      recipient,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      message: "friend request sent",
    });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.acceptFrndRequest = async (req, res) => {
  try {
    const { requester, recipient } = req.body;

    // check if user is already a dost friend

    const alreadyFrnd = await Friend.findOne({
      $or: [
        { requester, recipient, status: "accepted" },
        { requester: recipient, recipient: requester, status: "accepted" },
      ],
    });

    console.log("alrdyfrnd", alreadyFrnd);

    if (alreadyFrnd) {
      return res.status(400).json({
        success: false,
        message: "You are already friend with the user",
      });
    }

    const response = await Friend.findOneAndUpdate(
      {
        $or: [
          { requester, recipient, status: "pending" },
          { requester: recipient, recipient: requester, status: "pending" },
        ],
      },
      { status: "accepted" },
      { new: true }
    );

    console.log("response", response);
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rejectFrndRequest = async (req, res) => {
  try {
    const { requester, recipient } = req.body;

    // check if user is already a dost friend

    const alreadyFrnd = await Friend.findOne({
      $or: [
        { requester, recipient, status: "accepted" },
        { requester: recipient, recipient: requester, status: "accepted" },
      ],
    });

    console.log("alrdyfrnd", alreadyFrnd);

    if (alreadyFrnd) {
      return res.status(400).json({
        success: false,
        message: "You are already friend with the user",
      });
    }

    const response = await Friend.findOneAndUpdate(
      {
        $or: [
          { requester, recipient, status: "pending" },
          { requester: recipient, recipient: requester, status: "pending" },
        ],
      },
      { status: "rejected" },
      { new: true }
    );

    console.log("response", response);
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.userList = async (req, res) => {
  const { _id } = req.user; // logged-in user ID
  const { searchText } = req.body;

  try {
    // Step 1: Find all friend relationships where user is involved
    const friendships = await Friend.find({
      $or: [
        { requester: _id, status: "accepted" },
        { recipient: _id, status: "accepted" },
      ],
    });

    // Step 2: Collect friend IDs
    const friendIds = friendships.map(f =>
      f.requester.toString() === _id.toString() ? f.recipient : f.requester
    );

    // Step 3: Build query for users
    const query = {
      _id: { $nin: [...friendIds, _id] }, // exclude self & friends
    };

    if (searchText && searchText.trim() !== "") {
      query.username = { $regex: searchText, $options: "i" }; // case-insensitive match
    }

    // Step 4: Fetch users
    const users = await Player.find(query).select("username email gender country");

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

