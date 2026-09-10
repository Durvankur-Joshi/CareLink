import { Link } from 'react-router-dom';

const PrescriptionCard = ({ prescription, linkBase = '/patient/prescriptions' }) => {
  const date = new Date(prescription.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-md space-y-3 hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">
            Dr. {prescription.doctor?.name}
          </h4>
          {prescription.doctor?.specialization && (
            <p className="text-xs text-cyan-400 font-medium">{prescription.doctor.specialization}</p>
          )}
        </div>
        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
          {prescription.medicineCount || prescription.items?.length || 0} medicine{(prescription.medicineCount || prescription.items?.length || 0) !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center space-x-3 text-xs text-slate-400">
        <span>{date}</span>
        {prescription.appointment?.appointmentDate && (
          <>
            <span className="text-slate-600">•</span>
            <span>Appt: {prescription.appointment.appointmentDate}</span>
          </>
        )}
      </div>

      {prescription.notes && (
        <p className="text-xs text-slate-300 italic line-clamp-2">"{prescription.notes}"</p>
      )}

      <div className="pt-2 border-t border-slate-700/60">
        <Link
          to={`${linkBase}/${prescription.id}`}
          className="inline-block px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          View Prescription
        </Link>
      </div>
    </div>
  );
};

export default PrescriptionCard;
