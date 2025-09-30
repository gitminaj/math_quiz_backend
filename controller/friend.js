

exports.addFriend = (req, res) =>{
    try {
        const { friendId } = req.body;
        console.log('req user', req.user);

         return res.status(200).json({
            success: true,
            message: error.message
        })

    } catch (error) {
        console.log('error:', error)
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}