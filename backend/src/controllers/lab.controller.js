const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');

const createLabOrder = async (req, res) => {
  try {
    const { patientId, appointmentId, testName, instructions } = req.body;

    if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid patient ID is required'
      });
    }

    if (!appointmentId || typeof appointmentId !== 'string' || !appointmentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid appointment ID is required'
      });
    }

    if (!testName || typeof testName !== 'string' || !testName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Test name is required'
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

    const patient = await prisma.patient.findUnique({
      where: { id: patientId.trim() }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId.trim() }
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
        message: 'You are not authorized to order lab tests for this appointment'
      });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(400).json({
        success: false,
        message: 'Appointment does not belong to the specified patient'
      });
    }

    const labOrder = await prisma.labOrder.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appointment.id,
        testName: testName.trim(),
        instructions: instructions && typeof instructions === 'string' ? instructions.trim() : null,
        status: 'ORDERED'
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
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      data: {
        labOrder: {
          id: labOrder.id,
          patientId: labOrder.patientId,
          doctorId: labOrder.doctorId,
          doctorName: labOrder.doctor.user.name,
          specialization: labOrder.doctor.specialization,
          appointmentId: labOrder.appointmentId,
          appointmentDate: labOrder.appointment.appointmentDate,
          appointmentTime: labOrder.appointment.appointmentTime,
          testName: labOrder.testName,
          instructions: labOrder.instructions,
          status: labOrder.status,
          createdAt: labOrder.createdAt
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create lab order'
    });
  }
};

const getMyLabOrders = async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const labOrders = await prisma.labOrder.findMany({
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
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true
          }
        },
        report: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            reviewedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = labOrders.map((order) => ({
      id: order.id,
      patientId: order.patientId,
      doctorId: order.doctorId,
      doctorName: order.doctor.user.name,
      specialization: order.doctor.specialization,
      appointmentId: order.appointmentId,
      appointmentDate: order.appointment.appointmentDate,
      appointmentTime: order.appointment.appointmentTime,
      testName: order.testName,
      instructions: order.instructions,
      status: order.status,
      createdAt: order.createdAt,
      report: order.report || null
    }));

    return res.status(200).json({
      success: true,
      data: {
        labOrders: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve lab orders'
    });
  }
};

const getPatientLabOrders = async (req, res) => {
  try {
    const { patientId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        patientId
      }
    });

    if (!hasAppointment) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view lab orders for this patient'
      });
    }

    const labOrders = await prisma.labOrder.findMany({
      where: {
        patientId,
        doctorId: doctor.id
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true
          }
        },
        report: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            reviewedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = labOrders.map((order) => ({
      id: order.id,
      patientId: order.patientId,
      doctorId: order.doctorId,
      appointmentId: order.appointmentId,
      appointmentDate: order.appointment.appointmentDate,
      appointmentTime: order.appointment.appointmentTime,
      testName: order.testName,
      instructions: order.instructions,
      status: order.status,
      createdAt: order.createdAt,
      report: order.report || null
    }));

    return res.status(200).json({
      success: true,
      data: {
        labOrders: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient lab orders'
    });
  }
};

const getAppointmentLabOrders = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true
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
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view lab orders for this appointment'
      });
    }

    const labOrders = await prisma.labOrder.findMany({
      where: { appointmentId },
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
        report: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            reviewedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formatted = labOrders.map((order) => ({
      id: order.id,
      patientId: order.patientId,
      doctorId: order.doctorId,
      doctorName: order.doctor.user.name,
      specialization: order.doctor.specialization,
      appointmentId: order.appointmentId,
      testName: order.testName,
      instructions: order.instructions,
      status: order.status,
      createdAt: order.createdAt,
      report: order.report || null
    }));

    return res.status(200).json({
      success: true,
      data: {
        labOrders: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment lab orders'
    });
  }
};

const getLabOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const labOrder = await prisma.labOrder.findUnique({
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
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true
          }
        },
        report: true
      }
    });

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }

    const isPatientOwner = labOrder.patient.userId === req.user.id;
    const isDoctorAssigned = labOrder.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this lab order'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        labOrder: {
          id: labOrder.id,
          testName: labOrder.testName,
          instructions: labOrder.instructions,
          status: labOrder.status,
          createdAt: labOrder.createdAt,
          patient: {
            id: labOrder.patient.id,
            name: labOrder.patient.user.name,
            email: labOrder.patient.user.email
          },
          doctor: {
            id: labOrder.doctor.id,
            name: labOrder.doctor.user.name,
            specialization: labOrder.doctor.specialization
          },
          appointment: labOrder.appointment,
          report: labOrder.report
            ? {
                id: labOrder.report.id,
                fileName: labOrder.report.fileName,
                fileType: labOrder.report.fileType,
                fileSize: labOrder.report.fileSize,
                uploadedAt: labOrder.report.uploadedAt,
                reviewedAt: labOrder.report.reviewedAt
              }
            : null
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve lab order'
    });
  }
};

