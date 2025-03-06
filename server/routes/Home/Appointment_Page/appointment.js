const express = require("express");
const db = require("../../../database/db");

const router = express.Router();

router.post("/request", (req, res) => {
  const {
    name,
    contact,
    appointment_date,
    appointment_time,
    gender,
    age,
    department,
  } = req.body;

  // Format date and time for MySQL
  const date = new Date(appointment_date).toISOString().split("T")[0];
  const time =
    appointment_time.length === 5 ? `${appointment_time}:00` : appointment_time;
  // SQL query
  const query = `
    INSERT INTO APPOINTMENT_REQUESTS (
      name, contact, appointment_date, appointment_time, gender, age, department
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [name, contact, date, time, gender, age, department];

  // Execute query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error inserting appointment request:", err);
      return res.status(500).json({ message: "Failed to submit request" });
    }
    res.status(201).json({
      message: "Appointment request submitted successfully",
      request_id: result.insertId,
    });
  });
});

module.exports = router;
