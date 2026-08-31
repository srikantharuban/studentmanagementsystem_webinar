/* ============================================================
   Student Management System — SPA
   ============================================================ */

const API = '';
const TODAY = new Date().toISOString().split('T')[0];

/* ============================================================
   Role-based access control
   ============================================================ */
const currentRole = sessionStorage.getItem('sms_role') || 'admin';

const ROLE_PAGES = {
  admin:        ['dashboard', 'students', 'courses', 'enrollments', 'attendance', 'grades'],
  studentadmin: ['dashboard', 'students', 'enrollments'],
  courseadmin:  ['dashboard', 'courses',  'enrollments'],
  teacher:      ['dashboard', 'attendance'],
};

const ROLE_LABELS = {
  admin:        'Administrator',
  studentadmin: 'Student Admin',
  courseadmin:  'Course Admin',
  teacher:      'Teacher',
};

function canAccess(page) {
  return (ROLE_PAGES[currentRole] || ROLE_PAGES.admin).includes(page);
}

/* ============================================================
   HTTP helpers
   ============================================================ */
async function apiFetch(method, path, data) {
  const opts = { method, headers: {} };
  if (data !== undefined && data !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(API + path, opts);
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || `HTTP ${res.status}`);
  return json;
}

const api = {
  get:    (p)    => apiFetch('GET',    p),
  post:   (p, d) => apiFetch('POST',   p, d),
  patch:  (p, d) => apiFetch('PATCH',  p, d),
  put:    (p, d) => apiFetch('PUT',    p, d),
  delete: (p)    => apiFetch('DELETE', p),
};

/* ============================================================
   Toast
   ============================================================ */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ============================================================
   Modal
   ============================================================ */
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
window.closeModal = function () {
  document.getElementById('modal-overlay').classList.add('hidden');
};

/* ============================================================
   Utilities
   ============================================================ */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function statusBadge(status) {
  const cls = { present: 'badge-absent', absent: 'badge-present', late: 'badge-late' };  // BUG-2: present/absent classes swapped
  return `<span class="badge ${cls[status] || ''}">${esc(status)}</span>`;
}

function pct(score, max) {
  return max > 0 ? Math.round((score / max) * 10) : 0;  // BUG-1: should be * 100
}

async function loadOptions(selectId, url, valKey, labelFn, emptyLabel) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const items = await api.get(url);
    sel.innerHTML = `<option value="">${emptyLabel || '— Select —'}</option>` +
      items.map(i => `<option value="${i[valKey]}">${esc(labelFn(i))}</option>`).join('');
  } catch (_) {
    sel.innerHTML = `<option value="">Failed to load</option>`;
  }
}

/* ============================================================
   Navigation
   ============================================================ */
