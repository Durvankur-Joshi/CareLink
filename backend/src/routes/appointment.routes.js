const express = require('express');
const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getDoctorQueue,
  getAppointmentById
} = require('../controllers/appointment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('PATIENT'), bookAppointment);
router.get('/my', authMiddleware, authorizeRoles('PATIENT'), getPatientAppointments);
router.get('/doctor', authMiddleware, authorizeRoles('DOCTOR'), getDoctorAppointments);
router.get('/doctor/queue', authMiddleware, authorizeRoles('DOCTOR'), getDoctorQueue);
router.get('/:id', authMiddleware, authorizeRoles('PATIENT', 'DOCTOR'), getAppointmentById);

module.exports = router;
