const User = require('../models/User')
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinary');

// Generate jwt token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


//Register User
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if(!fullName || !email || !password) {
            return res.status(400).json({message: 'All fields are required'});
        }

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({message: 'Email already in use'});
        }

        let profileImageUrl = null;

        if(req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "profiles"
            });
            
            profileImageUrl = result.secure_url;
        }

        const user = await User.create({
            fullName,
            email,
            password,
            profileImageUrl
        });

        res.status(201).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Error", error: err.message});
    }
};



//login User
exports.loginUser = async (req,res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try{
        const user = await User.findOne({ email });
        if(!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message : "Invalid credentials"});
        }
        res.status(200).json({
            id: user._id,
            user,
            token: generateToken(user._id),
        });
    } catch (err) {
        res.status(500)
        .json({message: "Error resgistering user", error: err.message});
    }
};





//Register User
exports.getUserInfo = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({message: "Error registering user", error: err.message});
    }
};