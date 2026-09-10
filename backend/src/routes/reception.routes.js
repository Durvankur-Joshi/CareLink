const express = require('express');
const {
  getTodayAppointments,
  checkInAppointment,
  addToQueue,
  getQueue,
  getReceptionAppointmentById
} = require('../controllers/reception.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles('RECEPTION'));

router.get('/appointments/today', getTodayAppointments);
router.patch('/appointments/:id/check-in', checkInAppointment);
router.patch('/appointments/:id/queue', addToQueue);
router.get('/queue', getQueue);
router.get('/appointments/:id', getReceptionAppointmentById);

module.exports = router;
