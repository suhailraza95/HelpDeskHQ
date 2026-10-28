const authService = require("./auth.service");

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result
    });
  } catch (error) {
  console.error(error.message);

  const statusCode =
    error.message ===
    "Valid organizationId, email and password are required"
      ? 400
      : 401;

  return res.status(statusCode).json({
    success: false,
    message: error.message
  });
}
}


async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

module.exports = { register, login, getMe };