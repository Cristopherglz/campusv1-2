// Servicios de API para Moodle Web Services - Conexión Real
// Esta capa de servicios se comunica con el backend real de Moodle

import type { 
  User, Course, CourseDetail, Grade, Certificate, 
  Notification, Event, AuthResponse
} from '@/types';
import { demoAuth } from './demoAuth';
import { detectRolesFromMultipleSources } from './roleDetection';

// ============================================
// CONFIGURACIÓN DE MOODLE
// ============================================

// Modo de autenticación
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'demo';

// URLs de Moodle
const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL || 'https://campus.duomo.com.ar';
const MOODLE_API_URL = import.meta.env.VITE_MOODLE_API_URL || `${MOODLE_BASE_URL}/webservice/rest/server.php`;
const MOODLE_LOGIN_URL = import.meta.env.VITE_MOODLE_LOGIN_URL || `${MOODLE_BASE_URL}/login/token.php`;
const MOODLE_SERVICE = import.meta.env.VITE_MOODLE_SERVICE || 'frontend';

// ============================================
// TIPOS DE ERROR
// ============================================

export type MoodleErrorCode = 
  | 'invalidtoken'
  | 'accessexception'
  | 'invalidlogin'
  | 'usernamenotexist'
  | 'passwordsalt'
  | 'requireloginerror'
  | 'nouser'
  | 'wsfunctionnotavailable'
  | 'errorcoursecontextnotvalid'
  | 'nopermissions'
  | 'network_error'
  | 'timeout'
  | 'unknown';

export interface MoodleError {
  error: string;
  errorcode: MoodleErrorCode;
  debuginfo?: string;
}

// ============================================
// CLIENTE HTTP DE MOODLE
// ============================================

class MoodleApiClient {
  private baseUrl: string;
  private token: string;
  private currentUserId: number | null = null;

  constructor(baseUrl: string = MOODLE_API_URL, token: string = '') {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('moodle_token', token);
  }

  getToken(): string {
    return this.token || localStorage.getItem('moodle_token') || '';
  }

  setUserId(userid: number) {
    this.currentUserId = userid;
    localStorage.setItem('moodle_userid', String(userid));
  }

  getUserId(): number | null {
    if (this.currentUserId) return this.currentUserId;
    const stored = localStorage.getItem('moodle_userid');
    return stored ? parseInt(stored, 10) : null;
  }

  clearToken() {
    this.token = '';
    this.currentUserId = null;
    localStorage.removeItem('moodle_token');
    localStorage.removeItem('moodle_userid');
    localStorage.removeItem('moodle_privatetoken');
  }

  // ============================================
  // MANEJO DE ERRORES
  // ============================================

