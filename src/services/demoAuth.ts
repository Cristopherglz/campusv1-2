// Servicio de autenticación en modo DEMO
// Este servicio simula la autenticación de Moodle para pruebas

import type { User, AuthResponse } from '@/types';

// Usuarios de prueba
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'student': {
    password: 'student123',
    user: {
      id: 1,
      username: 'student',
      firstname: 'Juan',
      lastname: 'Pérez',
      fullname: 'Juan Pérez',
      email: 'student@duomo.com',
      profileimageurl: '',
      department: 'Operaciones',
      institution: 'Heladería Duomo',
      city: 'Buenos Aires',
      country: 'AR',
      phone1: '+54 11 1234-5678',
      description: 'Estudiante de capacitación en Heladería Duomo. Apasionado por el servicio al cliente y la preparación de helados artesanales.',
      firstaccess: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
      lastaccess: Math.floor(Date.now() / 1000),
      roles: ['student'],
    }
  },
  'teacher': {
    password: 'teacher123',
    user: {
      id: 2,
      username: 'teacher',
      firstname: 'María',
      lastname: 'González',
      fullname: 'María González',
      email: 'teacher@duomo.com',
      profileimageurl: '',
      department: 'Capacitación',
      institution: 'Heladería Duomo',
      city: 'Buenos Aires',
      country: 'AR',
      phone1: '+54 11 8765-4321',
      description: 'Instructora de capacitación con 5 años de experiencia en Heladería Duomo. Especialista en atención al cliente y procesos de producción.',
      firstaccess: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60,
      lastaccess: Math.floor(Date.now() / 1000),
      roles: ['editingteacher'],
    }
  }
};

// Cursos de prueba
const DEMO_COURSES = [
  {
    id: 1,
    shortname: 'HEL-101',
    fullname: 'Introducción a la Heladería Duomo',
    displayname: 'Introducción a la Heladería Duomo',
    summary: 'Curso básico sobre la historia, valores y procesos de Heladería Duomo.',
    categoryid: 1,
    categoryname: 'Capacitación Básica',
    startdate: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
    enddate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    visible: true,
    progress: 75,
    completed: false,
    enrolledusercount: 45,
    courseimage: '',
    lastaccess: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
  },
  {
    id: 2,
    shortname: 'ATC-201',
    fullname: 'Atención al Cliente de Excelencia',
    displayname: 'Atención al Cliente de Excelencia',
    summary: 'Técnicas de atención al cliente, manejo de quejas y creación de experiencias memorables.',
    categoryid: 1,
    categoryname: 'Capacitación Básica',
    startdate: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
    enddate: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
    visible: true,
    progress: 100,
    completed: true,
    enrolledusercount: 38,
    courseimage: '',
    lastaccess: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60,
  },
  {
    id: 3,
    shortname: 'PRO-301',
    fullname: 'Procesos de Producción',
    displayname: 'Procesos de Producción',
    summary: 'Aprende los procesos de producción de helados artesanales de alta calidad.',
    categoryid: 2,
    categoryname: 'Producción',
    startdate: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60,
    enddate: Math.floor(Date.now() / 1000) + 45 * 24 * 60 * 60,
    visible: true,
    progress: 30,
    completed: false,
    enrolledusercount: 22,
    courseimage: '',
    lastaccess: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60,
  },
  {
    id: 4,
    shortname: 'HIG-401',
    fullname: 'Higiene y Seguridad Alimentaria',
    displayname: 'Higiene y Seguridad Alimentaria',
    summary: 'Normas de higiene, manipulación de alimentos y seguridad en el trabajo.',
    categoryid: 3,
    categoryname: 'Seguridad',
    startdate: Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60,
    enddate: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
    visible: true,
    progress: 0,
    completed: false,
    enrolledusercount: 50,
    courseimage: '',
    lastaccess: 0,
  },
  {
    id: 5,
    shortname: 'LID-501',
    fullname: 'Liderazgo en el Equipo',
    displayname: 'Liderazgo en el Equipo',
    summary: 'Desarrolla habilidades de liderazgo para gestionar equipos de trabajo efectivos.',
    categoryid: 4,
    categoryname: 'Liderazgo',
    startdate: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60,
    enddate: Math.floor(Date.now() / 1000) + 50 * 24 * 60 * 60,
    visible: true,
    progress: 60,
    completed: false,
    enrolledusercount: 15,
    courseimage: '',
    lastaccess: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
  },
];

// Certificados de prueba
const DEMO_CERTIFICATES = [
  {
    id: 1,
    name: 'Certificado de Atención al Cliente',
    courseid: 2,
    issuedate: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60,
    code: 'DUO-ATC-2024-001',
  },
  {
    id: 2,
    name: 'Certificado de Inducción Duomo',
    courseid: 1,
    issuedate: Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60,
    code: 'DUO-IND-2024-001',
  },
];

// Eventos de prueba
const DEMO_EVENTS = [
  {
    id: 1,
    name: 'Evaluación: Atención al Cliente',
    timestart: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    eventtype: 'quiz',
  },
  {
    id: 2,
    name: 'Taller: Preparación de Waffles',
    timestart: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
    eventtype: 'workshop',
  },
  {
    id: 3,
    name: 'Reunión de Equipo',
    timestart: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
    eventtype: 'meeting',
  },
];

class DemoAuthService {
  private currentUser: User | null = null;

  async login(username: string, password: string): Promise<AuthResponse> {
    const demoUser = DEMO_USERS[username.toLowerCase()];
    
    if (!demoUser) {
      return { error: 'Usuario no encontrado', errorcode: 'invalidlogin' };
    }

    if (demoUser.password !== password) {
      return { error: 'Contraseña incorrecta', errorcode: 'invalidlogin' };
    }

    this.currentUser = { ...demoUser.user };
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      token: 'demo-token-' + Date.now(),
      user: this.currentUser,
    };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserCourses(): typeof DEMO_COURSES {
    return DEMO_COURSES;
  }

  getUserCertificates(): typeof DEMO_CERTIFICATES {
    return DEMO_CERTIFICATES;
  }

  getUpcomingEvents(): typeof DEMO_EVENTS {
    return DEMO_EVENTS;
  }

  getCourseById(courseId: number) {
    return DEMO_COURSES.find(c => c.id === courseId);
  }

  getCourseStats() {
    return [
      {
        courseid: 1,
        coursename: 'Introducción a la Heladería Duomo',
        totalstudents: 45,
        activestudents: 38,
        completedstudents: 12,
        averageprogress: 68,
        completionrate: 27,
      },
      {
        courseid: 2,
        coursename: 'Atención al Cliente de Excelencia',
        totalstudents: 38,
        activestudents: 35,
        completedstudents: 30,
        averageprogress: 85,
        completionrate: 79,
      },
      {
        courseid: 3,
        coursename: 'Procesos de Producción',
        totalstudents: 22,
        activestudents: 18,
        completedstudents: 3,
        averageprogress: 42,
        completionrate: 14,
      },
    ];
  }
}

export const demoAuth = new DemoAuthService();

// Credenciales de prueba visibles para el usuario
export const DEMO_CREDENTIALS = {
  student: {
    username: 'student',
    password: 'student123',
    role: 'Estudiante',
    description: 'Acceso a cursos, progreso y certificados'
  },
  teacher: {
    username: 'teacher',
    password: 'teacher123',
    role: 'Instructor (EditingTeacher)',
    description: 'Acceso completo + estadísticas y gestión'
  }
};