const uploadReport = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const labOrder = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        report: true
      }
    });

    if (!labOrder) {
      return res.status(404).json({
        success: false,
        message: 'Lab order not found'
      });
    }

    if (labOrder.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload reports for this lab order'
      });
    }

    if (labOrder.report) {
      return res.status(409).json({
        success: false,
        message: 'Report already exists for this lab order'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Report file is required'
      });
    }

    if (labOrder.status === 'REVIEWED' || labOrder.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload report for a reviewed or cancelled lab order'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.report.create({
        data: {
          labOrderId: labOrder.id,
          patientId: labOrder.patientId,
          doctorId: doctor.id,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedAt: new Date()
        }
      });

      const updatedOrder = await tx.labOrder.update({
        where: { id: labOrder.id },
        data: {
          status: 'UPLOADED'
        }
      });

      return {
        report: createdReport,
        labOrder: updatedOrder
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      data: {
        report: {
          id: result.report.id,
          labOrderId: result.report.labOrderId,
          fileName: result.report.fileName,
          fileType: result.report.fileType,
          fileSize: result.report.fileSize,
          uploadedAt: result.report.uploadedAt,
          reviewedAt: result.report.reviewedAt
        },
        labOrder: {
          id: result.labOrder.id,
          status: result.labOrder.status
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload report'
    });
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
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
        },
        labOrder: {
          select: {
            id: true,
            testName: true,
            instructions: true,
            status: true,
            createdAt: true,
            appointmentId: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const isPatientOwner = report.patient.userId === req.user.id;
    const isDoctorAssigned = report.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this report'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        report: {
          id: report.id,
          labOrderId: report.labOrderId,
          fileName: report.fileName,
          fileType: report.fileType,
          fileSize: report.fileSize,
          uploadedAt: report.uploadedAt,
          reviewedAt: report.reviewedAt,
          testName: report.labOrder.testName,
          status: report.labOrder.status,
          patient: {
            id: report.patient.id,
            name: report.patient.user.name,
            email: report.patient.user.email
          },
          doctor: {
            id: report.doctor.id,
            name: report.doctor.user.name,
            specialization: report.doctor.specialization
          },
          appointmentId: report.labOrder.appointmentId
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report'
    });
  }
};

const getPatientReports = async (req, res) => {
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

    if (req.user.role === 'PATIENT') {
      if (patient.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view other patient reports'
        });
      }
    } else if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          patientId
        }
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view reports for this patient'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }

    const reports = await prisma.report.findMany({
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
        labOrder: {
          select: {
            id: true,
            testName: true,
            instructions: true,
            status: true,
            appointmentId: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    const formatted = reports.map((r) => ({
      id: r.id,
      labOrderId: r.labOrderId,
      testName: r.labOrder.testName,
      status: r.labOrder.status,
      appointmentId: r.labOrder.appointmentId,
      doctorName: r.doctor.user.name,
      specialization: r.doctor.specialization,
      fileName: r.fileName,
      fileType: r.fileType,
      fileSize: r.fileSize,
      uploadedAt: r.uploadedAt,
      reviewedAt: r.reviewedAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        reports: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports'
    });
  }
};

const getReportFile = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const isPatientOwner = report.patient.userId === req.user.id;
    const isDoctorAssigned = report.doctor.userId === req.user.id;

    if (!isPatientOwner && !isDoctorAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this report file'
      });
    }

    const resolvedPath = path.resolve(report.filePath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found on server'
      });
    }

    res.setHeader('Content-Type', report.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(report.fileName)}"`);

    return res.sendFile(resolvedPath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send report file'
    });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        labOrder: true
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.doctorId !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this report'
      });
    }

    if (report.labOrder.status === 'REVIEWED') {
      return res.status(400).json({
        success: false,
        message: 'Report has already been reviewed'
      });
    }

    if (report.labOrder.status !== 'UPLOADED') {
      return res.status(400).json({
        success: false,
        message: 'Invalid report status transition for review'
      });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: report.id },
        data: {
          reviewedAt: now
        }
      });

      const updatedOrder = await tx.labOrder.update({
        where: { id: report.labOrderId },
        data: {
          status: 'REVIEWED'
        }
      });

      return {
        report: updatedReport,
        labOrder: updatedOrder
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Report marked as reviewed successfully',
      data: {
        report: {
          id: result.report.id,
          labOrderId: result.report.labOrderId,
          fileName: result.report.fileName,
          fileType: result.report.fileType,
          fileSize: result.report.fileSize,
          uploadedAt: result.report.uploadedAt,
          reviewedAt: result.report.reviewedAt
        },
        labOrder: {
          id: result.labOrder.id,
          status: result.labOrder.status
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to review report'
    });
  }
};

module.exports = {
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
};
