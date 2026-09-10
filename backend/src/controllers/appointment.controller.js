const prisma = require('../lib/prisma');

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (!doctorId || typeof doctorId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid doctor ID is required'
      });
    }

    if (!appointmentDate || typeof appointmentDate !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid appointment date is required'
      });
    }

    if (!appointmentTime || typeof appointmentTime !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid appointment time is required'
      });
    }

    const todayStr = getTodayDateString();
    if (appointmentDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    let patient = await prisma.patient.findUnique({
      where: { userId: req.user.id }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: { userId: req.user.id }
      });
    }

    const existingConflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: {
          in: ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION']
        }
      }
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: 'This appointment slot is already booked'
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate,
        appointmentTime,
        reason: reason && typeof reason === 'string' ? reason.trim() : null,
        status: 'BOOKED'
      },
      include: {
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

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment: {
          id: appointment.id,
          doctorId: appointment.doctorId,
          doctorName: appointment.doctor.user.name,
          specialization: appointment.doctor.specialization,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          reason: appointment.reason,
          status: appointment.status,
          createdAt: appointment.createdAt
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment'
    });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const todayStr = getTodayDateString();

    let patient = await prisma.patient.findUnique({
      where: { userId: req.user.id }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: { userId: req.user.id }
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    const activeDoctorIds = [
      ...new Set(
        appointments
          .filter((a) => a.appointmentDate === todayStr && a.status === 'IN_QUEUE')
          .map((a) => a.doctorId)
      )
    ];

    let doctorQueues = {};
    if (activeDoctorIds.length > 0) {
      const queuedApts = await prisma.appointment.findMany({
        where: {
          doctorId: { in: activeDoctorIds },
          appointmentDate: todayStr,
          status: 'IN_QUEUE'
        },
        orderBy: [
          { appointmentTime: 'asc' },
          { createdAt: 'asc' }
        ],
        select: {
          id: true,
          doctorId: true
        }
      });

      for (const apt of queuedApts) {
        if (!doctorQueues[apt.doctorId]) {
          doctorQueues[apt.doctorId] = [];
        }
        doctorQueues[apt.doctorId].push(apt.id);
      }
    }

    const formatted = appointments.map((apt) => {
      let queuePosition = null;
      if (apt.appointmentDate === todayStr && apt.status === 'IN_QUEUE') {
        const queueList = doctorQueues[apt.doctorId] || [];
        const index = queueList.indexOf(apt.id);
        if (index !== -1) {
          queuePosition = index + 1;
        }
      }

      return {
        id: apt.id,
        doctorId: apt.doctorId,
        doctorName: apt.doctor.user.name,
        specialization: apt.doctor.specialization,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        reason: apt.reason,
        status: apt.status,
        queuePosition,
        createdAt: apt.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        appointments: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments'
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    const formatted = appointments.map((apt) => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: apt.patient.user.name,
      patientEmail: apt.patient.user.email,
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      reason: apt.reason,
      status: apt.status,
      createdAt: apt.createdAt
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
      message: 'Failed to retrieve doctor appointments'
    });
  }
};

const getDoctorQueue = async (req, res) => {
  try {
    const todayStr = getTodayDateString();

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const queuedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
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
      patientId: apt.patientId,
      patientName: apt.patient.user.name,
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
      message: 'Failed to retrieve doctor queue'
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
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

    const isPatientOwner = appointment.patient.userId === req.user.id;
    const isDoctorAssigned = appointment.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorAssigned) {
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
          createdAt: appointment.createdAt,
          patient: {
            id: appointment.patient.id,
            name: appointment.patient.user.name,
            email: appointment.patient.user.email
          },
          doctor: {
            id: appointment.doctor.id,
            name: appointment.doctor.user.name,
            specialization: appointment.doctor.specialization,
            qualification: appointment.doctor.qualification,
            consultationFee: appointment.doctor.consultationFee
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment details'
    });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getDoctorQueue,
  getAppointmentById
};
