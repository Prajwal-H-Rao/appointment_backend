const express = require("express");
const db = require("../../../database/db.js");

const router = express.Router();

router.get(
  "/appointments/:patient_name/:patient_number/:appointment_id",
  (req, res) => {
    const { patient_name, patient_number, appointment_id } = req.params;
    const query = `
      SELECT 
        p.prescription_id,
        p.medicine_name,
        p.medicine_dosage,
        d.doctor_name,
        a.appointment_id,
        a.appointment_date
      FROM PRESCRIPTIONS p
      JOIN APPOINTMENTS a ON p.appointment_id = a.appointment_id
      JOIN DOCTORS d ON p.doctor_id = d.doctor_id
      WHERE a.appointment_id IN (
        SELECT appointment_id
        FROM APPOINTMENTS
        WHERE patient_name = ?
          AND patient_contact = ?
          AND appointment_id != ?
      )
      ORDER BY a.appointment_id DESC`;

    db.query(
      query,
      [patient_name, patient_number, appointment_id],
      (err, results) => {
        if (err) {
          console.error("Error fetching past appointments", err);
          return res
            .status(500)
            .json({ message: "Failed to fetch past appointments" });
        }

        // Group by appointment_id while preserving order
        const grouped = {};
        let currentAppointment = null;

        results.forEach((row) => {
          if (!grouped[row.appointment_id]) {
            grouped[row.appointment_id] = {
              appointment_id: row.appointment_id,
              doctor_name: row.doctor_name,
              appointment_date: row.appointment_date,
              prescriptions: [],
            };
            currentAppointment = grouped[row.appointment_id];
          }

          currentAppointment.prescriptions.push({
            prescription_id: row.prescription_id,
            medicine_name: row.medicine_name,
            medicine_dosage: row.medicine_dosage,
          });
        });

        res.status(200).json(Object.values(grouped));
      }
    );
  }
);
// Get all appointments for a doctor
router.get("/appointments/:user_id", (req, res) => {
  const { user_id } = req.params;
  const query =
    "SELECT * FROM APPOINTMENTS WHERE doctor_id IN ( SELECT doctor_id from DOCTORS WHERE user_id=?) AND appointment_status='approved'";

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching doctor appointments:", err);
      return res.status(500).json({ message: "Failed to fetch appointments" });
    }
    res.status(200).json(results);
  });
});

// Add multiple medicines to a prescription
router.post("/prescriptions", (req, res) => {
  const { appointment_id, user_id, medicines } = req.body;

  // Validate medicines array
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res
      .status(400)
      .json({ message: "Medicines must be a non-empty array" });
  }

  // First get doctor_id from doctors table using user_id
  db.query(
    "SELECT doctor_id FROM DOCTORS WHERE user_id = ?",
    [user_id],
    (err, doctorResults) => {
      if (err) {
        console.error("Error fetching doctor:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (doctorResults.length === 0) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const doctor_id = doctorResults[0].doctor_id;

      // Prepare prescriptions data
      const values = medicines.map((med) => [
        appointment_id,
        doctor_id, // Use fetched doctor_id
        med.medicine_name,
        med.medicine_dosage,
      ]);

      // Insert prescriptions
      const query = `
        INSERT INTO PRESCRIPTIONS (appointment_id, doctor_id, medicine_name, medicine_dosage)
        VALUES ?
      `;

      db.query(query, [values], (err, result) => {
        if (err) {
          console.error("Error adding prescriptions:", err);
          return res
            .status(500)
            .json({ message: "Failed to add prescriptions" });
        }

        res.status(201).json({
          message: "Prescriptions added successfully",
          affectedRows: result.affectedRows,
        });
      });
    }
  );
});

// Delete appointment request using appointment_id
router.delete("/requests/appointment/:appointment_id", (req, res) => {
  const { appointment_id } = req.params;
  const query = `
     DELETE FROM APPOINTMENT_REQUESTS WHERE (name,contact) in (select patient_name,patient_contact from APPOINTMENTS where appointment_id=?)
  `;
  const updateQuery = `UPDATE APPOINTMENTS
    SET appointment_status = 'completed'
    WHERE (patient_name, patient_contact) IN (
    SELECT patient_name, patient_contact
    FROM (SELECT * FROM APPOINTMENTS) AS temp
    WHERE appointment_id = ?
    )`;

  db.query(query, [appointment_id], (err, result) => {
    if (err) {
      console.error("Error deleting appointment request:", err);
      return res
        .status(500)
        .json({ message: "Failed to delete appointment request" });
    }
    db.query(updateQuery, [appointment_id], (err) => {
      if (err) {
        console.error("Error updating appointment request:", err);
        return res
          .status(500)
          .json({ message: "Failed to update appointment status" });
      }
      res.status(200).json({
        message: "Appointment request deleted successfully",
        affectedRows: result.affectedRows,
      });
    });
  });
});

module.exports = router;
