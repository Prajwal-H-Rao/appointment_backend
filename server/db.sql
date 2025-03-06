DROP DATABASE IF EXISTS appointment_db;
CREATE DATABASE appointment_db;
USE appointment_db;

CREATE TABLE USERS(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('doctor', 'nurse', 'admin') NOT NULL
);

CREATE TABLE DOCTORS(
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_name VARCHAR(50) NOT NULL,
    doctor_specialization VARCHAR(50) NOT NULL,
    doctor_contact VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE NURSES(
    nurse_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nurse_name VARCHAR(50) NOT NULL,
    nurse_contact VARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE APPOINTMENTS(
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(20),
    patient_contact VARCHAR(10) NOT NULL,
    doctor_id INT,
    nurse_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    gender CHAR(1) NOT NULL,
    age INT NOT NULL,
    critical ENUM('high', 'mid', 'low'),
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    payment_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_type ENUM('cash', 'card', 'upi') DEFAULT 'cash',
    appointment_status ENUM('approved', 'completed') DEFAULT 'approved'
);

CREATE TABLE APPOINTMENT_REQUESTS(
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    contact VARCHAR(10) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    gender CHAR(1) NOT NULL,
    age INT NOT NULL,
    department VARCHAR(50) NOT NULL,
    request_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE PRESCRIPTIONS(
    prescription_id INT AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    doctor_id INT,
    medicine_name VARCHAR(20) NOT NULL,
    medicine_dosage VARCHAR(30) NOT NULL,
    PRIMARY KEY (prescription_id, appointment_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENTS(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id) ON DELETE SET NULL
);

CREATE TABLE contact_messages(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Populate with data
INSERT INTO USERS(email, password, role) VALUES
('admin@hospital.com', 'adminpassword', 'admin'),
('doctor1@hospital.com', 'doctor1password', 'doctor'),
('doctor2@hospital.com', 'doctor2password', 'doctor'),
('doctor3@hospital.com', 'doctor3password', 'doctor'),
('doctor4@hospital.com', 'doctor4password', 'doctor'),
('doctor5@hospital.com', 'doctor5password', 'doctor'),
('nurse1@hospital.com', 'nurse1password', 'nurse'),
('nurse2@hospital.com', 'nurse2password', 'nurse');

INSERT INTO DOCTORS(user_id, doctor_name, doctor_specialization, doctor_contact) VALUES
(2, 'Alice Johnson', 'Cardiology', '9876543210'),
(3, 'Michael Brown', 'Neurology', '9876543211'),
(4, 'Sarah Wilson', 'Pediatrics', '9876543212'),
(5, 'Robert Davis', 'Orthopedics', '9876543213'),
(6, 'Emily Taylor', 'General-Medicine', '9876543214');

INSERT INTO NURSES(user_id, nurse_name, nurse_contact) VALUES
(7, 'Nurse Mary Smith', '9876543220'),
(8, 'Nurse David Wilson', '9876543221');