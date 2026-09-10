const axios = require('axios');

const BASE = 'http://localhost:5000/api';

let doctorToken = null;
let patientToken = null;
let receptionToken = null;
let testAppointmentId = null;
let createdPrescriptionId = null;
let patientId = null;
let doctor2Token = null;

const results = [];

const log = (test, status, detail) => {
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`  ${icon} ${test}: ${status}${detail ? ' — ' + detail : ''}`);
  results.push({ test, status, detail });
};

const loginAs = async (email, password) => {
  const res = await axios.post(`${BASE}/auth/login`, { email, password });
  return res.data.data.token;
};

const headers = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

const run = async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  PHASE 5 — PRESCRIPTION API TESTS');
  console.log('══════════════════════════════════════════\n');

  try {
    const usersRes = await axios.get(`${BASE}/test/users`);
    const users = usersRes.data.data.users;

    const doctorUser = users.find(u => u.role === 'DOCTOR');
    const patientUser = users.find(u => u.role === 'PATIENT');
    const receptionUser = users.find(u => u.role === 'RECEPTION');

    if (!doctorUser || !patientUser) {
      console.log('ERROR: Need at least one DOCTOR and one PATIENT user in the database.');
      console.log('Available users:', users.map(u => `${u.name} (${u.role})`).join(', '));
      process.exit(1);
    }

    console.log(`  Doctor:    ${doctorUser.name} <${doctorUser.email}>`);
    console.log(`  Patient:   ${patientUser.name} <${patientUser.email}>`);
    if (receptionUser) console.log(`  Reception: ${receptionUser.name} <${receptionUser.email}>`);
    console.log('');

    doctorToken = await loginAs(doctorUser.email, 'password123');
    patientToken = await loginAs(patientUser.email, 'password123');
    if (receptionUser) receptionToken = await loginAs(receptionUser.email, 'password123');

    const aptsRes = await axios.get(`${BASE}/appointments/doctor`, headers(doctorToken));
    const allApts = aptsRes.data.data.appointments;
    const eligible = allApts.find(a => ['IN_CONSULTATION', 'COMPLETED'].includes(a.status));

    if (!eligible) {
      console.log('  No eligible appointment (IN_CONSULTATION / COMPLETED) found.');
      console.log('  Available statuses:', [...new Set(allApts.map(a => a.status))].join(', '));
      console.log('  Attempting to find an IN_QUEUE appointment to use...');

      const inQueue = allApts.find(a => a.status === 'IN_QUEUE');
      if (inQueue) {
        testAppointmentId = inQueue.id;
        patientId = inQueue.patientId;
        console.log(`  Using IN_QUEUE appointment ${testAppointmentId} — expect 400 on create.\n`);
      } else {
        const booked = allApts.find(a => a.status === 'BOOKED');
        if (booked) {
          testAppointmentId = booked.id;
          patientId = booked.patientId;
          console.log(`  Using BOOKED appointment ${testAppointmentId} — expect 400 on create.\n`);
        } else {
          console.log('  ERROR: No appointments found at all for this doctor.');
          process.exit(1);
        }
      }
    } else {
      testAppointmentId = eligible.id;
      patientId = eligible.patientId;
      console.log(`  Using appointment: ${testAppointmentId} (${eligible.status})\n`);
    }

    console.log('── Test 12: BOOKED appointment ──');
    const bookedApt = allApts.find(a => a.status === 'BOOKED');
    if (bookedApt) {
      try {
        await axios.post(`${BASE}/prescriptions`, {
          appointmentId: bookedApt.id,
          items: [{ medicineName: 'Test', dosage: '1mg', frequency: 'Once', duration: '1 day' }]
        }, headers(doctorToken));
        log('TEST 12 — BOOKED appointment rejected', 'FAIL', 'Expected 400 but got 2xx');
      } catch (err) {
        log('TEST 12 — BOOKED appointment rejected', err.response?.status === 400 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
      }
    } else {
      log('TEST 12 — BOOKED appointment rejected', 'SKIP', 'No BOOKED appointment found');
    }

    console.log('── Test 13: CANCELLED appointment ──');
    const cancelledApt = allApts.find(a => a.status === 'CANCELLED');
    if (cancelledApt) {
      try {
        await axios.post(`${BASE}/prescriptions`, {
          appointmentId: cancelledApt.id,
          items: [{ medicineName: 'Test', dosage: '1mg', frequency: 'Once', duration: '1 day' }]
        }, headers(doctorToken));
        log('TEST 13 — CANCELLED appointment rejected', 'FAIL', 'Expected 400 but got 2xx');
      } catch (err) {
        log('TEST 13 — CANCELLED appointment rejected', err.response?.status === 400 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
      }
    } else {
      log('TEST 13 — CANCELLED appointment rejected', 'SKIP', 'No CANCELLED appointment found');
    }

    console.log('── Test 10: Zero medicines ──');
    try {
      await axios.post(`${BASE}/prescriptions`, {
        appointmentId: testAppointmentId,
        items: []
      }, headers(doctorToken));
      log('TEST 10 — Zero medicines rejected', 'FAIL', 'Expected 400 but got 2xx');
    } catch (err) {
      log('TEST 10 — Zero medicines rejected', err.response?.status === 400 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
    }

    console.log('── Test 11: Missing medicine name ──');
    try {
      await axios.post(`${BASE}/prescriptions`, {
        appointmentId: testAppointmentId,
        items: [{ medicineName: '', dosage: '1mg', frequency: 'Once', duration: '1 day' }]
      }, headers(doctorToken));
      log('TEST 11 — Missing medicine name rejected', 'FAIL', 'Expected 400 but got 2xx');
    } catch (err) {
      log('TEST 11 — Missing medicine name rejected', err.response?.status === 400 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
    }

    if (eligible) {
      console.log('── Test 1: Doctor creates prescription ──');
      try {
        const res = await axios.post(`${BASE}/prescriptions`, {
          appointmentId: testAppointmentId,
          notes: 'Take medicines as prescribed and maintain hydration.',
          items: [
            { medicineName: 'Paracetamol', dosage: '500 mg', frequency: 'Twice daily', duration: '3 days', instructions: 'After meals' },
            { medicineName: 'Cetirizine', dosage: '10 mg', frequency: 'Once daily', duration: '5 days', instructions: 'Before sleep' },
            { medicineName: 'ORS', dosage: '1 sachet', frequency: 'Thrice daily', duration: '3 days', instructions: 'Dissolve in water' }
          ]
        }, headers(doctorToken));
        createdPrescriptionId = res.data.data.prescription.id;
        log('TEST 1 — Doctor creates prescription', res.status === 201 ? 'PASS' : 'FAIL', `Status: ${res.status}`);

        console.log('── Test 2: Multiple medicines saved ──');
        const itemCount = res.data.data.prescription.items?.length;
        log('TEST 2 — Multiple medicines saved', itemCount === 3 ? 'PASS' : 'FAIL', `Items: ${itemCount}`);
      } catch (err) {
        log('TEST 1 — Doctor creates prescription', 'FAIL', err.response?.data?.message || err.message);
        log('TEST 2 — Multiple medicines saved', 'FAIL', 'Depends on Test 1');
      }
    } else {
      log('TEST 1 — Doctor creates prescription', 'SKIP', 'No eligible appointment');
      log('TEST 2 — Multiple medicines saved', 'SKIP', 'No eligible appointment');
    }

    console.log('── Test 3: Patient GET /my ──');
    try {
      const res = await axios.get(`${BASE}/prescriptions/my`, headers(patientToken));
      const rxList = res.data.data.prescriptions;
      if (createdPrescriptionId) {
        const found = rxList.find(p => p.id === createdPrescriptionId);
        log('TEST 3 — Patient GET /my', found ? 'PASS' : 'FAIL', `Prescriptions: ${rxList.length}`);
      } else {
        log('TEST 3 — Patient GET /my', res.status === 200 ? 'PASS' : 'FAIL', `Status: ${res.status}`);
      }
    } catch (err) {
      log('TEST 3 — Patient GET /my', 'FAIL', err.response?.data?.message || err.message);
    }

    if (createdPrescriptionId) {
      console.log('── Test 4: Patient opens prescription ──');
      try {
        const res = await axios.get(`${BASE}/prescriptions/${createdPrescriptionId}`, headers(patientToken));
        const rx = res.data.data.prescription;
        const hasItems = rx.items && rx.items.length === 3;
        const hasDoctor = rx.doctor?.name;
        log('TEST 4 — Patient opens prescription', hasItems && hasDoctor ? 'PASS' : 'FAIL', `Items: ${rx.items?.length}, Doctor: ${hasDoctor}`);
      } catch (err) {
        log('TEST 4 — Patient opens prescription', 'FAIL', err.response?.data?.message || err.message);
      }

      console.log('── Test 5: Doctor opens prescription ──');
      try {
        const res = await axios.get(`${BASE}/prescriptions/${createdPrescriptionId}`, headers(doctorToken));
        log('TEST 5 — Doctor opens prescription', res.status === 200 ? 'PASS' : 'FAIL', `Status: ${res.status}`);
      } catch (err) {
        log('TEST 5 — Doctor opens prescription', 'FAIL', err.response?.data?.message || err.message);
      }

      console.log('── Test 6: Reception opens prescription ──');
      if (receptionToken) {
        try {
          await axios.get(`${BASE}/prescriptions/${createdPrescriptionId}`, headers(receptionToken));
          log('TEST 6 — Reception blocked', 'FAIL', 'Expected 403 but got 2xx');
        } catch (err) {
          log('TEST 6 — Reception blocked', err.response?.status === 403 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
        }
      } else {
        log('TEST 6 — Reception blocked', 'SKIP', 'No reception user');
      }
    } else {
      log('TEST 4 — Patient opens prescription', 'SKIP', 'No prescription created');
      log('TEST 5 — Doctor opens prescription', 'SKIP', 'No prescription created');
      log('TEST 6 — Reception blocked', 'SKIP', 'No prescription created');
    }

    console.log('── Test 7: Patient views another patient\'s prescription ──');
    try {
      await axios.get(`${BASE}/prescriptions/patient/nonexistent-id`, headers(patientToken));
      log('TEST 7 — Cross-patient blocked', 'FAIL', 'Expected 403/404 but got 2xx');
    } catch (err) {
      const s = err.response?.status;
      log('TEST 7 — Cross-patient blocked', (s === 403 || s === 404) ? 'PASS' : 'FAIL', `Status: ${s}`);
    }

    console.log('── Test 8: Doctor creates Rx for other doctor\'s appointment ──');
    const otherDoctors = users.filter(u => u.role === 'DOCTOR' && u.email !== doctorUser.email);
    if (otherDoctors.length > 0) {
      try {
        doctor2Token = await loginAs(otherDoctors[0].email, 'password123');
        await axios.post(`${BASE}/prescriptions`, {
          appointmentId: testAppointmentId,
          items: [{ medicineName: 'X', dosage: '1mg', frequency: 'Once', duration: '1 day' }]
        }, headers(doctor2Token));
        log('TEST 8 — Other doctor blocked', 'FAIL', 'Expected 403/409 but got 2xx');
      } catch (err) {
        const s = err.response?.status;
        log('TEST 8 — Other doctor blocked', (s === 403 || s === 404 || s === 409) ? 'PASS' : 'FAIL', `Status: ${s}`);
      }
    } else {
      log('TEST 8 — Other doctor blocked', 'SKIP', 'Only one doctor in system');
    }

    console.log('── Test 9: Duplicate prescription ──');
    if (createdPrescriptionId) {
      try {
        await axios.post(`${BASE}/prescriptions`, {
          appointmentId: testAppointmentId,
          items: [{ medicineName: 'Dup', dosage: '1mg', frequency: 'Once', duration: '1 day' }]
        }, headers(doctorToken));
        log('TEST 9 — Duplicate blocked', 'FAIL', 'Expected 409 but got 2xx');
      } catch (err) {
        log('TEST 9 — Duplicate blocked', err.response?.status === 409 ? 'PASS' : 'FAIL', `Status: ${err.response?.status}`);
      }
    } else {
      log('TEST 9 — Duplicate blocked', 'SKIP', 'No initial prescription to duplicate');
    }

  } catch (err) {
    console.log(`\nFATAL ERROR: ${err.message}`);
    if (err.response) {
      console.log(`  Status: ${err.response.status}`);
      console.log(`  Body: ${JSON.stringify(err.response.data)}`);
    }
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('══════════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`  PASS: ${passed}  |  FAIL: ${failed}  |  SKIP: ${skipped}  |  TOTAL: ${results.length}\n`);

  if (failed > 0) {
    console.log('  FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ✗ ${r.test}: ${r.detail}`);
    });
    console.log('');
  }
};

run();
