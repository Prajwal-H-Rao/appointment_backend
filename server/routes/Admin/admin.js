// admin.js
const express = require("express");
const router = express.Router();
const db = require("./../../database/db"); // Import the database connection

// Get all appointments
router.get("/doctors", (req, res) => {
  const query = `
    SELECT * FROM DOCTORS;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        message: "Error fetching appointments",
        error: error.message,
      });
    }
    res.json(results);
  });
});

// Get all appointments
router.get("/nurses", (req, res) => {
  const query = `
    SELECT * FROM NURSES;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        message: "Error fetching appointments",
        error: error.message,
      });
    }
    res.json(results);
  });
});
// Get all appointments
router.get("/appointments", (req, res) => {
  const query = `
    SELECT * FROM APPOINTMENTS;
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        message: "Error fetching appointments",
        error: error.message,
      });
    }
    res.json(results);
  });
});
// Get prescriptions by appointment ID
router.get("/prescriptions/:appointmentId", (req, res) => {
  const { appointmentId } = req.params;
  const query = `
    SELECT p.prescription_id, p.medicine_name, p.medicine_dosage, d.doctor_name
    FROM PRESCRIPTIONS p,DOCTORS d,APPOINTMENTS a WHERE p.appointment_id = a.appointment_id AND p.doctor_id = d.doctor_id AND a.appointment_id=?
  `;
  db.query(query, [appointmentId], (error, results) => {
    if (error)
      return res.status(500).json({ message: "Error fetching prescriptions" });
    res.json(results);
  });
});

// Create new doctor
router.post("/doctors", (req, res) => {
  const { email, password, name, department, contact } = req.body;

  // Validate required fields
  if (!email || !password || !name || !department || !contact) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({
        message: "Database connection failed",
        error: err.message,
      });
    }

    connection.beginTransaction(async (beginError) => {
      if (beginError) {
        connection.release();
        return res.status(500).json({
          message: "Transaction start failed",
          error: beginError.message,
        });
      }

      try {
        // First create user
        const [userResults] = await connection
          .promise()
          .query(
            `INSERT INTO USERS (email, password, role) VALUES (?, ?, 'doctor')`,
            [email, password]
          );

        const userId = userResults.insertId;

        // Then create doctor
        await connection.promise().query(
          `INSERT INTO DOCTORS 
          (user_id, doctor_name, doctor_specialization, doctor_contact) 
          VALUES (?, ?, ?, ?)`,
          [userId, name, department, contact]
        );

        await connection.promise().commit();
        connection.release();

        res.status(201).json({
          message: "Doctor created successfully",
          user_id: userId,
        });
      } catch (error) {
        await connection.promise().rollback();
        connection.release();
        res.status(500).json({
          message: "Operation failed",
          error: error.message,
        });
      }
    });
  });
});

// Create new nurse
router.post("/nurses", (req, res) => {
  const { email, password, name, contact } = req.body;
  // Validate required fields
  if (!email || !password || !name || !contact) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({
        message: "Database connection failed",
        error: err.message,
      });
    }

    connection.beginTransaction(async (beginError) => {
      if (beginError) {
        connection.release();
        return res.status(500).json({
          message: "Transaction start failed",
          error: beginError.message,
        });
      }

      try {
        // First create user
        const [userResults] = await connection
          .promise()
          .query(
            `INSERT INTO USERS (email, password, role) VALUES (?, ?, 'nurse')`,
            [email, password]
          );

        const userId = userResults.insertId;

        // Then create doctor
        await connection.promise().query(
          `INSERT INTO NURSES 
          (user_id, nurse_name, nurse_contact) 
          VALUES (?, ?, ?)`,
          [userId, name, contact]
        );

        await connection.promise().commit();
        connection.release();

        res.status(201).json({
          message: "Nurse created successfully",
          user_id: userId,
        });
      } catch (error) {
        await connection.promise().rollback();
        connection.release();
        res.status(500).json({
          message: "Operation failed",
          error: error.message,
        });
      }
    });
  });
});

module.exports = router;
