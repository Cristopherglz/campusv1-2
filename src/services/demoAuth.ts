// Servicio de datos DEMO para Campus Duomo LMS
// Simula toda la data que normalmente vendría de Moodle

import type { User, AuthResponse, Course, Grade, Certificate, Notification } from '@/types';

const now = () => Math.floor(Date.now() / 1000);
const days = (n: number) => n * 24 * 60 * 60;

// ============================================
// USUARIOS DEMO
// ============================================

const STUDENT_USER: User = {
  id: 1001,
  username: 'student',
  firstname: 'Juan',
  lastname: 'Pérez',
  fullname: 'Juan Pérez',
  email: 'student@duomo.com.ar',
  profileimageurl: '',
  department: 'Operaciones',
  institution: 'Heladería Duomo',
  city: 'Buenos Aires',
  country: 'AR',
  phone1: '+54 11 1234-5678',
  description: 'Estudiante de capacitación en Heladería Duomo.',
  firstaccess: now() - days(60),
  lastaccess: now(),
  roles: ['student'],
};

const TEACHER_USER: User = {
  id: 2001,
  username: 'teacher',
  firstname: 'María',
  lastname: 'González',
  fullname: 'María González',
  email: 'teacher@duomo.com.ar',
  profileimageurl: '',
  department: 'Capacitación',
  institution: 'Heladería Duomo',
  city: 'Buenos Aires',
  country: 'AR',
  phone1: '+54 11 8765-4321',
  description: 'Instructora de capacitación de Heladería Duomo.',
  firstaccess: now() - days(120),
  lastaccess: now(),
  roles: ['editingteacher'],
  customfields: [{ shortname: 'sucursales', value: '1,2,3,4,5,6' }],
} as any;

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  student: { password: 'student123', user: STUDENT_USER },
  teacher: { password: 'teacher123', user: TEACHER_USER },
};

// ============================================
// CURSOS DEMO (con actividades)
// ============================================

interface DemoActivity { id: number; name: string; completed: boolean }
interface DemoCourse extends Course { activities: DemoActivity[] }

const buildActivities = (total: number, done: number): DemoActivity[] =>
  Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    name: `Actividad ${i + 1}`,
    completed: i < done,
  }));

const DEMO_COURSES_FULL: DemoCourse[] = [
  {
    id: 101, shortname: 'HEL-101',
    fullname: 'Introducción a la Heladería Duomo',
    displayname: 'Introducción a la Heladería Duomo',
    summary: 'Historia, valores y procesos de Heladería Duomo. Bases para el equipo.',
    categoryid: 1, categoryname: 'Capacitación Básica',
    startdate: now() - days(60), enddate: now() + days(30),
    visible: true, progress: 100, completed: true,
    enrolledusercount: 45, lastaccess: now() - days(2),
    activities: buildActivities(10, 10),
  },
  {
    id: 102, shortname: 'ATC-201',
    fullname: 'Atención al Cliente de Excelencia',
    displayname: 'Atención al Cliente de Excelencia',
    summary: 'Técnicas de atención, manejo de quejas y creación de experiencias memorables.',
    categoryid: 1, categoryname: 'Capacitación Básica',
    startdate: now() - days(30), enddate: now() + days(60),
    visible: true, progress: 75, completed: false,
    enrolledusercount: 38, lastaccess: now() - days(1),
    activities: buildActivities(12, 9),
  },
  {
    id: 103, shortname: 'PRO-301',
    fullname: 'Procesos de Producción',
    displayname: 'Procesos de Producción',
    summary: 'Procesos de producción de helados artesanales de alta calidad.',
    categoryid: 2, categoryname: 'Producción',
    startdate: now() - days(15), enddate: now() + days(45),
    visible: true, progress: 30, completed: false,
    enrolledusercount: 22, lastaccess: now() - days(3),
    activities: buildActivities(10, 3),
  },
  {
    id: 104, shortname: 'HIG-401',
    fullname: 'Higiene y Seguridad Alimentaria',
    displayname: 'Higiene y Seguridad Alimentaria',
    summary: 'Normas de higiene, manipulación de alimentos y seguridad laboral.',
    categoryid: 3, categoryname: 'Seguridad',
    startdate: now() - days(45), enddate: now() + days(15),
    visible: true, progress: 0, completed: false,
    enrolledusercount: 50, lastaccess: 0,
    activities: buildActivities(8, 0),
  },
  {
    id: 105, shortname: 'LID-501',
    fullname: 'Liderazgo en el Equipo',
    displayname: 'Liderazgo en el Equipo',
    summary: 'Habilidades de liderazgo para gestionar equipos efectivos.',
    categoryid: 4, categoryname: 'Liderazgo',
    startdate: now() - days(10), enddate: now() + days(50),
    visible: true, progress: 60, completed: false,
    enrolledusercount: 15, lastaccess: now() - days(4),
    activities: buildActivities(10, 6),
  },
];

