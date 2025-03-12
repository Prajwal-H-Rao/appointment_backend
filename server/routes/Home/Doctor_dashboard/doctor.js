const express = require("express");
const db = require("../../../database/db.js");

const router = express.Router();

router.get(
  "/appointments/:patient_name/:patient_number/:appointment_id",
  (req, res) => {
    // console.log(req.params);
    const { patient_name, patient_number, appointment_id } = req.params;
    const query = `
    SELECT p.*, d.doctor_name
FROM PRESCRIPTIONS p
JOIN APPOINTMENTS a ON p.appointment_id = a.appointment_id
JOIN DOCTORS d ON p.doctor_id = d.doctor_id
WHERE a.appointment_id = (
    SELECT appointment_id
    FROM APPOINTMENTS
    WHERE patient_name = ?
      AND patient_contact = ?
      AND appointment_id !=?
    ORDER BY appointment_id DESC
    LIMIT 1
)`;
    db.query(
      query,
      [patient_name, patient_number, appointment_id],
      (err, results) => {
        if (err) {
          console.error("Error fetching past appointments", err);
          res
            .status(500)
            .json({ message: "Failed to fetch past appointments" });
        }
        res.status(200).json(results);
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
  const { appointment_id, doctor_id, medicines } = req.body; // medicines should be an array of { medicine_name, medicine_dosage }

  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res
      .status(400)
      .json({ message: "Medicines must be a non-empty array" });
  }

  const values = medicines.map((med) => [
    appointment_id,
    doctor_id,
    med.medicine_name,
    med.medicine_dosage,
  ]);
  const query = `
    INSERT INTO PRESCRIPTIONS (appointment_id, doctor_id, medicine_name, medicine_dosage)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error adding prescriptions:", err);
      return res.status(500).json({ message: "Failed to add prescriptions" });
    }

    res.status(201).json({
      message: "Prescriptions added successfully",
      affectedRows: result.affectedRows,
    });
  });
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
