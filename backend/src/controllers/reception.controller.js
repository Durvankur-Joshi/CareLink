const prisma = require('../lib/prisma');

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const getTodayAppointments = async (req, res) => {
  try {
    const todayStr = getTodayDateString();

    const appointments = await prisma.appointment.findMany({
      where: { appointmentDate: todayStr },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { appointmentTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const formatted = appointments.map((apt) => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient.user.name,
      doctorId: apt.doctorId,
      doctorName: apt.doctor.user.name,
      doctorSpecialization: apt.doctor.specialization,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      reason: apt.reason,
      status: apt.status
    }));

    return res.status(200).json({
      success: true,
      data: {
        appointments: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve today\'s appointments'
    });
  }
};

const checkInAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const todayStr = getTodayDateString();

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.appointmentDate !== todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in appointment not scheduled for today'
      });
    }

    if (appointment.status !== 'BOOKED') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status transition'
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        appointmentTime: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient checked in successfully',
      data: {
        appointment: updated
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check in appointment'
    });
  }
};

const addToQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const todayStr = getTodayDateString();

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.appointmentDate !== todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Appointment is not scheduled for today'
      });
    }

    if (appointment.status !== 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status transition'
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'IN_QUEUE' },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        appointmentTime: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient added to queue successfully',
      data: {
        appointment: updated
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add appointment to queue'
    });
  }
};

const getQueue = async (req, res) => {
  try {
    const todayStr = getTodayDateString();

    const queuedAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: todayStr,
        status: 'IN_QUEUE'
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { appointmentTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const queue = queuedAppointments.map((apt, index) => ({
      position: index + 1,
      appointmentId: apt.id,
      patient: {
        id: apt.patientId,
        name: apt.patient.user.name
      },
      doctor: {
        id: apt.doctorId,
        name: apt.doctor.user.name
      },
      appointmentTime: apt.appointmentTime,
      reason: apt.reason,
      status: apt.status
    }));

    return res.status(200).json({
      success: true,
      data: {
        queue
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reception queue'
    });
  }
};

const getReceptionAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          reason: appointment.reason,
          status: appointment.status,
          patient: {
            id: appointment.patientId,
            name: appointment.patient.user.name
          },
          doctor: {
            id: appointment.doctorId,
            name: appointment.doctor.user.name,
            specialization: appointment.doctor.specialization
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment'
    });
  }
};

module.exports = {
  getTodayAppointments,
  checkInAppointment,
  addToQueue,
  getQueue,
  getReceptionAppointmentById
};
