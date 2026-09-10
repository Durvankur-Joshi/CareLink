const prisma = require('../lib/prisma');

const getDoctors = async (req, res) => {
  try {
    const { search } = req.query;

    const whereClause = {};

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereClause.OR = [
        {
          specialization: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          user: {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedDoctors = doctors.map((doc) => ({
      id: doc.id,
      name: doc.user.name,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      bio: doc.bio
    }));

    return res.status(200).json({
      success: true,
      data: {
        doctors: formattedDoctors
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors'
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.user.name,
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
          bio: doctor.bio
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor details'
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorById
};
