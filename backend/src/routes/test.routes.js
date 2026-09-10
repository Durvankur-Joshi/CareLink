const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/protected', authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authenticated route accessed successfully',
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

router.get('/doctor', authMiddleware, authorizeRoles('DOCTOR'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Doctor route accessed successfully',
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

module.exports = router;
