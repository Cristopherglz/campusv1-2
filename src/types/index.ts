// Tipos principales del Campus Duomo LMS

export type UserRole = 'student' | 'editingteacher' | 'admin' | 'supervisor';

export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  department?: string;
  institution?: string;
  city?: string;
  country?: string;
  timezone?: string;
  lang?: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  description?: string;
  firstaccess?: number;
  lastaccess?: number;
  lastcourseaccess?: number;
  suspended?: boolean;
  roles: UserRole[];
  preferences?: UserPreference[];
  customfields?: CustomField[];
  enrolledCourses?: Course[];
}

export interface UserPreference {
  name: string;
  value: string;
}

export interface CustomField {
  name: string;
  value: string;
  type: string;
  shortname: string;
}

export interface Course {
  id: number;
  shortname: string;
  fullname: string;
  displayname: string;
  summary?: string;
  summaryformat?: number;
  categoryid?: number;
  categoryname?: string;
  startdate?: number;
  enddate?: number;
  visible?: boolean;
  progress?: number;
  completed?: boolean;
  enrolledusercount?: number;
  overviewfiles?: File[];
  courseimage?: string;
  completionhascriteria?: boolean;
  completionusertracked?: boolean;
  lastaccess?: number;
  isfavourite?: boolean;
  hidden?: boolean;
}

export interface CourseDetail extends Course {
  format?: string;
  sections?: CourseSection[];
  modules?: CourseModule[];
  competencies?: Competency[];
  completioncriteria?: CompletionCriterion[];
  settings?: CourseSetting[];
}

export interface CourseSection {
  id: number;
  name: string;
  summary?: string;
  summaryformat?: number;
  visible?: boolean;
  section?: number;
  hiddenbynumsections?: boolean;
  uservisible?: boolean;
  availabilityinfo?: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: number;
  url?: string;
  name: string;
  instance?: number;
  contextid?: number;
  description?: string;
  visible?: boolean;
  uservisible?: boolean;
  visibleoncoursepage?: boolean;
  modicon?: string;
  modname: string;
  modplural?: string;
  availability?: string;
  indent?: number;
  onclick?: string;
  afterlink?: string;
  customdata?: string;
  noviewlink?: boolean;
  completion?: number;
  completiondata?: CompletionData;
  dates?: ModuleDate[];
  contents?: ModuleContent[];
}

export interface CompletionData {
  state: number;
  timecompleted?: number;
  overrideby?: number;
  valueused?: boolean;
  hascompletion?: boolean;
  isautomatic?: boolean;
  istrackeduser?: boolean;
  uservisible?: boolean;
  details?: CompletionDetail[];
}

export interface CompletionDetail {
  rulename: string;
  title: string;
  complete?: boolean;
}

export interface ModuleDate {
  label: string;
  timestamp: number;
  relative?: string;
}

export interface ModuleContent {
  type: string;
  filename?: string;
  filepath?: string;
  filesize?: number;
  fileurl?: string;
  content?: string;
  timecreated?: number;
  timemodified?: number;
  sortorder?: number;
  mimetype?: string;
  isexternalfile?: boolean;
  repositorytype?: string;
  userid?: number;
  author?: string;
  license?: string;
  tags?: Tag[];
}

export interface Competency {
  id: number;
  shortname: string;
  idnumber?: string;
  description?: string;
  descriptionformat?: number;
  sortorder?: number;
  parentid?: number;
  path?: string;
  ruleoutcome?: number;
  ruletype?: string;
  ruleconfig?: string;
  scaleid?: number;
  scaleconfiguration?: string;
  competencyframeworkid?: number;
  competencyframeworkshortname?: string;
  competencyframeworkidnumber?: string;
}

export interface CompletionCriterion {
  id: number;
  criteria_type: number;
  criteria_type_title?: string;
  module?: number;
  moduleinstance?: number;
  courseinstance?: number;
  enrolperiod?: number;
  timeend?: number;
  gradepass?: number;
  role?: number;
  roles?: { [key: number]: string };
}

export interface CourseSetting {
  name: string;
  value: string | number | boolean;
}

export interface Grade {
  courseid?: number;
  coursename?: string;
  grade?: number;
  rawgrade?: number;
  rank?: number;
  itemid?: number;
  itemname?: string;
  itemtype?: string;
  itemmodule?: string;
  iteminstance?: number;
  itemnumber?: number;
  idnumber?: string;
  categoryid?: number;
  feedback?: string;
  feedbackformat?: number;
  usermodified?: number;
  datesubmitted?: number;
  dategraded?: number;
  str_grade?: string;
  str_long_grade?: string;
  str_feedback?: string;
  percentage?: number;
}