// ============================================
// CERTIFICADOS
// ============================================

const DEMO_CERTIFICATES: Certificate[] = DEMO_COURSES_FULL
  .filter(c => c.completed)
  .map((c, idx) => ({
    id: c.id,
    name: `Certificado: ${c.fullname}`,
    course: c.fullname,
    courseid: c.id,
    coursename: c.fullname,
    dateissued: new Date((now() - days(10 + idx * 5)) * 1000).toISOString().split('T')[0],
    issuedate: now() - days(10 + idx * 5),
    code: `DUO-${c.shortname}-2026-00${idx + 1}`,
    status: 'active',
    downloadurl: '#',
  }));

// ============================================
// CALIFICACIONES
// ============================================

const DEMO_GRADES: Grade[] = DEMO_COURSES_FULL.flatMap(course =>
  course.activities
    .filter(a => a.completed)
    .map((a, idx) => ({
      courseid: course.id,
      coursename: course.fullname,
      itemid: course.id * 1000 + a.id,
      itemname: a.name,
      itemtype: 'mod',
      itemmodule: 'quiz',
      grade: 70 + Math.floor(Math.random() * 30),
      rawgrade: 70 + Math.floor(Math.random() * 30),
      percentage: 70 + Math.floor(Math.random() * 30),
      dategraded: now() - days(idx * 2),
      datesubmitted: now() - days(idx * 2 + 1),
      str_grade: `${70 + Math.floor(Math.random() * 30)}`,
    }))
);

// ============================================
// ESTUDIANTES (para vista de profesor)
// ============================================

const buildStudentCourses = (seed: number) =>
  DEMO_COURSES_FULL.map(({ activities, ...c }, idx) => ({
    ...c,
    progress: Math.max(0, Math.min(100, (c.progress ?? 0) + ((seed * 7 + idx * 13) % 40) - 20)),
  }));

const DEMO_STUDENTS: User[] = [
  { id: 1001, username: 'jperez', firstname: 'Juan', lastname: 'Pérez', fullname: 'Juan Pérez', email: 'juan@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Palermo', lastaccess: now() - days(1), customfields: [{ shortname: 'sucursales', value: '1' }], enrolledCourses: buildStudentCourses(1) } as any,
  { id: 1002, username: 'mrodriguez', firstname: 'Micaela', lastname: 'Rodríguez', fullname: 'Micaela Rodríguez', email: 'mica@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Recoleta', lastaccess: now() - days(3), customfields: [{ shortname: 'sucursales', value: '2' }], enrolledCourses: buildStudentCourses(2) } as any,
  { id: 1003, username: 'lgomez', firstname: 'Lucas', lastname: 'Gómez', fullname: 'Lucas Gómez', email: 'lucas@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Belgrano', lastaccess: now() - days(10), customfields: [{ shortname: 'sucursales', value: '3' }], enrolledCourses: buildStudentCourses(3) } as any,
  { id: 1004, username: 'sfernandez', firstname: 'Sofía', lastname: 'Fernández', fullname: 'Sofía Fernández', email: 'sofia@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Caballito', lastaccess: now() - days(0), customfields: [{ shortname: 'sucursales', value: '4' }], enrolledCourses: buildStudentCourses(4) } as any,
  { id: 1005, username: 'nlopez', firstname: 'Nicolás', lastname: 'López', fullname: 'Nicolás López', email: 'nico@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Villa Urquiza', lastaccess: now() - days(5), customfields: [{ shortname: 'sucursales', value: '5' }], enrolledCourses: buildStudentCourses(5) } as any,
  { id: 1006, username: 'atorres', firstname: 'Agustina', lastname: 'Torres', fullname: 'Agustina Torres', email: 'agus@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Palermo', lastaccess: now() - days(2), customfields: [{ shortname: 'sucursales', value: '1' }], enrolledCourses: buildStudentCourses(6) } as any,
  { id: 1007, username: 'vsuarez', firstname: 'Valentina', lastname: 'Suárez', fullname: 'Valentina Suárez', email: 'valen@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Núñez', lastaccess: now() - days(1), customfields: [{ shortname: 'sucursales', value: '2' }], enrolledCourses: buildStudentCourses(7) } as any,
  { id: 1008, username: 'mramos', firstname: 'Matías', lastname: 'Ramos', fullname: 'Matías Ramos', email: 'mati@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Almagro', lastaccess: now() - days(4), customfields: [{ shortname: 'sucursales', value: '3' }], enrolledCourses: buildStudentCourses(8) } as any,
  { id: 1009, username: 'ccastro', firstname: 'Camila', lastname: 'Castro', fullname: 'Camila Castro', email: 'cami@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Flores', lastaccess: now() - days(8), customfields: [{ shortname: 'sucursales', value: '6' }], enrolledCourses: buildStudentCourses(9) } as any,
  { id: 1010, username: 'bmolina', firstname: 'Bruno', lastname: 'Molina', fullname: 'Bruno Molina', email: 'bruno@duomo.com.ar', profileimageurl: '', roles: ['student'], department: 'Barracas', lastaccess: now() - days(0), customfields: [{ shortname: 'sucursales', value: '4' }], enrolledCourses: buildStudentCourses(10) } as any,
];