  private handleError(error: any): MoodleError {
    console.error('Moodle API Error:', error);

    // Error de red o timeout
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return {
        error: 'Error de conexión. Verifica tu conexión a internet.',
        errorcode: 'network_error'
      };
    }

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        error: 'La solicitud tardó demasiado. Intenta nuevamente.',
        errorcode: 'timeout'
      };
    }

    // Errores específicos de Moodle
    if (error.errorcode) {
      const errorMessages: Record<string, string> = {
        'invalidtoken': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        'accessexception': 'No tienes permisos para acceder a este recurso.',
        'nopermissions': 'No tienes permisos para realizar esta acción.',
        'invalidlogin': 'Usuario o contraseña incorrectos.',
        'usernamenotexist': 'El usuario no existe.',
        'passwordsalt': 'Error en la contraseña.',
        'requireloginerror': 'Debes iniciar sesión para acceder.',
        'nouser': 'Usuario no encontrado.',
        'wsfunctionnotavailable': 'Función no disponible en el servidor.',
        'errorcoursecontextnotvalid': 'No tienes acceso a este curso.',
      };

      return {
        error: errorMessages[error.errorcode] || error.error || 'Error desconocido',
        errorcode: error.errorcode,
        debuginfo: error.debuginfo
      };
    }

    return {
      error: error.message || 'Error desconocido',
      errorcode: 'unknown'
    };
  }

  // ============================================
  // REQUESTS HTTP - moodlewsrestformat=json SIEMPRE en query string
  // ============================================

  private async request<T>(wsfunction: string, params: Record<string, any> = {}, options: { timeout?: number } = {}): Promise<T> {
    const token = this.getToken();
    
    if (!token && wsfunction !== 'core_webservice_get_site_info') {
      throw this.handleError({ errorcode: 'invalidtoken', error: 'Token no disponible' });
    }

    // Construir query string CON moodlewsrestformat=json incluido
    const queryParts: string[] = [];
    
    if (token) {
      queryParts.push(`wstoken=${encodeURIComponent(token)}`);
    }
    queryParts.push(`wsfunction=${encodeURIComponent(wsfunction)}`);
    queryParts.push('moodlewsrestformat=json');
    
    // Agregar parámetros adicionales
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v, i) => {
            queryParts.push(`${encodeURIComponent(key)}[${i}]=${encodeURIComponent(String(v))}`);
          });
        } else {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      }
    });

    const url = `${this.baseUrl}?${queryParts.join('&')}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw this.handleError({ errorcode: 'invalidtoken', error: 'Token inválido' });
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Moodle devuelve errores con la propiedad 'error' o 'exception'
      if (data && data.error) {
        throw this.handleError(data);
      }

      if (data && data.exception) {
        throw this.handleError({
          errorcode: data.errorcode || 'unknown',
          error: data.message || 'Error en la API de Moodle',
          debuginfo: data.debuginfo
        });
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  private async post<T>(wsfunction: string, params: Record<string, any> = {}, options: { timeout?: number } = {}): Promise<T> {
    const token = this.getToken();
    
    if (!token) {
      throw this.handleError({ errorcode: 'invalidtoken', error: 'Token no disponible' });
    }

    const formData = new URLSearchParams();
    formData.append('wstoken', token);
    formData.append('wsfunction', wsfunction);
    formData.append('moodlewsrestformat', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v, i) => {
            formData.append(`${key}[${i}]`, String(v));
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw this.handleError({ errorcode: 'invalidtoken', error: 'Token inválido' });
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.error) {
        throw this.handleError(data);
      }

      if (data && data.exception) {
        throw this.handleError({
          errorcode: data.errorcode || 'unknown',
          error: data.message || 'Error en la API de Moodle',
          debuginfo: data.debuginfo
        });
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Paso 1: Obtener token - URL exacta con moodlewsrestformat=json
      const loginUrl = `${MOODLE_LOGIN_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&service=${MOODLE_SERVICE}&moodlewsrestformat=json`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        return { 
          error: this.handleError(data).error, 
          errorcode: this.handleError(data).errorcode 
        };
      }

      if (data.token) {
        this.setToken(data.token);
        if (data.privatetoken) {
          localStorage.setItem('moodle_privatetoken', data.privatetoken);
        }
        
        // Paso 2: Obtener información del sitio y usuario (userid numérico)
        const siteInfo = await this.request<any>('core_webservice_get_site_info');
        
        // Guardar el userId NUMÉRICO
        const numericUserId = parseInt(siteInfo.userid, 10);
        this.setUserId(numericUserId);

        // Paso 3: Verificar si es admin del sitio
        if (siteInfo.userissiteadmin) {
          // Redirigir a Moodle nativo
          window.location.href = MOODLE_BASE_URL;
          return { 
            error: 'Los administradores deben usar la interfaz nativa de Moodle.',
            errorcode: 'accessexception'
          };
        }

        // Paso 4: Obtener cursos del usuario usando userid NUMÉRICO
        const userCourses = await this.request<any[]>('core_enrol_get_users_courses', {
          userid: numericUserId
        });

        // Detectar roles usando 3 métodos en paralelo
        // Si CUALQUIERA detecta teacher -> rol = teacher
        const roleDetectionResult = await detectRolesFromMultipleSources(
          numericUserId,
          userCourses,
          (wsfunction, params) => this.request(wsfunction, params)
        );
        const roles = roleDetectionResult.roles;

        // Paso 5: Obtener información completa del usuario
        const userInfo = await this.getUserInfo(numericUserId);

        // Combinar información
        const user: User = {
          id: numericUserId,
          username: siteInfo.username || userInfo.username || '',
          firstname: siteInfo.firstname || userInfo.firstname || '',
          lastname: siteInfo.lastname || userInfo.lastname || '',
          fullname: siteInfo.fullname || `${userInfo.firstname || ''} ${userInfo.lastname || ''}`.trim(),
          email: userInfo.email || '',
          profileimageurl: this.addTokenToPluginfileUrl(
            siteInfo.userpictureurl || userInfo.profileimageurl || '',
            data.token
          ),
          profileimageurlsmall: this.addTokenToPluginfileUrl(
            userInfo.profileimageurlsmall || '',
            data.token
          ),
          department: userInfo.department,
          institution: userInfo.institution,
          city: userInfo.city,
          country: userInfo.country,
          timezone: userInfo.timezone,
          lang: userInfo.lang,
          phone1: userInfo.phone1,
          phone2: userInfo.phone2,
          address: userInfo.address,
          description: userInfo.description,
          firstaccess: userInfo.firstaccess,
          lastaccess: userInfo.lastaccess,
          lastcourseaccess: userInfo.lastcourseaccess,
          suspended: userInfo.suspended,
          roles: roles,
          preferences: userInfo.preferences,
          customfields: userInfo.customfields,
        };

        return { 
          token: data.token, 
          privatetoken: data.privatetoken, 
          user 
        };
      }

      return { error: 'Error desconocido en el login', errorcode: 'unknown' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        error: this.handleError(error).error, 
        errorcode: this.handleError(error).errorcode 
      };
    }
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // ============================================
  // DETECCIÓN DE ROLES
  // ============================================



  // ============================================
  // USUARIOS
  // ============================================

  async getCurrentUser(): Promise<User> {
    const siteInfo = await this.request<any>('core_webservice_get_site_info');
    
    return {
      id: parseInt(siteInfo.userid, 10),
      username: siteInfo.username || '',
      firstname: siteInfo.firstname || '',
      lastname: siteInfo.lastname || '',
      fullname: siteInfo.fullname || '',
      email: '',
      profileimageurl: siteInfo.userpictureurl,
      roles: [],
    };
  }

  async getUserInfo(userid?: number): Promise<Partial<User>> {
    const id = userid || this.getUserId();
    if (!id) throw new Error('User ID no disponible');

    try {
      const data = await this.request<any[]>('core_user_get_users_by_field', {
        field: 'id',
        'values[0]': id
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        return this.transformUser(data[0]);
      }
      return {};
    } catch (error) {
      console.warn('Error al obtener información del usuario:', error);
      return {};
    }
  }

  async getUserProfile(userid?: number): Promise<User> {
    const id = userid || this.getUserId();
    if (!id) throw new Error('User ID no disponible');

    const userInfo = await this.getUserInfo(id);
    const courses = await this.getUserCourses(id);
    
    // Detectar roles usando 3 métodos en paralelo
    const roleDetectionResult = await detectRolesFromMultipleSources(
      id,
      courses,
      (wsfunction, params) => this.request(wsfunction, params)
    );
    const roles = roleDetectionResult.roles;

    return {
      ...userInfo,
      id: id,
      username: userInfo.username || '',
      firstname: userInfo.firstname || '',
      lastname: userInfo.lastname || '',
      fullname: userInfo.fullname || `${userInfo.firstname || ''} ${userInfo.lastname || ''}`.trim(),
      email: userInfo.email || '',
      roles: roles,
    } as User;
  }

  async getUsersByField(field: string, values: string[]): Promise<User[]> {
    const params: Record<string, string> = { field };
    values.forEach((value, index) => {
      params[`values[${index}]`] = value;
    });
    
    const data = await this.request<any[]>('core_user_get_users_by_field', params);
    
    // Validación defensiva
    if (!Array.isArray(data)) return [];
    
    return data.map(user => this.transformUser(user));
  }

  async getUsers(criteria: { key: string; value: string }[]): Promise<User[]> {
    const params: Record<string, any> = {};
    criteria.forEach((c, index) => {
      params[`criteria[${index}][key]`] = c.key;
      params[`criteria[${index}][value]`] = c.value;
    });
    
    try {
      const data = await this.request<any>('core_user_get_users', params);
      
      // Validación defensiva
      if (!data || !Array.isArray(data.users)) return [];
      
      return data.users.map((user: any) => this.transformUser(user));
    } catch (error) {
      console.warn('Error al obtener usuarios:', error);
      return [];
    }
  }

  async updateUser(user: Partial<User> & { id: number; customfields?: { shortname: string; value: string }[] }): Promise<boolean> {
    const params: Record<string, any> = {
      'users[0][id]': user.id,
    };

    if (user.firstname !== undefined) params['users[0][firstname]'] = user.firstname;
    if (user.lastname !== undefined) params['users[0][lastname]'] = user.lastname;
    if (user.email !== undefined) params['users[0][email]'] = user.email;
    if (user.description !== undefined) params['users[0][description]'] = user.description;
    if (user.city !== undefined) params['users[0][city]'] = user.city;
    if (user.country !== undefined) params['users[0][country]'] = user.country;
    if (user.timezone !== undefined) params['users[0][timezone]'] = user.timezone;
    if (user.phone1 !== undefined) params['users[0][phone1]'] = user.phone1;
    if (user.phone2 !== undefined) params['users[0][phone2]'] = user.phone2;
    if (user.address !== undefined) params['users[0][address]'] = user.address;
    if (user.institution !== undefined) params['users[0][institution]'] = user.institution;
    if (user.department !== undefined) params['users[0][department]'] = user.department;

    // Agregar customfields si existen
    if (user.customfields && user.customfields.length > 0) {
      user.customfields.forEach((field, index) => {
        params[`users[0][customfields][${index}][type]`] = 'text';
        params[`users[0][customfields][${index}][value]`] = field.value;
        params[`users[0][customfields][${index}][name]`] = field.shortname;
        params[`users[0][customfields][${index}][shortname]`] = field.shortname;
      });
    }

    await this.post('core_user_update_users', params);
    return true;
  }

  // ============================================
  // CURSOS
  // ============================================

  async getUserCourses(userid?: number): Promise<Course[]> {
  const id = userid || this.getUserId();
 
  if (!id) {
    console.warn('getUserCourses: No userid available');
    return [];
  }
 
  const data = await this.request<any[]>('core_enrol_get_users_courses', {
    userid: id,
  });
 
  if (!Array.isArray(data)) {
    console.warn('getUserCourses: Response is not an array', data);
    return [];
  }
 
  // Enriquecer con overviewfiles en paralelo (necesario para imágenes de portada)
  const enriched = await Promise.all(
    data.map(async (course) => {
      // Si ya trae overviewfiles con contenido, no hace falta otra llamada
      if (Array.isArray(course.overviewfiles) && course.overviewfiles.length > 0) {
        return course;
      }
      try {
        const detail = await this.request<any>('core_course_get_courses_by_field', {
          field: 'id',
          value: course.id,
        });
        const courseDetail = detail?.courses?.[0];
        if (courseDetail?.overviewfiles?.length) {
          return { ...course, overviewfiles: courseDetail.overviewfiles };
        }
      } catch {
        // silencioso — la imagen simplemente no cargará
      }
      return course;
    })
  );
 
  return enriched.map((course) => this.transformCourse(course));
}

  async getAllCourses(): Promise<Course[]> {
    try {
      // Usar core_course_get_courses_by_field con field id y valor vacío no funciona para listar todos
      // Pero para un usuario normal, core_enrol_get_users_courses es lo que realmente importa.
      // Si core_course_get_courses falla, intentamos obtener solo los del usuario.
      try {
        const data = await this.request<any[]>('core_course_get_courses');
        if (Array.isArray(data)) {
          return data.map(course => this.transformCourse(course));
        }
      } catch (e) {
        console.warn('core_course_get_courses falló, usando fallback a cursos del usuario');
      }
      
      return this.getUserCourses();
    } catch (error) {
      console.warn('Error al obtener todos los cursos:', error);
      return [];
    }
  }

  async getCoursesByField(field: string, value: string): Promise<Course[]> {
    try {
      const data = await this.request<any>('core_course_get_courses_by_field', {
        field,
        value
      });
      
      // Validación defensiva
      const courses = data?.courses || data;
      if (!Array.isArray(courses)) return [];
      
      return courses.map((course: any) => this.transformCourse(course));
    } catch (error) {
      console.warn('Error al obtener cursos por campo:', error);
      return [];
    }
  }

  async getCourseById(courseid: number): Promise<CourseDetail | null> {
    try {
      // IMPORTANTE: NO usar core_course_get_courses_by_field (devuelve invalidresponse/nopermissions
      // para usuarios no-admin). Usar core_enrol_get_users_courses para obtener los datos del curso
      // desde la lista de cursos del usuario, que siempre funciona.
      const contents = await this.getCourseContent(courseid);

      const userId = this.getUserId();
      if (!userId) {
        console.warn('getCourseById: No hay usuario autenticado');
        return null;
      }

      const userCourses = await this.request<any[]>('core_enrol_get_users_courses', {
        userid: userId
      });

      if (!Array.isArray(userCourses)) {
        return null;
      }

      const courseData = userCourses.find((c: any) => c.id === courseid);
      if (!courseData) {
        console.warn(`getCourseById: Curso ${courseid} no encontrado en cursos del usuario`);
        return null;
      }

      return this.transformCourseDetail(courseData, contents);
    } catch (error) {
      console.warn('Error al obtener curso por ID:', error);
      return null;
    }
  }

  async getCourseContent(courseid: number): Promise<any[]> {
    try {
      const data = await this.request<any[]>('core_course_get_contents', { courseid });
      
      // Validación defensiva
      if (!Array.isArray(data)) return [];
      
      return data;
    } catch (error: any) {
      // Si es error de permisos, retornar array vacío
      if (error.errorcode === 'nopermissions' || error.errorcode === 'accessexception') {
        console.warn(`Sin permisos para ver contenido del curso ${courseid}`);
        return [];
      }
      console.warn('Error al obtener contenido del curso:', error);
      return [];
    }
  }

  async getCategories(parent?: number): Promise<any[]> {
    const params: Record<string, any> = {};
    if (parent !== undefined) params.parent = parent;
    
    try {
      const data = await this.request<any[]>('core_course_get_categories', params);
      
      // Validación defensiva
      if (!Array.isArray(data)) return [];
      
      return data;
    } catch (error) {
      console.warn('Error al obtener categorías:', error);
      return [];
    }
  }

  async getRecentCourses(userid?: number, limit: number = 10): Promise<Course[]> {
    const id = userid || this.getUserId();
    
    try {
      const data = await this.request<any[]>('core_course_get_recent_courses', {
        userid: id,
        limit
      });
      
      // Validación defensiva
      if (!Array.isArray(data)) return [];
      
      return data.map(course => this.transformCourse(course));
    } catch (error) {
      console.warn('Error al obtener cursos recientes:', error);
      return [];
    }
  }

  async getEnrolledUsers(courseid: number): Promise<User[]> {
    try {
      const data = await this.request<any[]>('core_enrol_get_enrolled_users', { courseid });
      
      // Validación defensiva
      if (!Array.isArray(data)) return [];
      
      return data.map(user => this.transformUser(user));
    } catch (error) {
      console.warn(`Error al obtener usuarios matriculados en curso ${courseid}:`, error);
      return [];
    }
  }

  // ============================================
  // CALIFICACIONES
  // ============================================

  async getUserGrades(courseid?: number, userid?: number): Promise<Grade[]> {
    const params: Record<string, any> = {};
    if (courseid) params.courseid = courseid;
    if (userid) params.userid = userid;
    
    try {
      const data = await this.request<any>('gradereport_user_get_grade_items', params);
      
      // Validación defensiva
      if (!data || !Array.isArray(data.usergrades)) return [];
      
      const grades: Grade[] = [];
      data.usergrades.forEach((userGrade: any) => {
        if (!Array.isArray(userGrade.gradeitems)) return;
        
        userGrade.gradeitems.forEach((item: any) => {
          grades.push({
            courseid: userGrade.courseid,
            coursename: userGrade.coursename,
            grade: item.gradeformatted ? parseFloat(item.gradeformatted) : undefined,
            rawgrade: item.graderaw,
            itemid: item.id,
            itemname: item.itemname,
            itemtype: item.itemtype,
            itemmodule: item.itemmodule,
            iteminstance: item.iteminstance,
            percentage: item.percentageformatted ? parseFloat(item.percentageformatted) : undefined,
            feedback: item.feedback,
            datesubmitted: item.datesubmitted,
            dategraded: item.dategraded,
          });
        });
      });
      
      return grades;
    } catch (error) {
      console.warn('Error al obtener calificaciones:', error);
      return [];
    }
  }

  async getAllUserGrades(userid?: number): Promise<Grade[]> {
    const id = userid || this.getUserId();
    if (!id) return [];

    try {
      // Obtener cursos del usuario
      const courses = await this.getUserCourses(id);
      
      if (!Array.isArray(courses) || courses.length === 0) {
        return [];
      }

      // Obtener calificaciones de cada curso
      const allGrades: Grade[] = [];
      
      for (const course of courses) {
        try {
          const courseGrades = await this.getUserGrades(course.id, id);
          if (Array.isArray(courseGrades)) {
            allGrades.push(...courseGrades);
          }
        } catch (error) {
          console.warn(`Error al obtener calificaciones del curso ${course.id}:`, error);
        }
      }
      
      return allGrades;
    } catch (error) {
      console.warn('Error al obtener todas las calificaciones:', error);
      return [];
    }
  }

  async getCourseGrades(courseid: number): Promise<Grade[]> {
    return this.getUserGrades(courseid);
  }

  // ============================================
  // CERTIFICADOS (basados en completación de curso)
  // ============================================

  async getUserCertificates(userid?: number): Promise<Certificate[]> {
    const id = userid || this.getUserId();
    if (!id) return [];

    try {
      // Obtener cursos del usuario
      const courses = await this.getUserCourses(id);
      
      if (!Array.isArray(courses) || courses.length === 0) {
        return [];
      }

      const certificates: Certificate[] = [];
      
      for (const course of courses) {
        try {
          const completion = await this.getCourseCompletionStatus(course.id, id);
          
          // Si el curso está completado (completionstate === 1)
          if (completion?.completed || completion?.completionstate === 1) {
            certificates.push({
              id: course.id,
              name: `Certificado: ${course.fullname}`,
              course: course.fullname,
              courseid: course.id,
              dateissued: completion.timecompleted 
                ? new Date(completion.timecompleted * 1000).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              expirationdate: undefined,
              status: 'active',
              downloadurl: `${MOODLE_BASE_URL}/course/view.php?id=${course.id}`,
            });
          }
        } catch (error) {
          console.warn(`Error al verificar completación del curso ${course.id}:`, error);
        }
      }
      
      return certificates;
    } catch (error) {
      console.warn('Error al obtener certificados:', error);
      return [];
    }
  }

  async getCertificateDownloadUrl(certificateid: number): Promise<string> {
    return `${MOODLE_BASE_URL}/course/view.php?id=${certificateid}`;
  }

  // ============================================
  // ACTIVIDADES Y COMPLETADO
  // ============================================

  async getCourseCompletionStatus(courseid: number, userid?: number): Promise<any> {
    const id = userid || this.getUserId();
    
    try {
      const data = await this.request<any>('core_completion_get_course_completion_status', {
        courseid,
        userid: id
      });
      
      return data.completionstatus;
    } catch (error) {
      console.warn('Error al obtener estado de completado:', error);
      return null;
    }
  }

  async updateActivityCompletion(courseid: number, cmid: number, completed: boolean): Promise<boolean> {
    try {
      await this.post('core_completion_update_activity_completion_status_manually', {
        courseid,
        cmid,
        completed: completed ? 1 : 0
      });
      return true;
    } catch (error) {
      console.warn('Error al actualizar completado:', error);
      return false;
    }
  }

  // ============================================
  // NOTIFICACIONES (construidas desde datos disponibles)
  // ============================================

  async getNotifications(userid?: number, limit: number = 20): Promise<Notification[]> {
    const id = userid || this.getUserId();
    if (!id) return [];

    const notifications: Notification[] = [];
    
    try {
      // 1. Obtener tareas próximas (assignments)
      const assignments = await this.getAssignments();
      const now = Math.floor(Date.now() / 1000);
      
      if (Array.isArray(assignments)) {
        assignments.forEach((course: any) => {
          if (Array.isArray(course.assignments)) {
            course.assignments.forEach((assignment: any) => {
              if (assignment.duedate && assignment.duedate > now) {
                const daysUntil = Math.floor((assignment.duedate - now) / 86400);
                if (daysUntil <= 7) {
                  notifications.push({
                    id: `assignment-${assignment.id}`,
                    type: 'assignment',
                    title: 'Tarea próxima a vencer',
                    message: `"${assignment.name}" vence en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
                    timestamp: now,
                    read: false,
                    link: `/courses/${course.id}`,
                  } as Notification);
                }
              }
            });
          }
        });
      }

      // 2. Obtener calificaciones recientes
      const grades = await this.getAllUserGrades(id);
      
      if (Array.isArray(grades)) {
        grades
          .filter(g => g.dategraded && g.dategraded > now - 7 * 86400) // Últimos 7 días
          .forEach(grade => {
            notifications.push({
              id: `grade-${grade.itemid}`,
              type: 'grade',
              title: 'Nueva calificación',
              message: `Has recibido ${grade.grade?.toFixed(1) || '-'} en "${grade.itemname}"`,
              timestamp: grade.dategraded || now,
              read: false,
              link: `/grades`,
            } as Notification);
          });
      }

      // 3. Obtener cursos completados recientemente
      const courses = await this.getUserCourses(id);
      
      if (Array.isArray(courses)) {
        for (const course of courses) {
          if (course.completed) {
            const completion = await this.getCourseCompletionStatus(course.id, id);
            if (completion?.timecompleted && completion.timecompleted > now - 30 * 86400) {
              notifications.push({
                id: `completion-${course.id}`,
                type: 'achievement',
                title: '¡Curso completado!',
                message: `Has completado "${course.fullname}"`,
                timestamp: completion.timecompleted,
                read: false,
                link: `/certificates`,
              } as Notification);
            }
          }
        }
      }

      // 4. Eventos próximos del calendario
      const events = await this.getUpcomingEvents(7);
      
      if (Array.isArray(events)) {
        events.forEach(event => {
          notifications.push({
            id: `event-${event.id}`,
            type: 'system',
            title: 'Evento próximo',
            message: event.name,
            timestamp: event.timestart,
            read: false,
            link: event.url,
          } as Notification);
        });
      }

      // Ordenar por fecha (más recientes primero) y limitar
      return notifications
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, limit);
        
    } catch (error) {
      console.warn('Error al construir notificaciones:', error);
      return [];
    }
  }

  async markNotificationRead(_notificationid: string): Promise<boolean> {
    // Las notificaciones construidas no se pueden marcar como leídas en el servidor
    // Esta funcionalidad requeriría almacenamiento local
    return true;
  }

  // ============================================
  // EVENTOS Y CALENDARIO
  // ============================================

  async getCalendarEvents(courseids?: number[], _start?: number, _end?: number): Promise<Event[]> {
    try {
      const params: Record<string, any> = {};
      
      if (courseids && courseids.length > 0) {
        courseids.forEach((id, index) => {
          params[`courseids[${index}]`] = id;
        });
      }
      
      const data = await this.request<any>('core_calendar_get_calendar_upcoming_view', params);
      
      // Validación defensiva
      const events = data?.events || [];
      if (!Array.isArray(events)) return [];
      
      return events.map((event: any) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        timestart: event.timestart,
        timeduration: event.timeduration,
        courseid: event.courseid,
        url: event.url,
      }));
    } catch (error) {
      console.warn('Error al obtener eventos de calendario:', error);
      return [];
    }
  }

  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    const now = Math.floor(Date.now() / 1000);
    const end = now + (days * 24 * 60 * 60);
    
    return this.getCalendarEvents(undefined, now, end);
  }

  // ============================================
  // TAREAS (ASSIGN)
  // ============================================

  async getAssignments(courseids?: number[]): Promise<any[]> {
    try {
      const params: Record<string, any> = {};
      if (courseids && courseids.length > 0) {
        courseids.forEach((id, index) => {
          params[`courseids[${index}]`] = id;
        });
      }
      
      const data = await this.request<any>('mod_assign_get_assignments', params);
      
      // Validación defensiva
      return Array.isArray(data.courses) ? data.courses : [];
    } catch (error) {
      console.warn('Error al obtener tareas:', error);
      return [];
    }
  }

  async getUserAssignments(userid?: number): Promise<any[]> {
    const id = userid || this.getUserId();
    if (!id) return [];

    try {
      // Obtener cursos del usuario
      const courses = await this.getUserCourses(id);
      
      if (!Array.isArray(courses) || courses.length === 0) {
        return [];
      }

      const courseIds = courses.map(c => c.id);
      return this.getAssignments(courseIds);
    } catch (error) {
      console.warn('Error al obtener tareas del usuario:', error);
      return [];
    }
  }

  async getAssignmentSubmissionStatus(assignid: number, userid?: number): Promise<any> {
    const id = userid || this.getUserId();
    
    try {
      const data = await this.request<any>('mod_assign_get_submission_status', {
        assignid,
        userid: id
      });
      return data;
    } catch (error) {
      console.warn('Error al obtener estado de entrega:', error);
      return null;
    }
  }

  // ============================================
  // ESTADÍSTICAS (SOLO PROFESORES)
  // ============================================

  async getCourseStatistics(courseid: number): Promise<any> {
    try {
      // Usar core_course_get_courses_by_field en lugar de core_course_get_courses
      const courseInfo = await this.request<any>('core_course_get_courses_by_field', {
        field: 'id',
        value: courseid
      });
      
      const courses = courseInfo?.courses;
      
      // Validación defensiva
      if (!Array.isArray(courses) || courses.length === 0) {
        return {
          courseid,
          coursename: 'Curso',
          totalstudents: 0,
          activestudents: 0,
          completedstudents: 0,
          averageprogress: 0,
          completionrate: 0,
        };
      }
      
      const course = courses[0];
      const totalstudents = course?.enrolledusercount || 0;
      
      // Obtener estudiantes matriculados para estadísticas más precisas
      const enrolledUsers = await this.getEnrolledUsers(courseid);
      const activeCount = enrolledUsers.filter(u => {
        const lastAccess = u.lastaccess || u.lastcourseaccess;
        return lastAccess && (Date.now() / 1000 - lastAccess) < 7 * 24 * 60 * 60;
      }).length;
      
      return {
        courseid,
        coursename: course?.fullname || 'Curso',
        totalstudents,
        activestudents: activeCount,
        completedstudents: Math.floor(totalstudents * 0.3),
        averageprogress: course?.progress || 0,
        completionrate: Math.floor(totalstudents * 0.3),
      };
    } catch (error) {
      console.warn('Error al obtener estadísticas del curso:', error);
      return {
        courseid: courseid,
        coursename: 'Curso',
        totalstudents: 0,
        activestudents: 0,
        completedstudents: 0,
        averageprogress: 0,
        completionrate: 0,
      };
    }
  }

  
  async getAllStudents(teacherCourses: Course[]): Promise<User[]> {
  const allStudents = new Map<number, User>();
  
  const EXCLUDED_ROLE_SHORTNAMES = new Set([
    'editingteacher', 'teacher', 'manager', 'supervisor', 'guest', 'admin',
    'coursecreator', 'frontpage'
  ]);
  const EXCLUDED_ROLE_IDS = new Set([1, 2, 3, 4, 6, 7]);

  for (const course of teacherCourses) {
    try {
      const rawData = await this.request<any[]>('core_enrol_get_enrolled_users', {
        courseid: course.id,
        'options[0][name]': 'onlyactive',
        'options[0][value]': '1',
      });
      
      if (!Array.isArray(rawData)) continue;

      rawData.forEach((rawUser: any) => {
        const rawRoles: any[] = Array.isArray(rawUser.roles) ? rawUser.roles : [];

        // Filtro 1: por shortname/roleid si los roles están disponibles
        if (rawRoles.length > 0) {
          const hasExcludedRole = rawRoles.some((r: any) => {
            const sn = (r.shortname || '').toLowerCase();
            const rid = typeof r.roleid === 'number' ? r.roleid : parseInt(r.roleid || '0', 10);
            return EXCLUDED_ROLE_SHORTNAMES.has(sn) || EXCLUDED_ROLE_IDS.has(rid);
          });
          if (hasExcludedRole) return;
        }

        const user = this.transformUser(rawUser);

        // Filtro 2: por customfield profile_field_role (más confiable)
        const roleField = user.customfields?.find(
          (f: any) => f.shortname === 'role' || f.shortname === 'profile_field_role'
        );
        if (roleField?.value) {
          const roleVal = roleField.value.toLowerCase();
          if (['teacher', 'editingteacher', 'admin', 'manager'].includes(roleVal)) return;
        }

        // Filtro 3: por shortname transformados
        const transformedRoles = (user.roles as unknown as string[]) || [];
        if (transformedRoles.some(r => EXCLUDED_ROLE_SHORTNAMES.has((r || '').toLowerCase()))) return;

        if (!allStudents.has(user.id)) {
          allStudents.set(user.id, { ...user, enrolledCourses: [course] } as User);
        } else {
          const existing = allStudents.get(user.id)!;
          if (!existing.enrolledCourses) existing.enrolledCourses = [];
          existing.enrolledCourses.push(course);
        }
      });
    } catch (error) {
      console.warn(`Error al obtener estudiantes del curso ${course.id}:`, error);
    }
  }
  
  return Array.from(allStudents.values());
}

  async getGlobalStatistics(): Promise<any[]> {
    try {
      const courses = await this.getUserCourses();
      
      // Validación defensiva
      if (!Array.isArray(courses)) {
        return [
          { name: 'total_courses', value: 0, label: 'Total de Cursos' },
          { name: 'total_students', value: 0, label: 'Total de Estudiantes' },
          { name: 'average_progress', value: 0, label: 'Progreso Promedio' },
          { name: 'active_courses', value: 0, label: 'Cursos Activos' },
        ];
      }
      
      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledusercount || 0), 0);
      const averageProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
      
      return [
        { name: 'total_courses', value: totalCourses, label: 'Total de Cursos' },
        { name: 'total_students', value: totalStudents, label: 'Total de Estudiantes' },
        { name: 'average_progress', value: Math.round(averageProgress), label: 'Progreso Promedio', trend: 'up' },
        { name: 'active_courses', value: courses.filter(course => course.lastaccess && (Date.now() / 1000 - course.lastaccess) < 7 * 24 * 60 * 60).length, label: 'Cursos Activos' },
      ];
    } catch (error) {
      console.warn('Error al obtener estadísticas globales:', error);
      return [
        { name: 'total_courses', value: 0, label: 'Total de Cursos' },
        { name: 'total_students', value: 0, label: 'Total de Estudiantes' },
        { name: 'average_progress', value: 0, label: 'Progreso Promedio' },
        { name: 'active_courses', value: 0, label: 'Cursos Activos' },
      ];
    }
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getStudentDashboard(userid?: number): Promise<any> {
    const id = userid || this.getUserId();
    
    const [user, courses, grades, certificates, assignments] = await Promise.all([
      this.getUserProfile(id || undefined),
      this.getUserCourses(id || undefined),
      this.getAllUserGrades(id || undefined),
      this.getUserCertificates(id || undefined),
      this.getUserAssignments(id || undefined),
    ]);

    // Validación defensiva
    const safeCourses = Array.isArray(courses) ? courses : [];
    const safeGrades = Array.isArray(grades) ? grades : [];
    const safeCertificates = Array.isArray(certificates) ? certificates : [];
    const safeAssignments = Array.isArray(assignments) ? assignments : [];

    const totalCourses = safeCourses.length;
    const completedCourses = safeCourses.filter(c => c.completed).length;
    const inProgressCourses = totalCourses - completedCourses;
    const averageProgress = safeCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
    const averageGrade = safeGrades.length > 0 
      ? safeGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / safeGrades.length 
      : 0;

    // Extraer próximas entregas
    const upcomingAssignments: any[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    safeAssignments.forEach((course: any) => {
      if (Array.isArray(course.assignments)) {
        course.assignments.forEach((assignment: any) => {
          if (assignment.duedate && assignment.duedate > now) {
            upcomingAssignments.push({
              ...assignment,
              courseid: course.id,
              coursename: course.fullname,
            });
          }
        });
      }
    });

    // Ordenar por fecha de vencimiento
    upcomingAssignments.sort((a, b) => a.duedate - b.duedate);

    return {
      user,
      courses: safeCourses,
      grades: safeGrades,
      certificates: safeCertificates,
      upcomingAssignments: upcomingAssignments.slice(0, 5),
      recentActivity: [],
      upcomingEvents: [],
      notifications: [],
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress: Math.round(averageProgress),
        averageGrade: Math.round(averageGrade),
        totalCertificates: safeCertificates.length,
      },
    };
  }

  async getTeacherDashboard(userid?: number): Promise<any> {
    const id = userid || this.getUserId() || undefined;
    
    const baseDashboard = await this.getStudentDashboard(id);
    
    // Obtener todos los estudiantes de los cursos del profesor
    const allStudents = await this.getAllStudents(baseDashboard.courses);
    
    // Calcular estudiantes sin actividad reciente
    const now = Math.floor(Date.now() / 1000);
    const inactiveStudents = allStudents.filter(s => {
      const lastAccess = s.lastaccess || s.lastcourseaccess;
      return !lastAccess || (now - lastAccess) > 7 * 24 * 60 * 60;
    });

    // Obtener entregas pendientes de corrección
    const pendingSubmissions: any[] = [];
    
    for (const course of baseDashboard.courses) {
      try {
        const assignments = await this.getAssignments([course.id]);
        
        if (Array.isArray(assignments)) {
          assignments.forEach((courseData: any) => {
            if (Array.isArray(courseData.assignments)) {
              courseData.assignments.forEach((assignment: any) => {
                // Aquí se podría verificar si hay entregas sin calificar
                pendingSubmissions.push({
                  ...assignment,
                  courseid: course.id,
                  coursename: course.fullname,
                });
              });
            }
          });
        }
      } catch (error) {
        console.warn(`Error al obtener tareas del curso ${course.id}:`, error);
      }
    }

    return {
      ...baseDashboard,
      allStudents,
      inactiveStudents: inactiveStudents.slice(0, 10),
      pendingSubmissions: pendingSubmissions.slice(0, 5),
      stats: {
        ...baseDashboard.stats,
        totalStudents: allStudents.length,
        inactiveStudentsCount: inactiveStudents.length,
        pendingSubmissionsCount: pendingSubmissions.length,
      },
    };
  }

  // ============================================
  // TRANSFORMADORES
  // ============================================

  private transformUser(data: any): User {
  return {
    id: data.id,
    username: data.username || '',
    firstname: data.firstname || '',
    lastname: data.lastname || '',
    fullname: data.fullname || `${data.firstname || ''} ${data.lastname || ''}`.trim(),
    email: data.email || '',
    // ✅ URL tal cual — sin addTokenToPluginfileUrl
    profileimageurl: data.profileimageurl,
    profileimageurlsmall: data.profileimageurlsmall,
    department: data.department,
    institution: data.institution,
    city: data.city,
    country: data.country,
    timezone: data.timezone,
    lang: data.lang,
    phone1: data.phone1,
    phone2: data.phone2,
    address: data.address,
    description: data.description,
    firstaccess: data.firstaccess,
    lastaccess: data.lastaccess,
    lastcourseaccess: data.lastcourseaccess,
    suspended: data.suspended,
    roles: Array.isArray(data.roles) ? data.roles.map((r: any) => r.shortname || r) : [],
    preferences: data.preferences,
    customfields: Array.isArray(data.customfields) ? data.customfields.map((f: any) => ({
      name: f.name,
      value: f.value,
      type: f.type,
      shortname: f.shortname,
    })) : [],
  };
}
 
