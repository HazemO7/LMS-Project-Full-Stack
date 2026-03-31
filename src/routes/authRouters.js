const express = require("express");

const router = express.Router();

const { register, login, logout } = require("../controllers/authController");

router.post("/register", (req, res, next) => { console.log("HIT ROUTER POST /register", req.body); next(); }, register);

router.post("/login", login);

router.post("/logout", logout);



module.exports = router;
