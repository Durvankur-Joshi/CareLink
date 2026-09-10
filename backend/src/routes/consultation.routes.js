const express = require('express');
const {
  createConsultation,
  getConsultationById,
  getPatientConsultationHistory,
  getConsultationByAppointmentId
} = require('../controllers/consultation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('DOCTOR'), createConsultation);
router.get('/:id', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getConsultationById);
router.get('/patient/:patientId', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getPatientConsultationHistory);
router.get('/appointment/:appointmentId', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getConsultationByAppointmentId);

module.exports = router;