export interface GradeItem {
  id: number;
  courseid: number;
  categoryid?: number;
  itemname?: string;
  itemtype: string;
  itemmodule?: string;
  iteminstance?: number;
  itemnumber?: number;
  iteminfo?: string;
  idnumber?: string;
  calculation?: string;
  gradetype?: number;
  grademax?: number;
  grademin?: number;
  scaleid?: number;
  outcomeid?: number;
  gradepass?: number;
  multfactor?: number;
  plusfactor?: number;
  aggregationcoef?: number;
  aggregationcoef2?: number;
  weightoverride?: boolean;
  sortorder?: number;
  display?: number;
  decimals?: number;
  hidden?: boolean;
  locked?: boolean;
  locktime?: number;
  needsupdate?: boolean;
  timecreated?: number;
  timemodified?: number;
  categoryname?: string;
}

export interface Certificate {
  id: number;
  name: string;
  course: string;
  courseid?: number;
  coursename?: string;
  templateid?: number;
  timecreated?: number;
  timemodified?: number;
  issuedate?: number;
  dateissued?: string;
  expirationdate?: string;
  code?: string;
  status?: string;
  downloadurl?: string;
  previewurl?: string;
}

export interface Activity {
  id: number;
  type: string;
  modname: string;
  name: string;
  description?: string;
  courseid?: number;
  cmid?: number;
  instance?: number;
  section?: number;
  visible?: boolean;
  completion?: number;
  completionexpected?: number;
  availablefrom?: number;
  availableuntil?: number;
  timecreated?: number;
  timemodified?: number;
}

export interface Notification {
  id: string | number;
  useridfrom?: number;
  useridto?: number;
  subject?: string;
  text?: string;
  contexturl?: string;
  contexturlname?: string;
  timecreated?: number;
  timeread?: number;
  read?: boolean;
  deleted?: boolean;
  iconurl?: string;
  component?: string;
  eventtype?: string;
  customdata?: string;
  // Campos adicionales para notificaciones construidas
  type?: 'grade' | 'assignment' | 'message' | 'achievement' | 'system';
  title?: string;
  message?: string;
  timestamp?: number;
  link?: string;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  eventtype?: string;
  timestart?: number;
  timeduration?: number;
  timesort?: number;
  visible?: boolean;
  modulename?: string;
  instance?: number;
  courseid?: number;
  groupid?: number;
  userid?: number;
  uuid?: string;
  sequence?: number;
  subscriptionid?: number;
  url?: string;
}

export interface Tag {
  id: number;
  name: string;
  rawname?: string;
  description?: string;
  flag?: number;
  official?: number;
  ordering?: number;
}

export interface File {
  filename?: string;
  filepath?: string;
  filesize?: number;
  fileurl?: string;
  timemodified?: number;
  mimetype?: string;
  isexternalfile?: boolean;
  repositorytype?: string;
}

export interface Statistic {
  name: string;
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface StudentProgress {
  userid: number;
  userfullname?: string;
  courseid?: number;
  coursename?: string;
  progress?: number;
  completedactivities?: number;
  totalactivities?: number;
  timeenrolled?: number;
  timecompleted?: number;
  gradefinal?: number;
  lastaccess?: number;
}

export interface CourseStats {
  courseid: number;
  coursename: string;
  totalstudents: number;
  activestudents: number;
  completedstudents: number;
  averagerating?: number;
  averageprogress: number;
  averagegrade?: number;
  completionrate: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  privatetoken?: string;
  user?: User;
  error?: string;
  errorcode?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errorcode?: string;
  warnings?: Warning[];
}

export interface Warning {
  item?: string;
  itemid?: number;
  warningcode?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  perpage?: number;
}

export interface FilterParams {
  search?: string;
  category?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DashboardData {
  user: User;
  courses: Course[];
  recentActivity: Activity[];
  upcomingEvents: Event[];
  notifications: Notification[];
  progress: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
  };
  certificates: Certificate[];
  statistics?: Statistic[];
}

export interface TeacherDashboardData extends DashboardData {
  teachingCourses: Course[];
  courseStats: CourseStats[];
  studentProgress: StudentProgress[];
  pendingGrading: Activity[];
  recentSubmissions: Activity[];
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
  badge?: number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  siteName: string;
  footerText?: string;
}