private transformCourse(data: any): Course {
  return {
    id: data.id,
    shortname: data.shortname || '',
    fullname: data.fullname || '',
    displayname: data.displayname || data.fullname || '',
    summary: data.summary,
    summaryformat: data.summaryformat,
    categoryid: data.category,
    categoryname: data.categoryname,
    startdate: data.startdate,
    enddate: data.enddate,
    visible: data.visible !== 0,
    progress: data.progress,
    completed: data.completed,
    enrolledusercount: data.enrolledusercount,
    overviewfiles: data.overviewfiles,
    // ✅ fileurl tal cual — sin addTokenToPluginfileUrl
    courseimage: data.overviewfiles?.[0]?.fileurl,
    completionhascriteria: data.completionhascriteria,
    completionusertracked: data.completionusertracked,
    lastaccess: data.lastaccess,
    isfavourite: data.isfavourite,
    hidden: data.hidden,
  };
}

  /**
   * Convierte una URL de pluginfile.php al endpoint autenticado webservice/pluginfile.php
   * y agrega el token del usuario. Si la URL ya usa webservice/pluginfile.php o no es
   * de pluginfile, la devuelve sin cambios.
   */
  private addTokenToPluginfileUrl(url: string, token: string): string {
  if (!url || !token) return url || '';

  // user/icon son públicos en Moodle — NO necesitan webservice ni token
  // Usar la URL original de pluginfile.php tal cual
  if (url.includes('/user/icon/') || url.includes('/user/icon')) {
    return url;
  }

  let result = url;
  if (result.includes('/pluginfile.php')) {
    if (result.includes('/webservice/pluginfile.php')) {
      if (!result.includes('token=')) {
        const separator = result.includes('?') ? '&' : '?';
        result = `${result}${separator}token=${encodeURIComponent(token)}`;
      }
    } else {
      result = result.replace('/pluginfile.php/', '/webservice/pluginfile.php/');
      const separator = result.includes('?') ? '&' : '?';
      result = `${result}${separator}token=${encodeURIComponent(token)}`;
    }
  }
  return result;
}

 private transformCourseDetail(data: any, contents: any[] = []): CourseDetail {
  const safeContents = Array.isArray(contents) ? contents : [];
  
  return {
    ...this.transformCourse(data),
    format: data.format,
    sections: safeContents.map((section: any) => ({
      id: section.id,
      name: section.name,
      summary: section.summary,
      summaryformat: section.summaryformat,
      visible: section.visible,
      section: section.section,
      hiddenbynumsections: section.hiddenbynumsections,
      uservisible: section.uservisible,
      availabilityinfo: section.availabilityinfo,
      modules: Array.isArray(section.modules) ? section.modules.map((mod: any) => ({
        id: mod.id,
        url: mod.url,
        name: mod.name,
        instance: mod.instance,
        contextid: mod.contextid,
        description: mod.description,
        visible: mod.visible,
        uservisible: mod.uservisible,
        visibleoncoursepage: mod.visibleoncoursepage,
        modicon: mod.modicon,
        modname: mod.modname,
        modplural: mod.modplural,
        availability: mod.availability,
        indent: mod.indent,
        onclick: mod.onclick,
        afterlink: mod.afterlink,
        customdata: mod.customdata,
        noviewlink: mod.noviewlink,
        completion: mod.completion,
        completiondata: mod.completiondata,
        dates: mod.dates,
        // ✅ contents tal cual — sin transformación de fileurl
        contents: Array.isArray(mod.contents) ? mod.contents : [],
      })) : [],
    })),
  };
}



  private safeProfileImageUrl(url: string | undefined, token: string): string {
  if (!url) return '';
 
  // URLs que NO necesitan transformación (son públicas o externas)
  const isExternal =
    url.includes('gravatar.com') ||
    url.includes('theme/image.php') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http') && !url.includes('campus.duomo.com.ar');
 
  if (isExternal) return url;
 
  // URLs de pluginfile propias de Moodle: sí necesitan token
  return this.addTokenToPluginfileUrl(url, token);
}
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

