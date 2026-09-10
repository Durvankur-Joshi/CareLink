const express = require('express');
const {
  createPrescription,
  getPrescriptionById,
  getMyPrescriptions,
  getPatientPrescriptions,
  getAppointmentPrescription
} = require('../controllers/prescription.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', authMiddleware, authorizeRoles('DOCTOR'), createPrescription);
router.get('/my', authMiddleware, authorizeRoles('PATIENT'), getMyPrescriptions);
router.get('/patient/:patientId', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getPatientPrescriptions);
router.get('/appointment/:appointmentId', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getAppointmentPrescription);
router.get('/:id', authMiddleware, authorizeRoles('DOCTOR', 'PATIENT'), getPrescriptionById);

module.exports = router;
