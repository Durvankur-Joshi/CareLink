const PrescriptionDetails = ({ prescription }) => {
  if (!prescription) return null;

  const date = new Date(prescription.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-950/60 to-slate-800 border border-indigo-900/50 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Prescription</h2>
            <p className="text-xs text-slate-400 mt-0.5">{date}</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-600/40">
            <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Rx</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Doctor</span>
            <p className="text-sm font-bold text-white">Dr. {prescription.doctor?.name}</p>
            {prescription.doctor?.specialization && (
              <p className="text-xs text-cyan-400 font-medium">{prescription.doctor.specialization}</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Patient</span>
            <p className="text-sm font-bold text-white">{prescription.patient?.name}</p>
            {prescription.appointment?.appointmentDate && (
              <p className="text-xs text-slate-400">Visit: {prescription.appointment.appointmentDate}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Medicines</h3>
          <span className="text-xs text-slate-400">{prescription.items?.length || 0} item{(prescription.items?.length || 0) !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-3">
          {prescription.items?.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 rounded-xl bg-slate-800 border border-slate-700/80 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-[11px] border border-indigo-600/40">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white">{item.medicineName}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-500 font-semibold uppercase">Dosage</span>
                  <span className="text-xs text-slate-200 font-medium">{item.dosage}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-semibold uppercase">Frequency</span>
                  <span className="text-xs text-slate-200 font-medium">{item.frequency}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-semibold uppercase">Duration</span>
                  <span className="text-xs text-slate-200 font-medium">{item.duration}</span>
                </div>
                {item.instructions && (
                  <div>
                    <span className="block text-[11px] text-slate-500 font-semibold uppercase">Instructions</span>
                    <span className="text-xs text-slate-200 font-medium">{item.instructions}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {prescription.notes && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold">Notes</span>
          <p className="text-sm text-amber-200/90">{prescription.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetails;
