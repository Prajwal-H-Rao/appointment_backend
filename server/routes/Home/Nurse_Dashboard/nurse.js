const express = require("express");
const db = require("../../../database/db.js");

const router = express.Router();

// Get all appointment requests
router.get("/nurse/:nurseId", async (req, res) => {
  try {
    const { nurseId } = req.params;

    const query = `
      SELECT 
        appointment_id,
        patient_name,
        patient_contact,
        appointment_date,
        appointment_time,
        gender,
        age,
        critical,
        payment_status,
        payment_amount,
        payment_type,
        appointment_status
      FROM APPOINTMENTS
      WHERE nurse_id = ? AND appointment_status='approved' OR payment_status='pending'
      ORDER BY appointment_date DESC, appointment_time DESC
    `;

    db.query(query, [nurseId], (err, results) => {
      if (err) {
        console.error("Error fetching nurse appointments:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch appointments",
        });
      }

      // Format dates to ISO string
      const formattedResults = results.map((appointment) => ({
        ...appointment,
        appointment_date: new Date(appointment.appointment_date).toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: formattedResults,
      });
    });
  } catch (error) {
    console.error("Error in nurse appointments route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// (MAY NEED TO HANDLE EMPTY APPOINTMENT REQUESTS LATER)
router.get("/requests", (req, res) => {
  const query =
    "SELECT * FROM APPOINTMENT_REQUESTS WHERE request_status = 'pending'";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching appointment requests:", err);
      return res.status(500).json({
        message: "Failed to fetch requests",
        error: err.message, // Include error details for debugging
      });
    }

    // Ensure we always return an array, even for empty results
    const safeResults = Array.isArray(results) ? results : [];

    res.status(200).json(safeResults);
  });
});

router.get("/doctors", (req, res) => {
  const query = `
    SELECT 
      doctor_id,
      doctor_name AS name,
      doctor_specialization AS department,
      doctor_specialization AS specialization,
      doctor_contact AS contact
    FROM DOCTORS
    ORDER BY doctor_specialization, doctor_name
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching doctors:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch doctors list",
      });
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  });
});
// Insert data into APPOINTMENTS table
router.post("/appointments", (req, res) => {
  const {
    patient_name,
    patient_contact,
    doctor_id,
    nurse_id,
    appointment_date,
    appointment_time,
    gender,
    age,
    critical,
    request_id,
  } = req.body;

  // Format appointment_date to 'YYYY-MM-DD' for MySQL
  const formattedDate = new Date(appointment_date).toISOString().split("T")[0];

  const query = `INSERT INTO APPOINTMENTS (
    patient_name, patient_contact, doctor_id, nurse_id, 
    appointment_date, appointment_time, gender, age, critical
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    patient_name,
    patient_contact,
    doctor_id,
    nurse_id,
    formattedDate,
    appointment_time,
    gender,
    age,
    critical,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error inserting into appointments:", err);
      return res.status(500).json({ message: "Failed to book appointment" });
    }

    // Update request status to 'approved'
    const updateQuery =
      "UPDATE APPOINTMENT_REQUESTS SET request_status = 'approved' WHERE request_id = ?";
    db.query(updateQuery, [request_id], (updateErr) => {
      if (updateErr) {
        console.error("Error updating request status:", updateErr);
        return res.status(500).json({
          message: "Appointment booked but failed to update request status",
        });
      }

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment_id: result.insertId,
      });
    });
  });
});

// Add to your existing router
router.get("/nurse/:nurseId", (req, res) => {
  // Authentication middleware (you might already have this)
  const nurseId = req.params.nurseId;

  // Verify the nurse is accessing their own appointments
  if (req.user.role !== "nurse" || req.user.nurseId !== nurseId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized access to appointments",
    });
  }

  const query = `
    SELECT 
      appointment_id,
      patient_name,
      patient_contact,
      appointment_date,
      appointment_time,
      gender,
      age,
      critical,
      payment_status,
      payment_amount,
      payment_type,
      appointment_status
    FROM APPOINTMENTS
    WHERE nurse_id = ?
    ORDER BY appointment_date DESC, appointment_time DESC
  `;

  db.query(query, [nurseId], (err, results) => {
    if (err) {
      console.error("Error fetching nurse appointments:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch appointments",
      });
    }

    // Format dates to ISO string
    const formattedResults = results.map((appointment) => ({
      ...appointment,
      appointment_date: new Date(appointment.appointment_date).toISOString(),
    }));

    res.status(200).json({
      success: true,
      data: formattedResults,
    });
  });
});

// Update payment status, amount, and payment method
router.put("/appointments/payment", (req, res) => {
  const { appointment_id, payment_status, amount, payment_method } = req.body;
  const query = `UPDATE APPOINTMENTS SET payment_status = ?, payment_amount = ?, payment_type = ? WHERE appointment_id = ?`;

  db.query(
    query,
    [payment_status, amount, payment_method, appointment_id],
    (err, result) => {
      if (err) {
        console.error("Error updating payment status:", err);
        return res
          .status(500)
          .json({ message: "Failed to update payment status" });
      }

      res.status(200).json({
        message: "Payment status updated successfully",
        affectedRows: result.affectedRows,
      });
    }
  );
});

module.exports = router;
