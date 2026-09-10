const prisma = require('../lib/prisma');

const createConsultation = async (req, res) => {
  try {
    const { appointmentId, symptoms, notes, diagnosis, treatmentNotes } = req.body;

    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid appointment ID is required'
      });
    }

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required'
      });
    }

    if (!notes || typeof notes !== 'string' || !notes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Consultation notes are required'
      });
    }

    if (!diagnosis || typeof diagnosis !== 'string' || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis is required'
      });
    }

    if (!treatmentNotes || typeof treatmentNotes !== 'string' || !treatmentNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Treatment notes are required'
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'IN_CONSULTATION') {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status transition'
      });
    }

    const existingConsultation = await prisma.consultation.findUnique({
      where: { appointmentId }
    });

    if (existingConsultation) {
      return res.status(409).json({
        success: false,
        message: 'Consultation already exists for this appointment'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.consultation.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: doctor.id,
          symptoms: symptoms.trim(),
          notes: notes.trim(),
          diagnosis: diagnosis.trim(),
          treatmentNotes: treatmentNotes.trim()
        }
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' }
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Consultation saved and appointment completed successfully',
      data: {
        consultation: result
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create consultation'
    });
  }
};

const getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
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
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true
          }
        }
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    const isPatientOwner = consultation.patient.userId === req.user.id;
    const isDoctorCreator = consultation.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorCreator) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        consultation: {
          id: consultation.id,
          appointmentId: consultation.appointmentId,
          symptoms: consultation.symptoms,
          notes: consultation.notes,
          diagnosis: consultation.diagnosis,
          treatmentNotes: consultation.treatmentNotes,
          createdAt: consultation.createdAt,
          patient: {
            id: consultation.patient.id,
            name: consultation.patient.user.name
          },
          doctor: {
            id: consultation.doctor.id,
            name: consultation.doctor.user.name,
            specialization: consultation.doctor.specialization
          },
          appointment: consultation.appointment
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultation'
    });
  }
};

const getPatientConsultationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (req.user.role === 'PATIENT' && patient.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            appointmentTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = consultations.map((c) => ({
      id: c.id,
      consultationDate: c.createdAt,
      appointmentDate: c.appointment.appointmentDate,
      appointmentTime: c.appointment.appointmentTime,
      doctorName: c.doctor.user.name,
      specialization: c.doctor.specialization,
      symptoms: c.symptoms,
      notes: c.notes,
      diagnosis: c.diagnosis,
      treatmentNotes: c.treatmentNotes
    }));

    return res.status(200).json({
      success: true,
      data: {
        consultations: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultation history'
    });
  }
};

const getConsultationByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { appointmentId },
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
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true
          }
        }
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found for this appointment'
      });
    }

    const isPatientOwner = consultation.patient.userId === req.user.id;
    const isDoctorCreator = consultation.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorCreator) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        consultation: {
          id: consultation.id,
          appointmentId: consultation.appointmentId,
          symptoms: consultation.symptoms,
          notes: consultation.notes,
          diagnosis: consultation.diagnosis,
          treatmentNotes: consultation.treatmentNotes,
          createdAt: consultation.createdAt,
          patient: {
            id: consultation.patient.id,
            name: consultation.patient.user.name
          },
          doctor: {
            id: consultation.doctor.id,
            name: consultation.doctor.user.name,
            specialization: consultation.doctor.specialization
          },
          appointment: consultation.appointment
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve consultation'
    });
  }
};

module.exports = {
  createConsultation,
  getConsultationById,
  getPatientConsultationHistory,
  getConsultationByAppointmentId
};
