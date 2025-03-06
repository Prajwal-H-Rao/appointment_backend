require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;

const db = require("./database/db");
const authRouter = require("./routes/Auth/login");
const appointmentRouter = require("./routes/Home/Appointment_Page/appointment");
const nurseRouter = require("./routes/Home/Nurse_Dashboard/nurse");
const doctorRoute = require("./routes/Home/Doctor_dashboard/doctor");
const adminRouter = require("./routes/Admin/admin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", authRouter);
app.use("/admin", adminRouter);
app.use("/appointment", appointmentRouter);
app.use("/manage", nurseRouter);
app.use("/treat", doctorRoute);

app.post("/contact", (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate input
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Insert into database
  const query =
    "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, subject, message], (error, results) => {
    if (error) {
      console.error("Error inserting data: ", error);
      return res.status(500).json({ message: "Failed to send message." });
    }
    res.status(201).json({ message: "Message sent successfully!" });
  });
});

db.query("SELECT 1", (err) => {
  if (err) {
    console.log("Error connecting to the database");
    return;
  }
  app.listen(port, () => {
    console.log(`The server is running on port:${port}`);
  });
});