// ============================================
// NOTIFICACIONES / EVENTOS / ASIGNACIONES
// ============================================

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, useridfrom: 0, useridto: 1001, subject: 'Nueva actividad en Atención al Cliente', text: 'Se agregó una nueva evaluación.', fullmessage: 'Se agregó una nueva evaluación al curso Atención al Cliente de Excelencia.', timecreated: now() - days(1), read: false, contexturl: '/courses/102' } as any,
  { id: 2, useridfrom: 0, useridto: 1001, subject: 'Recordatorio: Taller de Waffles', text: 'El taller comienza en 3 días.', fullmessage: 'El taller comienza en 3 días. No olvides revisar el material.', timecreated: now() - days(2), read: false, contexturl: '/dashboard' } as any,
  { id: 3, useridfrom: 0, useridto: 1001, subject: 'Certificado emitido', text: 'Tu certificado de Inducción está disponible.', fullmessage: 'Tu certificado de Inducción Duomo ya está disponible en la sección Certificados.', timecreated: now() - days(10), read: true, contexturl: '/certificates' } as any,
];

const DEMO_EVENTS = [
  { id: 1, name: 'Evaluación: Atención al Cliente', timestart: now() + days(7), eventtype: 'quiz', courseid: 102 },
  { id: 2, name: 'Taller: Preparación de Waffles', timestart: now() + days(14), eventtype: 'workshop', courseid: 103 },
  { id: 3, name: 'Reunión de Equipo', timestart: now() + days(3), eventtype: 'meeting', courseid: 0 },
];

const DEMO_ASSIGNMENTS = DEMO_COURSES_FULL.map(c => ({
  id: c.id,
  fullname: c.fullname,
  assignments: [
    { id: c.id * 10 + 1, name: `Entrega práctica de ${c.shortname}`, duedate: now() + days(5 + (c.id % 10)), courseid: c.id },
  ],
}));

// ============================================
// SERVICIO
// ============================================

class DemoAuthService {
  private currentUser: User | null = null;

