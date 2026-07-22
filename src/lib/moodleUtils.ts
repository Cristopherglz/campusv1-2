/**
 * Utilidades para trabajar con Moodle Web Services
 * Campus Duomo - Frontend SPA
 */

import type { User, Course } from '@/types';

/**
 * Transforma una URL de pluginfile.php para usar con autenticación de webservice.
 * Las URLs de Moodle requieren transformación para funcionar con autenticación:
 * url.replace('/pluginfile.php/', '/webservice/pluginfile.php/') + '?token=' + TOKEN
 * 
 * @param url - URL original de Moodle (puede ser de pluginfile.php o cualquier otra)
 * @param token - Token de autenticación del usuario
 * @returns URL transformada con token si es necesario, o la URL original
 */
export function getMoodleFileUrl(url: string | undefined, token: string | null | undefined): string {
  if (!url) return '';
  if (!token) return url;
  
  // Si ya es una URL de webservice/pluginfile, no hacer nada
  if (url.includes('webservice/pluginfile.php')) {
    return url;
  }
  
  // Transformar pluginfile.php a webservice/pluginfile.php con token
  if (url.includes('pluginfile.php')) {
    return url.replace('/pluginfile.php/', '/webservice/pluginfile.php/') + '?token=' + token;
  }
  
  return url;
}

/**
 * Obtiene las iniciales de un nombre completo
 * @param name - Nombre completo del usuario
 * @returns Iniciales (máximo 2 caracteres)
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formatea una fecha de timestamp de Moodle
 * @param timestamp - Timestamp en segundos (formato Moodle)
 * @returns Fecha formateada en español
 */
export function formatMoodleDate(timestamp: number | undefined): string {
  if (!timestamp) return 'Fecha no disponible';
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatea un porcentaje de progreso
 * @param progress - Valor entre 0 y 100
 * @returns Porcentaje formateado
 */
export function formatProgress(progress: number | undefined): string {
  if (progress === undefined || progress === null) return '0%';
  return Math.round(progress) + '%';
}

/**
 * Verifica si un usuario tiene rol de estudiante (excluyendo profesores)
 * @param user - Usuario de Moodle
 * @returns true si el usuario es estudiante (no tiene roles de teacher/editingteacher/manager)
 */
export function isStudentOnly(user: User): boolean {
  const roles = user.roles || [];
  const hasTeacherRole = roles.some(r => 
    ['editingteacher', 'teacher', 'manager'].includes(r)
  );
  return !hasTeacherRole;
}

/**
 * Filtra una lista de usuarios para obtener solo estudiantes
 * @param users - Lista de usuarios
 * @returns Lista filtrada con solo estudiantes
 */
export function filterStudentsOnly(users: User[]): User[] {
  return users.filter(user => {
    // Excluir si el usuario tiene rol teacher, editingteacher o manager
    const roles = user.roles || [];
    const hasTeacherRole = roles.some(r => 
      ['editingteacher', 'teacher', 'manager'].includes(r)
    );
    return !hasTeacherRole;
  });
}

/**
 * Detecta el rol principal del usuario basado en sus roles
 * @param roles - Lista de roles del usuario
 * @param isSiteAdmin - Si es administrador del sitio
 * @returns Rol detectado
 */
export function detectUserRole(
  roles: string[], 
  isSiteAdmin?: boolean
): 'student' | 'teacher' | 'editingteacher' | 'admin' {
  if (isSiteAdmin) return 'admin';
  
  if (roles.includes('editingteacher')) {
    return 'editingteacher';
  }
  if (roles.includes('teacher')) {
    return 'teacher';
  }
  
  return 'student';
}

/**
 * Obtiene el nombre de la sucursal desde los campos personalizados
 * @param user - Usuario de Moodle
 * @returns Nombre de la sucursal o 'Sin sucursal'
 */
export function getSucursalName(user: User): string {
  const sucursalField = user.customfields?.find(
    f => f.shortname === 'sucursales'
  );
  
  return sucursalField?.value || 'Sin sucursal';
}

/**
 * Verifica si un usuario es el supervisor (índice 95)
 * @param user - Usuario de Moodle
 * @returns true si es el supervisor
 */
export function isSupervisor(user: User): boolean {
  const sucursal = getSucursalName(user);
  return sucursal.includes('95') || sucursal.includes('Supervisor');
}