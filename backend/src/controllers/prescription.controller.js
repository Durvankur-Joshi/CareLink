const prisma = require('../lib/prisma');

const createPrescription = async (req, res) => {
  try {
    const { appointmentId, notes, items } = req.body;

    if (!appointmentId || typeof appointmentId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid appointment ID is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine is required'
      });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medicineName || typeof item.medicineName !== 'string' || !item.medicineName.trim()) {
        return res.status(400).json({
          success: false,
          message: `Medicine name is required for item ${i + 1}`
        });
      }
      if (!item.dosage || typeof item.dosage !== 'string' || !item.dosage.trim()) {
        return res.status(400).json({
          success: false,
          message: `Dosage is required for item ${i + 1}`
        });
      }
      if (!item.frequency || typeof item.frequency !== 'string' || !item.frequency.trim()) {
        return res.status(400).json({
          success: false,
          message: `Frequency is required for item ${i + 1}`
        });
      }
      if (!item.duration || typeof item.duration !== 'string' || !item.duration.trim()) {
        return res.status(400).json({
          success: false,
          message: `Duration is required for item ${i + 1}`
        });
      }
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
      where: { id: appointmentId },
      include: {
        patient: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to prescribe for this appointment'
      });
    }

    const allowedStatuses = ['IN_CONSULTATION', 'COMPLETED'];
    if (!allowedStatuses.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Prescription cannot be created for appointment with status: ${appointment.status}`
      });
    }

    const existingPrescription = await prisma.prescription.findUnique({
      where: { appointmentId }
    });

    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message: 'Prescription already exists for this appointment'
      });
    }

    const prescription = await prisma.$transaction(async (tx) => {
      return tx.prescription.create({
        data: {
          patientId: appointment.patientId,
          doctorId: doctor.id,
          appointmentId,
          notes: notes && typeof notes === 'string' ? notes.trim() : null,
          items: {
            create: items.map((item) => ({
              medicineName: item.medicineName.trim(),
              dosage: item.dosage.trim(),
              frequency: item.frequency.trim(),
              duration: item.duration.trim(),
              instructions: item.instructions && typeof item.instructions === 'string' ? item.instructions.trim() : null
            }))
          }
        },
        include: {
          items: true,
          doctor: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          patient: {
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
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: {
        prescription: {
          id: prescription.id,
          appointmentId: prescription.appointmentId,
          notes: prescription.notes,
          createdAt: prescription.createdAt,
          doctor: {
            name: prescription.doctor.user.name,
            specialization: prescription.doctor.specialization
          },
          patient: {
            name: prescription.patient.user.name
          },
          items: prescription.items.map((item) => ({
            id: item.id,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions
          }))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create prescription'
    });
  }
};

const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
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
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            reason: true,
            status: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const isPatient = prescription.patient.userId === req.user.id;
    const isDoctor = prescription.doctor.userId === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        prescription: {
          id: prescription.id,
          appointmentId: prescription.appointmentId,
          notes: prescription.notes,
          createdAt: prescription.createdAt,
          doctor: {
            name: prescription.doctor.user.name,
            specialization: prescription.doctor.specialization
          },
          patient: {
            name: prescription.patient.user.name
          },
          appointment: prescription.appointment,
          items: prescription.items.map((item) => ({
            id: item.id,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions
          }))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescription'
    });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id }
    });

    if (!patient) {
      return res.status(200).json({
        success: true,
        data: {
          prescriptions: []
        }
      });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        items: true,
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
            reason: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = prescriptions.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId,
      notes: p.notes,
      createdAt: p.createdAt,
      doctor: {
        name: p.doctor.user.name,
        specialization: p.doctor.specialization
      },
      appointment: p.appointment,
      medicineCount: p.items.length,
      items: p.items.map((item) => ({
        id: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions
      }))
    }));

    return res.status(200).json({
      success: true,
      data: {
        prescriptions: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptions'
    });
  }
};

const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const isOwnPatient = patient.userId === req.user.id;

    let isAuthorizedDoctor = false;
    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id }
      });

      if (doctor) {
        const hasRelationship = await prisma.appointment.findFirst({
          where: {
            doctorId: doctor.id,
            patientId: patientId
          }
        });

        if (hasRelationship) {
          isAuthorizedDoctor = true;
        }
      }
    }

    if (!isOwnPatient && !isAuthorizedDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        items: true,
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
            reason: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = prescriptions.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId,
      notes: p.notes,
      createdAt: p.createdAt,
      doctor: {
        name: p.doctor.user.name,
        specialization: p.doctor.specialization
      },
      appointment: p.appointment,
      medicineCount: p.items.length,
      items: p.items.map((item) => ({
        id: item.id,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions
      }))
    }));

    return res.status(200).json({
      success: true,
      data: {
        prescriptions: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient prescriptions'
    });
  }
};

const getAppointmentPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: { id: true }
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

    const isPatient = appointment.patient.userId === req.user.id;
    const isDoctor = appointment.doctor.userId === req.user.id;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { appointmentId },
      include: {
        items: true,
        doctor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        patient: {
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

    if (!prescription) {
      return res.status(200).json({
        success: true,
        data: {
          prescription: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        prescription: {
          id: prescription.id,
          appointmentId: prescription.appointmentId,
          notes: prescription.notes,
          createdAt: prescription.createdAt,
          doctor: {
            name: prescription.doctor.user.name,
            specialization: prescription.doctor.specialization
          },
          patient: {
            name: prescription.patient.user.name
          },
          items: prescription.items.map((item) => ({
            id: item.id,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions
          }))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment prescription'
    });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  getMyPrescriptions,
  getPatientPrescriptions,
  getAppointmentPrescription
};