  async login(username: string, password: string): Promise<AuthResponse> {
    const demoUser = DEMO_USERS[username.toLowerCase()];
    if (!demoUser) return { error: 'Usuario no encontrado', errorcode: 'invalidlogin' };
    if (demoUser.password !== password) return { error: 'Contraseña incorrecta', errorcode: 'invalidlogin' };
    this.currentUser = { ...demoUser.user };
    await new Promise(r => setTimeout(r, 300));
    return { token: 'demo-token-' + Date.now(), user: this.currentUser };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  createUser(u: { firstname: string; lastname: string; email: string; username: string }): User {
    const newUser: User = {
      id: 9000 + DEMO_STUDENTS.length + 1,
      username: u.username,
      firstname: u.firstname,
      lastname: u.lastname,
      fullname: `${u.firstname} ${u.lastname}`,
      email: u.email,
      profileimageurl: '',
      roles: ['student'],
      department: 'Nueva',
      lastaccess: now(),
    };
    DEMO_STUDENTS.push(newUser);
    return newUser;
  }

  restoreUser(user: User) { this.currentUser = user; }
  getCurrentUser(): User | null { return this.currentUser; }

  getUserProfile(userid?: number): User {
    if (userid === TEACHER_USER.id) return { ...TEACHER_USER };
    if (userid === STUDENT_USER.id) return { ...STUDENT_USER };
    const student = DEMO_STUDENTS.find(s => s.id === userid);
    if (student) return { ...student };
    return this.currentUser ? { ...this.currentUser } : { ...STUDENT_USER };
  }

  getUserCourses(): Course[] {
    return DEMO_COURSES_FULL.map(({ activities, ...c }) => c);
  }

  getUserCertificates(): Certificate[] { return [...DEMO_CERTIFICATES]; }

  getAllUserGrades(): Grade[] { return [...DEMO_GRADES]; }

  getUserGrades(courseid?: number): Grade[] {
    return courseid ? DEMO_GRADES.filter(g => g.courseid === courseid) : [...DEMO_GRADES];
  }

  getAllStudents(): User[] { return [...DEMO_STUDENTS]; }

  getNotifications(): Notification[] { return [...DEMO_NOTIFICATIONS]; }

  getUpcomingEvents() { return [...DEMO_EVENTS]; }

  getAssignments() { return [...DEMO_ASSIGNMENTS]; }

  getCourseCompletionStatus(courseid: number) {
    const c = DEMO_COURSES_FULL.find(x => x.id === courseid);
    if (!c) return null;
    return {
      completed: c.completed,
      completionstate: c.completed ? 1 : 0,
      timecompleted: c.completed ? now() - days(10) : undefined,
      completions: c.activities.map(a => ({
        type: 'activity',
        title: a.name,
        complete: a.completed,
        completionstate: a.completed ? 1 : 0,
      })),
    };
  }

  getCourseById(id: number): Course | undefined {
    const c = DEMO_COURSES_FULL.find(x => x.id === id);
    if (!c) return undefined;
    const { activities, ...rest } = c;
    return rest;
  }

  getStudentDashboard() {
    const courses = this.getUserCourses();
    const certificates = this.getUserCertificates();
    const grades = this.getAllUserGrades();
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => (c.progress ?? 0) >= 100).length;
    const inProgressCourses = totalCourses - completedCourses;
    const overallProgress = totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;
    let totalActivities = 0, completedActivities = 0;
    DEMO_COURSES_FULL.forEach(c => {
      totalActivities += c.activities.length;
      completedActivities += c.activities.filter(a => a.completed).length;
    });
    const averageGrade = grades.length
      ? Math.round(grades.reduce((s, g) => s + (g.grade || 0), 0) / grades.length)
      : 0;
    return {
      user: this.currentUser || STUDENT_USER,
      courses,
      grades,
      certificates,
      upcomingAssignments: DEMO_ASSIGNMENTS.flatMap(a => a.assignments).slice(0, 5),
      recentActivity: [],
      upcomingEvents: DEMO_EVENTS,
      notifications: DEMO_NOTIFICATIONS,
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        overallProgress,
        averageProgress: overallProgress,
        averageGrade,
        totalActivities,
        completedActivities,
        totalCertificates: certificates.length,
      },
    };
  }

  getTeacherDashboard() {
    const base = this.getStudentDashboard();
    const allStudents = this.getAllStudents();
    const inactive = allStudents.filter(s => {
      const la = s.lastaccess || 0;
      return !la || (now() - la) > days(7);
    });
    return {
      ...base,
      allStudents,
      inactiveStudents: inactive,
      pendingSubmissions: DEMO_ASSIGNMENTS.flatMap(a => a.assignments).slice(0, 3),
      stats: {
        ...base.stats,
        totalStudents: allStudents.length,
        activeStudents: allStudents.length - inactive.length,
        inactiveStudents: inactive.length,
      },
    };
  }
}

export const demoAuth = new DemoAuthService();

export const DEMO_CREDENTIALS = {
  student: { username: 'student', password: 'student123', role: 'Estudiante', description: 'Acceso a cursos, progreso y certificados' },
  teacher: { username: 'teacher', password: 'teacher123', role: 'Instructor (EditingTeacher)', description: 'Acceso completo + estadísticas y gestión' },
};
