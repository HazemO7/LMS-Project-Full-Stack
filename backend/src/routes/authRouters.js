const express = require("express");

const router = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  validateRequest,
} = require("../validators/authValidator");

const {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
} = require("../middleware/rateLimiter");

const { protect } = require("../middleware/authmiddleware");

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword
);
router.put(
  "/reset-password/:token",
  resetPasswordLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);
router.put(
  "/change-password",
  protect,
  changePasswordLimiter,
  validateRequest(changePasswordSchema),
  changePassword
);

module.exports = router;