async function navigate(page) {
  if (!canAccess(page)) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('page-content').innerHTML = `
      <div class="access-denied">
        <div class="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>Your role (<strong>${ROLE_LABELS[currentRole] || currentRole}</strong>) does not have permission to view this section.</p>
      </div>`;
    return;
  }
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page));
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading">Loading…</div>';
  try {
    switch (page) {
      case 'dashboard':   await renderDashboard();   break;
      case 'students':    await renderStudents();    break;
      case 'courses':     await renderCourses();     break;
      case 'enrollments': await renderEnrollments(); break;
      case 'attendance':  await renderAttendance();  break;
      case 'grades':      await renderGrades();      break;
    }
  } catch (e) {
    content.innerHTML = `<div class="error-msg">Failed to load: ${esc(e.message)}</div>`;
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  const [students, courses, enrollments, attendance, grades] = await Promise.all([
    api.get('/students/'), api.get('/courses/'), api.get('/enrollments/'),
    api.get('/attendance/'), api.get('/grades/'),
  ]);

  // Build lookup: course_id → course code
  const courseMap = {};
  courses.forEach(c => { courseMap[c.id] = c.code; });

  // Chart 1: enrollments per course
  const enrollPerCourse = {};
  courses.forEach(c => { enrollPerCourse[c.id] = 0; });
  enrollments.forEach(e => { if (enrollPerCourse[e.course_id] !== undefined) enrollPerCourse[e.course_id]++; });
  const enrollLabels = courses.map(c => c.code);
  const enrollCounts = courses.map(c => enrollPerCourse[c.id]);

  // Chart 2: average grade percentage per course
  const gradeSums = {}, gradeCounts = {};
  courses.forEach(c => { gradeSums[c.id] = 0; gradeCounts[c.id] = 0; });
  grades.forEach(g => {
    if (gradeSums[g.course_id] !== undefined) {
      gradeSums[g.course_id] += (g.score / g.max_score) * 100;
      gradeCounts[g.course_id]++;
    }
  });
  const gradeCourses = courses.filter(c => gradeCounts[c.id] > 0);
  const gradeLabels  = gradeCourses.map(c => c.code);
  const gradeAvgs    = gradeCourses.map(c => Math.round(gradeSums[c.id] / gradeCounts[c.id]));

  const CHART_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16'];

  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>Dashboard</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${students.length}</div><div class="stat-label">Students</div></div>
      <div class="stat-card"><div class="stat-icon">📖</div><div class="stat-value">${courses.length}</div><div class="stat-label">Courses</div></div>
      <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${enrollments.length}</div><div class="stat-label">Enrollments</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${attendance.length}</div><div class="stat-label">Attendance Records</div></div>
      <div class="stat-card"><div class="stat-icon">🎓</div><div class="stat-value">${attendance.length}</div><div class="stat-label">Grade Records</div></div><!-- BUG-3: should use grades.length -->
    </div>
    <div class="card quick-actions-card">
      <h3>Quick Actions</h3>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick="navigate('students')">Manage Students</button>
        <button class="btn btn-primary" onclick="navigate('courses')">Manage Courses</button>
        <button class="btn btn-primary" onclick="navigate('enrollments')">Enrollments</button>
        <button class="btn btn-primary" onclick="navigate('attendance')">Mark Attendance</button>
        <button class="btn btn-primary" onclick="navigate('grades')">Record Grades</button>
      </div>
    </div>
    <div class="dashboard-charts">
      <div class="card chart-card">
        <h3>Students Enrolled per Course</h3>
        <div class="chart-wrap">
          <canvas id="chart-enrollments"></canvas>
        </div>
      </div>
      <div class="card chart-card">
        <h3>Average Grade per Course (%)</h3>
        <div class="chart-wrap">
          <canvas id="chart-grades"></canvas>
        </div>
      </div>
    </div>`;

  const sharedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12 }, color: '#475569' },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  };

  const enrollCanvas = document.getElementById('chart-enrollments');
  enrollCanvas.style.cursor = 'pointer';
  new Chart(enrollCanvas, {
    type: 'doughnut',
    data: {
      labels: enrollLabels,
      datasets: [{
        data: enrollCounts,
        backgroundColor: CHART_COLORS.slice(0, enrollLabels.length),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }],
    },
    options: {
      ...sharedOpts,
      plugins: {
        ...sharedOpts.plugins,
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} student${ctx.parsed !== 1 ? 's' : ''} — click to view` },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const course = courses[elements[0].index];
          viewCourseStudents(course.id, course.name);
        }
      },
    },
  });

  const gradeCanvas = document.getElementById('chart-grades');
  gradeCanvas.style.cursor = 'pointer';
  new Chart(gradeCanvas, {
    type: 'doughnut',
    data: {
      labels: gradeLabels,
      datasets: [{
        data: gradeAvgs,
        backgroundColor: CHART_COLORS.slice(0, gradeLabels.length),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }],
    },
    options: {
      ...sharedOpts,
      plugins: {
        ...sharedOpts.plugins,
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}% — click to view` },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const course = gradeCourses[elements[0].index];
          viewCourseGrades(course.id, course.name);
        }
      },
    },
  });
}

/* ============================================================
   STUDENTS
   ============================================================ */
async function renderStudents() {
  const students = await api.get('/students/');
  document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <h2>Students</h2>
      <button class="btn btn-primary" onclick="openCreateStudentModal()">+ Add Student</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Date of Birth</th><th>Enrolled</th><th>Actions</th></tr></thead>
        <tbody>
          ${students.length ? students.map(s => `
            <tr>
              <td><strong>${esc(s.first_name)} ${esc(s.last_name)}</strong></td>
              <td>${esc(s.email)}</td>
              <td>${s.date_of_birth}</td>
              <td>${s.enrollment_date}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline" onclick="viewStudentCourses(${s.id},'${esc(s.first_name+' '+s.last_name)}')">Courses</button>
                <button class="btn btn-sm btn-warning" onclick="openEditStudentModal(${s.id})">Edit</button>
                <button class="btn btn-sm btn-danger"  onclick="confirmDeleteStudent(${s.id},'${esc(s.first_name+' '+s.last_name)}')">Delete</button>
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty">No students yet</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function studentFormFields(s) {
  s = s || {};
  return `
    <div class="form-row">
      <div class="form-group"><label>First Name *</label><input class="form-control" type="text" name="first_name" value="${esc(s.first_name||'')}" required></div>
      <div class="form-group"><label>Last Name *</label><input class="form-control" type="text" name="last_name" value="${esc(s.last_name||'')}" required></div>
    </div>
    <div class="form-group"><label>Email *</label><input class="form-control" type="email" name="email" value="" required></div><!-- BUG-4: email not pre-filled in edit modal -->
    <div class="form-row">
      <div class="form-group"><label>Date of Birth *</label><input class="form-control" type="date" name="date_of_birth" value="${s.date_of_birth||''}" required></div>
      <div class="form-group"><label>Enrollment Date *</label><input class="form-control" type="date" name="enrollment_date" value="${s.enrollment_date||TODAY}" required></div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>`;
}

window.openCreateStudentModal = function () {
  openModal('Add Student', `<form onsubmit="submitStudent(event,null)">${studentFormFields()}</form>`);
};
window.openEditStudentModal = async function (id) {
  try {
    const s = await api.get(`/students/${id}`);
    openModal('Edit Student', `<form onsubmit="submitStudent(event,${id})">${studentFormFields(s)}</form>`);
  } catch (e) { toast(e.message, 'error'); }
};
window.submitStudent = async function (event, id) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    if (id) { await api.patch(`/students/${id}`, data); toast('Student updated'); }
    else    { await api.post('/students/', data);        toast('Student updated'); }  // BUG-5: should say 'Student created'
    closeModal(); renderStudents();
  } catch (e) { toast(e.message, 'error'); }
};
window.confirmDeleteStudent = function (id, name) {
  openModal('Delete Student', `
    <p>Delete <strong>${esc(name)}</strong>? This also removes all their enrollments, attendance and grades.</p>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteStudent(${id})">Delete</button>
    </div>`);
};
window.doDeleteStudent = async function (id) {
  try { await api.delete(`/students/${id}`); toast('Student deleted'); closeModal(); renderStudents(); }
  catch (e) { toast(e.message, 'error'); }
};
window.viewStudentCourses = async function (id, name) {
  try {
    const courses = await api.get(`/students/${id}/courses`);
    openModal(`Courses — ${name}`, courses.length
      ? `<table class="modal-table"><thead><tr><th>Code</th><th>Course</th><th>Credits</th></tr></thead>
         <tbody>${courses.map(c=>`<tr><td><code>${esc(c.code)}</code></td><td>${esc(c.name)}</td><td>${c.credits}</td></tr>`).join('')}</tbody>
         </table><div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`
      : `<p class="empty">Not enrolled in any courses.</p>
         <div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
  } catch (e) { toast(e.message, 'error'); }
};

window.viewCourseGrades = async function (id, name) {
  try {
    const [gradeRecords, students] = await Promise.all([
      api.get(`/grades/?course_id=${id}`),
      api.get('/students/'),
    ]);
    const sMap = Object.fromEntries(students.map(s => [s.id, `${s.first_name} ${s.last_name}`]));
    openModal(`Grades — ${name}`, gradeRecords.length
      ? `<table class="modal-table">
           <thead><tr><th>Student</th><th>Assessment</th><th>Score</th><th>Max</th><th>%</th></tr></thead>
           <tbody>${gradeRecords.map(g => {
             const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0;
             return `<tr>
               <td>${esc(sMap[g.student_id] || g.student_id)}</td>
               <td>${esc(g.assessment_name)}</td>
               <td>${g.score}</td>
               <td>${g.max_score}</td>
               <td><strong>${pct}%</strong></td>
             </tr>`;
           }).join('')}</tbody>
         </table>
         <div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`
      : `<p class="empty">No grade records for this course.</p>
         <div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
  } catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   COURSES
   ============================================================ */
async function renderCourses() {
  const courses = await api.get('/courses/');
  document.getElementById('page-content').innerHTML = `
    <div class="page-header">
      <h2>Courses</h2>
      <button class="btn btn-primary" onclick="openCreateCourseModal()">+ Add Course</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Code</th><th>Course Name</th><th>Credits</th><th>Actions</th></tr></thead>
        <tbody>
          ${courses.length ? courses.map(c => `
            <tr>
              <td><code>${esc(c.code)}</code></td>
              <td>${esc(c.name)}</td>
              <td>${c.credits}</td>
              <td class="actions">
                <button class="btn btn-sm btn-outline" onclick="viewCourseStudents(${c.id},'${esc(c.name)}')">Students</button>
                <button class="btn btn-sm btn-warning" onclick="openEditCourseModal(${c.id})">Edit</button>
                <button class="btn btn-sm btn-danger"  onclick="confirmDeleteCourse(${c.id},'${esc(c.name)}')">Delete</button>
              </td>
            </tr>`).join('') : '<tr><td colspan="4" class="empty">No courses yet</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function courseFormFields(c) {
  c = c || {};
  return `
    <div class="form-group"><label>Course Name *</label><input class="form-control" type="text" name="name" value="${esc(c.name||'')}" required></div>
    <div class="form-row">
      <div class="form-group"><label>Code *</label><input class="form-control" type="text" name="code" value="${esc(c.code||'')}" placeholder="e.g. CS101" required></div>
      <div class="form-group"><label>Credits (1–12) *</label><input class="form-control" type="number" name="credits" value="${c.credits||''}" min="1" max="12" required></div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>`;
}

window.openCreateCourseModal = function () {
  openModal('Add Course', `<form onsubmit="submitCourse(event,null)">${courseFormFields()}</form>`);
};
window.openEditCourseModal = async function (id) {
  try {
    const c = await api.get(`/courses/${id}`);
    openModal('Edit Course', `<form onsubmit="submitCourse(event,${id})">${courseFormFields(c)}</form>`);
  } catch (e) { toast(e.message, 'error'); }
};
window.submitCourse = async function (event, id) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  data.credits = Number(data.credits);
  try {
    if (id) { await api.patch(`/courses/${id}`, data); toast('Course updated'); closeModal(); }
    else    { await api.post('/courses/', data);        toast('Course created'); }  // BUG-6: missing closeModal() on create
    renderCourses();
  } catch (e) { toast(e.message, 'error'); }
};
window.confirmDeleteCourse = function (id, name) {
  openModal('Delete Course', `
    <p>Delete <strong>${esc(name)}</strong>? This removes all related enrollments, attendance and grades.</p>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteCourse(${id})">Delete</button>
    </div>`);
};
window.doDeleteCourse = async function (id) {
  try { await api.delete(`/courses/${id}`); toast('Course deleted'); closeModal(); renderCourses(); }
  catch (e) { toast(e.message, 'error'); }
};
window.viewCourseStudents = async function (id, name) {
  try {
    const students = await api.get(`/courses/${id}/students`);
    openModal(`Students — ${name}`, students.length
      ? `<table class="modal-table"><thead><tr><th>Name</th><th>Email</th></tr></thead>
         <tbody>${students.map(s=>`<tr><td>${esc(s.first_name)} ${esc(s.last_name)}</td><td>${esc(s.email)}</td></tr>`).join('')}</tbody>
         </table><div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`
      : `<p class="empty">No students enrolled.</p>
         <div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button></div>`);
  } catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   ENROLLMENTS
   ============================================================ */
async function renderEnrollments() {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>Enrollments</h2></div>
    <div class="two-col">
      <div class="card">
        <h3>Enroll a Student</h3>
        <form onsubmit="submitEnrollment(event)" style="margin-top:16px">
          <div class="form-group"><label>Student *</label>
            <select id="enroll-student" class="form-control" required><option value="">Loading…</option></select></div>
          <div class="form-group"><label>Course *</label>
            <select id="enroll-course" class="form-control" required><option value="">Loading…</option></select></div>
          <div class="form-group"><label>Enrollment Date</label>
            <input class="form-control" type="date" name="enrollment_date" value="${TODAY}"></div>
          <div class="form-actions"><button type="submit" class="btn btn-primary">Enroll</button></div>
        </form>
      </div>
      <div>
        <div class="filter-row" style="margin-bottom:12px">
          <select id="filter-enroll-student" class="form-control" style="max-width:200px"><option value="">All Students</option></select>
          <select id="filter-enroll-course"  class="form-control" style="max-width:200px"><option value="">All Courses</option></select>
          <button class="btn btn-outline" onclick="filterEnrollments()">Filter</button>
        </div>
        <div id="enrollment-table"><div class="loading">Loading…</div></div>
      </div>
    </div>`;

  await Promise.all([
    loadOptions('enroll-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`),
    loadOptions('enroll-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`),
    loadOptions('filter-enroll-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`, 'All Students'),
    loadOptions('filter-enroll-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`,          'All Courses'),
  ]);
  await filterEnrollments();
}

window.submitEnrollment = async function (event) {
  event.preventDefault();
  const courseId  = document.getElementById('enroll-course').value;
  const studentId = document.getElementById('enroll-student').value;
  const date      = event.target.querySelector('[name=enrollment_date]').value;
  if (!studentId || !courseId) { toast('Select both student and course', 'error'); return; }
  try {
    await api.post(`/courses/${courseId}/enroll`, { student_id: Number(studentId), enrollment_date: date });
    toast('Student enrolled');
    event.target.reset();
    event.target.querySelector('[name=enrollment_date]').value = TODAY;
    await filterEnrollments();
  } catch (e) { toast(e.message, 'error'); }
};

window.filterEnrollments = async function () {
  const sid = document.getElementById('filter-enroll-student')?.value || '';
  const cid = document.getElementById('filter-enroll-course')?.value  || '';
  const container = document.getElementById('enrollment-table');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const params = new URLSearchParams();
    if (sid) params.set('student_id', sid);
    if (cid) params.set('course_id', cid);
    const enrollments = await api.get('/enrollments/?' + params);
    const [students, courses] = await Promise.all([api.get('/students/'), api.get('/courses/')]);
    const sMap = Object.fromEntries(students.map(s => [s.id, `${s.first_name} ${s.last_name}`]));
    const cMap = Object.fromEntries(courses.map(c  => [c.id, { code: c.code, name: c.name }]));
    container.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>Student</th><th>Code</th><th>Course</th><th>Enrolled On</th><th>Actions</th></tr></thead>
          <tbody>
            ${enrollments.length ? enrollments.map(e => {
              const c = cMap[e.course_id] || { code: e.course_id, name: '' };
              return `<tr>
                <td>${esc(sMap[e.student_id] || e.student_id)}</td>
                <td><code>${esc(c.code)}</code></td>
                <td>${esc(c.name)}</td>
                <td>${e.enrollment_date}</td>
                <td><button class="btn btn-sm btn-danger" onclick="unenroll(${e.course_id},${e.student_id},'${esc(sMap[e.student_id]||'')}')">Unenroll</button></td>
              </tr>`;
            }).join('') : '<tr><td colspan="5" class="empty">No enrollments found</td></tr>'}
          </tbody>
        </table>
      </div>`;
  } catch (e) { container.innerHTML = `<div class="error-msg">${esc(e.message)}</div>`; }
};

window.unenroll = function (courseId, studentId, name) {
  openModal('Unenroll Student', `
    <p>Remove <strong>${esc(name)}</strong> from this course?</p>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doUnenroll(${courseId},${studentId})">Unenroll</button>
    </div>`);
};
window.doUnenroll = async function (courseId, studentId) {
  try { await api.delete(`/courses/${courseId}/enroll/${studentId}`); toast('Student unenrolled'); closeModal(); await filterEnrollments(); }
  catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   ATTENDANCE
   ============================================================ */
async function renderAttendance() {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>Attendance</h2></div>
    <div class="card" style="margin-bottom:20px">
      <h3>Mark Attendance</h3>
      <form onsubmit="submitAttendance(event)" style="margin-top:16px">
        <div class="form-row">
          <div class="form-group"><label>Student *</label>
            <select id="att-student" class="form-control" required><option value="">Loading…</option></select></div>
          <div class="form-group"><label>Course *</label>
            <select id="att-course" class="form-control" required><option value="">Loading…</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Date *</label>
            <input id="att-date" class="form-control" type="date" name="date" value="${TODAY}" required></div>
          <div class="form-group"><label>Status *</label>
            <select id="att-status" class="form-control" name="status" required>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Mark Attendance</button></div>
      </form>
    </div>
    <div class="card">
      <h3>Attendance History</h3>
      <div class="filter-row" style="margin:12px 0">
        <select id="filter-att-student" class="form-control" style="max-width:180px"><option value="">All Students</option></select>
        <select id="filter-att-course"  class="form-control" style="max-width:180px"><option value="">All Courses</option></select>
        <input  id="filter-att-date"    class="form-control" type="date" style="max-width:150px">
        <button class="btn btn-outline" onclick="filterAttendance()">Filter</button>
        <button class="btn btn-outline" onclick="clearAttFilter()">Clear</button>
      </div>
      <div id="attendance-table"><div class="loading">Loading…</div></div>
    </div>`;

  await Promise.all([
    loadOptions('att-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`),
    loadOptions('att-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`),
    loadOptions('filter-att-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`, 'All Students'),
    loadOptions('filter-att-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`,          'All Courses'),
  ]);
  await filterAttendance();
}

window.submitAttendance = async function (event) {
  event.preventDefault();
  const payload = {
    student_id: Number(document.getElementById('att-student').value),
    course_id:  Number(document.getElementById('att-course').value),
    date:   document.getElementById('att-date').value,
    status: document.getElementById('att-status').value,
  };
  if (!payload.student_id || !payload.course_id) { toast('Select student and course', 'error'); return; }
  try {
    await api.post('/attendance/', payload);
    toast('Attendance marked');
    document.getElementById('att-date').value   = TODAY;
    document.getElementById('att-status').value = 'present';
    await filterAttendance();
  } catch (e) { toast(e.message, 'error'); }
};

window.clearAttFilter = function () {
  const els = ['filter-att-student','filter-att-course','filter-att-date'];
  els.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  filterAttendance();
};

window.filterAttendance = async function () {
  const sid  = document.getElementById('filter-att-student')?.value || '';
  const cid  = document.getElementById('filter-att-course')?.value  || '';
  const date = document.getElementById('filter-att-date')?.value    || '';
  const container = document.getElementById('attendance-table');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const params = new URLSearchParams();
    if (sid)  params.set('student_id', sid);
    if (cid)  params.set('course_id',  cid);
    if (date) params.set('date', date);
    const records = await api.get('/attendance/?' + params);
    const [students, courses] = await Promise.all([api.get('/students/'), api.get('/courses/')]);
    const sMap = Object.fromEntries(students.map(s => [s.id, `${s.first_name} ${s.last_name}`]));
    const cMap = Object.fromEntries(courses.map(c  => [c.id, c.code]));
    container.innerHTML = `
      <table>
        <thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${records.length ? records.map(r => `
            <tr>
              <td>${esc(sMap[r.student_id] || r.student_id)}</td>
              <td><code>${esc(cMap[r.course_id] || r.course_id)}</code></td>
              <td>${r.date}</td>
              <td>${statusBadge(r.status)}</td>
              <td class="actions">
                ${currentRole !== 'teacher' ? `
                <button class="btn btn-sm btn-warning" onclick="editAttendance(${r.id},'${esc(r.status)}')">Edit</button>
                <button class="btn btn-sm btn-danger"  onclick="deleteAttendance(${r.id})">Delete</button>` : ''}
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty">No records found</td></tr>'}
        </tbody>
      </table>`;
  } catch (e) { container.innerHTML = `<div class="error-msg">${esc(e.message)}</div>`; }
};

window.editAttendance = function (id, cur) {
  openModal('Update Status', `
    <form onsubmit="submitAttEdit(event,${id})">
      <div class="form-group"><label>Status</label>
        <select class="form-control" name="status">
          <option value="present" ${cur==='present'?'selected':''}>Present</option>
          <option value="absent"  ${cur==='absent' ?'selected':''}>Absent</option>
          <option value="late"    ${cur==='late'   ?'selected':''}>Late</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>`);
};
window.submitAttEdit = async function (event, id) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try { await api.put(`/attendance/${id}`, data); toast('Status updated'); closeModal(); await filterAttendance(); }
  catch (e) { toast(e.message, 'error'); }
};
window.deleteAttendance = function (id) {
  openModal('Delete Record', `
    <p>Delete this attendance record?</p>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteAtt(${id})">Delete</button>
    </div>`);
};
window.doDeleteAtt = async function (id) {
  try { await api.delete(`/attendance/${id}`); toast('Record deleted'); closeModal(); await filterAttendance(); }
  catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   GRADES
   ============================================================ */
async function renderGrades() {
  document.getElementById('page-content').innerHTML = `
    <div class="page-header"><h2>Grades</h2></div>
    <div class="card" style="margin-bottom:20px">
      <h3>Record a Grade</h3>
      <form onsubmit="submitGrade(event)" style="margin-top:16px">
        <div class="form-row">
          <div class="form-group"><label>Student *</label>
            <select id="grade-student" class="form-control" required><option value="">Loading…</option></select></div>
          <div class="form-group"><label>Course *</label>
            <select id="grade-course" class="form-control" required><option value="">Loading…</option></select></div>
        </div>
        <div class="form-group"><label>Assessment Name *</label>
          <input class="form-control" type="text" name="assessment_name" placeholder="e.g. Midterm Exam" required></div>
        <div class="form-row">
          <div class="form-group"><label>Score *</label>
            <input class="form-control" type="number" name="score" step="0.01" min="0" required></div>
          <div class="form-group"><label>Max Score *</label>
            <input class="form-control" type="number" name="max_score" step="0.01" min="0.01" required></div>
          <div class="form-group"><label>Date *</label>
            <input class="form-control" type="date" name="date" value="${TODAY}" required></div>
        </div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">Record Grade</button></div>
      </form>
    </div>
    <div class="card">
      <h3>Grade Records</h3>
      <div class="filter-row" style="margin:12px 0">
        <select id="filter-grade-student" class="form-control" style="max-width:200px"><option value="">All Students</option></select>
        <select id="filter-grade-course"  class="form-control" style="max-width:200px"><option value="">All Courses</option></select>
        <button class="btn btn-outline" onclick="filterGrades()">Filter</button>
        <button class="btn btn-outline" onclick="clearGradeFilter()">Clear</button>
      </div>
      <div id="avg-card" class="avg-card hidden"></div>
      <div id="grades-table"><div class="loading">Loading…</div></div>
    </div>`;

  await Promise.all([
    loadOptions('grade-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`),
    loadOptions('grade-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`),
    loadOptions('filter-grade-student', '/students/', 'id', s => `${s.first_name} ${s.last_name}`, 'All Students'),
    loadOptions('filter-grade-course',  '/courses/',  'id', c => `${c.code} — ${c.name}`,          'All Courses'),
  ]);
  await filterGrades();
}

window.submitGrade = async function (event) {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));
  data.student_id = Number(document.getElementById('grade-student').value);
  data.course_id  = Number(document.getElementById('grade-course').value);
  data.score      = Number(data.score);
  data.max_score  = Number(data.max_score);
  if (!data.student_id || !data.course_id) { toast('Select student and course', 'error'); return; }
  try {
    await api.post('/grades/', data);
    toast('Grade recorded');
    form.reset();
    form.querySelector('[name=date]').value = TODAY;
    await filterGrades();
  } catch (e) { toast(e.message, 'error'); }
};

window.clearGradeFilter = function () {
  ['filter-grade-student','filter-grade-course'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  filterGrades();
};

window.filterGrades = async function () {
  const sid = document.getElementById('filter-grade-student')?.value || '';
  const cid = document.getElementById('filter-grade-course')?.value  || '';
  const container = document.getElementById('grades-table');
  const avgCard   = document.getElementById('avg-card');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const params = new URLSearchParams();
    if (sid) params.set('student_id', sid);
    if (cid) params.set('course_id',  cid);
    const grades = await api.get('/grades/?' + params);
    const [students, courses] = await Promise.all([api.get('/students/'), api.get('/courses/')]);
    const sMap = Object.fromEntries(students.map(s => [s.id, `${s.first_name} ${s.last_name}`]));
    const cMap = Object.fromEntries(courses.map(c  => [c.id, c.code]));

    if (sid && avgCard) {
      try {
        const ap = new URLSearchParams({ student_id: sid });
        if (cid) ap.set('course_id', cid);
        const avg = await api.get('/grades/average?' + ap);
        if (avg.total_assessments > 0) {
          avgCard.classList.remove('hidden');
          avgCard.innerHTML = `
            <span class="avg-label">📊 Average Score</span>
            <span class="avg-value">${avg.average_percentage}%</span>
            <span class="avg-sub">${avg.total_assessments} assessment${avg.total_assessments !== 1 ? 's' : ''}</span>`;
        } else { avgCard.classList.add('hidden'); }
      } catch (_) { avgCard.classList.add('hidden'); }
    } else if (avgCard) { avgCard.classList.add('hidden'); }

    container.innerHTML = `
      <table>
        <thead><tr><th>Student</th><th>Course</th><th>Assessment</th><th>Score</th><th>Max</th><th>%</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${grades.length ? grades.map(g => `
            <tr>
              <td>${esc(sMap[g.student_id] || g.student_id)}</td>
              <td><code>${esc(cMap[g.course_id] || g.course_id)}</code></td>
              <td>${esc(g.assessment_name)}</td>
              <td>${g.score}</td>
              <td>${g.max_score}</td>
              <td><strong>${pct(g.score, g.max_score)}%</strong></td>
              <td>${g.date}</td>
              <td><button class="btn btn-sm btn-danger" onclick="deleteGrade(${g.id})">Delete</button></td>
            </tr>`).join('') : '<tr><td colspan="8" class="empty">No grades found</td></tr>'}
        </tbody>
      </table>`;
  } catch (e) { container.innerHTML = `<div class="error-msg">${esc(e.message)}</div>`; }
};

window.deleteGrade = function (id) {
  openModal('Delete Grade', `
    <p>Delete this grade record?</p>
    <div class="form-actions">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteGrade(${id})">Delete</button>
    </div>`);
};
window.doDeleteGrade = async function (id) {
  try { await api.delete(`/grades/${id}`); toast('Grade deleted'); closeModal(); await filterGrades(); }
  catch (e) { toast(e.message, 'error'); }
};

/* ============================================================
   Init
   ============================================================ */
window.logout = function () {
  sessionStorage.removeItem('sms_auth');
  sessionStorage.removeItem('sms_user');
  window.location.replace('/ui/login.html');
};

document.addEventListener('DOMContentLoaded', () => {
  // Auth guard
  if (sessionStorage.getItem('sms_auth') !== 'true') {
    window.location.replace('/ui/login.html');
    return;
  }

  // Show logged-in username + role label
  const userEl = document.getElementById('sidebar-user');
  if (userEl) {
    const username = sessionStorage.getItem('sms_user') || 'admin';
    const label    = sessionStorage.getItem('sms_label') || ROLE_LABELS[currentRole] || '';
    userEl.innerHTML = `<span class="sidebar-username">${esc(username)}</span>
      <span class="sidebar-role-badge">${esc(label)}</span>`;
  }

  // Dim nav items the current role cannot access
  document.querySelectorAll('.nav-item').forEach(el => {
    const page = el.dataset.page;
    if (!canAccess(page)) {
      el.classList.add('nav-restricted');
      el.title = 'Access restricted for your role';
    }
    el.addEventListener('click', e => { e.preventDefault(); navigate(page); });
  });

  navigate('dashboard');
});