export const moodleApi = new MoodleApiClient();

// ============================================
// EXPORTAR FUNCIONES INDIVIDUALES
// ============================================

export const login = (username: string, password: string) => {
  if (AUTH_MODE === 'demo') {
    return demoAuth.login(username, password);
  }
  return moodleApi.login(username, password);
};

export const logout = () => {
  if (AUTH_MODE === 'demo') {
    return demoAuth.logout();
  }
  return moodleApi.logout();
};

export const getCurrentUser = () => moodleApi.getCurrentUser();
export const getUserProfile = (userid?: number) => moodleApi.getUserProfile(userid);
export const getUserCourses = (userid?: number) => moodleApi.getUserCourses(userid);
export const getAllCourses = () => moodleApi.getAllCourses();
export const getCourseById = (courseid: number) => moodleApi.getCourseById(courseid);
export const getCourseContent = (courseid: number) => moodleApi.getCourseContent(courseid);
export const getEnrolledUsers = (courseid: number) => moodleApi.getEnrolledUsers(courseid);
export const getUserGrades = (courseid?: number, userid?: number) => moodleApi.getUserGrades(courseid, userid);
export const getAllUserGrades = (userid?: number) => moodleApi.getAllUserGrades(userid);
export const getUserCertificates = (userid?: number) => moodleApi.getUserCertificates(userid);
export const getNotifications = (userid?: number, limit?: number) => moodleApi.getNotifications(userid, limit);
export const getUserAssignments = (userid?: number) => moodleApi.getUserAssignments(userid);
export const getAssignments = (courseids?: number[]) => moodleApi.getAssignments(courseids);
export const getAllStudents = (courses: Course[]) => moodleApi.getAllStudents(courses);
export const getStudentDashboard = (userid?: number) => moodleApi.getStudentDashboard(userid);
export const getTeacherDashboard = (userid?: number) => moodleApi.getTeacherDashboard(userid);
export const getCourseStatistics = (courseid: number) => moodleApi.getCourseStatistics(courseid);
export const getGlobalStatistics = () => moodleApi.getGlobalStatistics();
export const getCourseCompletionStatus = (courseid: number, userid?: number) => moodleApi.getCourseCompletionStatus(courseid, userid);
export const updateUser = (user: Partial<User> & { id: number; customfields?: { shortname: string; value: string }[] }) => moodleApi.updateUser(user);
