const User = require("../models/User");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { registerSchema, loginSchema } = require("./validation/authValidation");


/////////////// register user ////////////////////
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        msg: error.details.map((err) => err.message),
      });
    }

    // get Data
    const { name, email, password } = value;
    // Validated Data
    if (!name || !email || !password)
      return res.status(400).json({ msg: "Missing Data" });

    const existUser = await User.findOne({ email });
    if (existUser)
      return res.status(400).json({ msg: "Account Already Exist" });
    // Create New User
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      role: 'student',
    });
    // Response

    res.status(201).json({
      msg: "Done Created User",
      data: user,
    });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) res.status(500).json({
       msg: error.message || "Internal Server Error"
       });
  }
};
//////////////// login user ///////////////////////  


const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        msg: error.details.map((err) => err.message),
      });
    }
    // Get Data
    const { email, password } = value;
    // Validated Data
    if (!email || !password)
      return res.status(400).json({ msg: "Missing Data" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ msg: "Your Account Not Found Please Create Account" });

    // Match Password
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword)
      return res.status(400).json({ msg: "Invalid Password" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      msg: "Success Login",
      token,
    });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) res.status(500).json({ msg: error.message || "Internal Server Error" });
  }
};

/////////////// logout user /////////////

const logout = async (req, res) => {
  try {
    res.status(200).json({
      msg: "Success Logout",
    });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) res.status(500).json({ msg: error.message || "Internal Server Error" });
  }
};



///// Export Controller ////

module.exports = {
  register,
  login,
  logout,
};
