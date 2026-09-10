const express = require('express');
const { getDoctors, getDoctorById } = require('../controllers/doctor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', authMiddleware, authorizeRoles('PATIENT', 'DOCTOR'), getDoctors);
router.get('/:id', authMiddleware, authorizeRoles('PATIENT', 'DOCTOR'), getDoctorById);

module.exports = router;
