// Métodos mejorados para detección de roles en Moodle
// Implementa los 3 métodos en paralelo como se especifica en el documento de fixes

export type MoodleRole = 'student' | 'editingteacher' | 'admin' | 'supervisor';

export interface RoleDetectionMethods {
  method1: boolean; // core_enrol_get_users_courses
  method2: boolean; // core_user_get_users_by_field
  method3: boolean; // core_enrol_get_enrolled_users
}

export interface RoleDetectionResult {
  roles: MoodleRole[];
  detectionMethods: RoleDetectionMethods;
  isTeacher: boolean;
}

/**
 * Detecta roles desde múltiples fuentes en paralelo
 * Si CUALQUIERA de los 3 métodos detecta teacher -> rol = teacher
 */
export async function detectRolesFromMultipleSources(
  userid: number,
  courses: any[],
  requestFn: (wsfunction: string, params: Record<string, any>) => Promise<any>
): Promise<RoleDetectionResult> {
  const roles = new Set<MoodleRole>();
  const detectionMethods: RoleDetectionMethods = {
    method1: false,
    method2: false,
    method3: false,
  };
  let hasTeacherRole = false;

  // MÉTODO 1: Detectar desde core_enrol_get_users_courses
  if (Array.isArray(courses) && courses.length > 0) {
    courses.forEach(course => {
      if (course.roles && Array.isArray(course.roles)) {
        course.roles.forEach((role: any) => {
          const roleShortname = role.shortname || role;
          if (['editingteacher', 'teacher'].includes(roleShortname)) {
            roles.add('editingteacher');
            hasTeacherRole = true;
            detectionMethods.method1 = true;
          } else if (roleShortname === 'student') {
            roles.add('student');
          }
        });
      }
    });
  }

  // MÉTODO 2: Fallback con core_user_get_users_by_field para obtener roles del usuario
  try {
    const userInfo = await requestFn('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userid
    });
    
    if (userInfo && Array.isArray(userInfo) && userInfo.length > 0) {
      const user = userInfo[0];
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach((role: any) => {
          const roleShortname = role.shortname || role;
          if (['editingteacher', 'teacher'].includes(roleShortname)) {
            roles.add('editingteacher');
            hasTeacherRole = true;
            detectionMethods.method2 = true;
          } else if (roleShortname === 'student') {
            roles.add('student');
          }
        });
      }
    }
  } catch (error) {
    console.warn('Método 2 (core_user_get_users_by_field) falló:', error);
  }

  // MÉTODO 3: Verificar directamente en enrolled users del primer curso
  if (Array.isArray(courses) && courses.length > 0) {
    try {
      const firstCourseId = courses[0].id;
      const enrolled = await requestFn('core_enrol_get_enrolled_users', {
        courseid: firstCourseId
      });
      
      if (Array.isArray(enrolled)) {
        const thisUser = enrolled.find((u: any) => u.id === userid);
        if (thisUser && thisUser.roles && Array.isArray(thisUser.roles)) {
          thisUser.roles.forEach((role: any) => {
            const roleShortname = role.shortname || role;
            if (['editingteacher', 'teacher'].includes(roleShortname)) {
              roles.add('editingteacher');
              hasTeacherRole = true;
              detectionMethods.method3 = true;
            } else if (roleShortname === 'student') {
              roles.add('student');
            }
          });
        }
      }
    } catch (error) {
      console.warn('Método 3 (core_enrol_get_enrolled_users) falló:', error);
    }
  }

  // Si no se detectó ningún rol, asumir student
  if (roles.size === 0) {
    roles.add('student');
  }

  return {
    roles: Array.from(roles),
    detectionMethods,
    isTeacher: hasTeacherRole,
  };
}
