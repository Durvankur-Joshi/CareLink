const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { uploadReportMiddleware } = require('../middleware/upload.middleware');
const {
  createLabOrder,
  getMyLabOrders,
  getPatientLabOrders,
  getAppointmentLabOrders,
  getLabOrderById,
  uploadReport,
  getReportById,
  getPatientReports,
  getReportFile,
  reviewReport
} = require('../controllers/lab.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/orders', authorizeRoles('DOCTOR'), createLabOrder);
router.get('/orders/my', authorizeRoles('PATIENT'), getMyLabOrders);
router.get('/orders/patient/:patientId', authorizeRoles('DOCTOR'), getPatientLabOrders);
router.get('/orders/appointment/:appointmentId', authorizeRoles('DOCTOR', 'PATIENT'), getAppointmentLabOrders);
router.get('/orders/:id', authorizeRoles('DOCTOR', 'PATIENT'), getLabOrderById);

router.post('/orders/:id/report', authorizeRoles('DOCTOR'), uploadReportMiddleware, uploadReport);

router.get('/reports/patient/:patientId', authorizeRoles('DOCTOR', 'PATIENT'), getPatientReports);
router.get('/reports/:id', authorizeRoles('DOCTOR', 'PATIENT'), getReportById);
router.get('/reports/:id/file', authorizeRoles('DOCTOR', 'PATIENT'), getReportFile);
router.patch('/reports/:id/review', authorizeRoles('DOCTOR'), reviewReport);

module.exports = router;
