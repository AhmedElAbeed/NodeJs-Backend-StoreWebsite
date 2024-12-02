// middleware/auth.js
const config = require("config");
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace('Bearer ', ''); // Extract the token from the Authorization header

  if (!token) {
    return res.status(401).json({ msg: "Access denied, please login" });
  }

  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.id; // Attach the user id to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(400).json({ msg: "Token not valid, please login again" });
  }
};


module.exports = auth;
