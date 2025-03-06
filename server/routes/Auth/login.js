const express = require("express");
const db = require("../../database/db.js");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM USERS WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = results[0];
    if (user.password === password) {
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          user_role: user.role,
        },
        SECRET,
        { expiresIn: "1d" }
      );
      console.log(user.role);
      res.status(200).json({
        token,
        email: user.email,
        role: user.role,
        userId: user.user_id,
      });
    } else {
      res.status(401).json({ message: "Unauthorized: Incorrect password" });
    }
  });
});

module.exports = router;
