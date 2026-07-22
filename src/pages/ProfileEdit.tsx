// Página de Edición de Perfil del Campus Duomo LMS
// Con todos los campos de Moodle incluyendo customfields y carga de documentos

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  MapPin, 
  Building2,
  GraduationCap,
  AlertCircle,
  Camera,
  Upload,
  FileText,
  Check,
  File,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import { toast } from 'sonner';

const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL || 'https://campus.duomo.com.ar';

// Lista de provincias de Argentina
const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

// Lista de ciudades/municipios (ejemplo, puede ser extendida)
const CIUDADES = [
  'Posadas',
  'Oberá',
  'Eldorado',
  'San Vicente',
  'Iguazú',
  'Ituzaingó',
  'Apóstoles',
  'Leandro N. Alem',
  'Puerto Iguazú',
  'Garupá',
  'Candelaria',
  'San Javier',
  'Concepción de la Sierra',
  'Wanda',
  'Puerto Esperanza',
  'Bernardo de Irigoyen',
  'San Pedro',
  'Jardín América',
  'Montecarlo',
  'Aristóbulo del Valle',
  'El Dorado',
  'Puerto Rico',
  'Capioví',
  'Colonia Aurora',
  'Campo Grande',
  'Alba Posse',
  'San Ignacio',
  'Gobernador Roca',
  'Dos de Mayo',
  'Caraguatay'
];

// Niveles de estudio
const NIVELES_ESTUDIO = [
  'Primaria completa',
  'Secundario incompleto',
  'Secundario completo',
  'Terciario incompleto',
  'Terciario completo',
  'Universitario incompleto',
  'Universitario Completo',
  'Posgrado incompleto',
  'Posgrado completo'
];

// Lista de sucursales
const SUCURSALES = [
  { id: '1', name: 'Sucursal Central' },
  { id: '2', name: 'Sucursal Norte' },
  { id: '3', name: 'Sucursal Sur' },
  { id: '4', name: 'Sucursal Este' },
  { id: '5', name: 'Sucursal Oeste' },
  { id: '6', name: 'Sucursal Centro' },
  { id: '7', name: 'Sucursal Industrial' },
  { id: '8', name: 'Sucursal Comercial' },
];

// Tipos de documentos permitidos
const DOCUMENT_TYPES = [
  { id: 'cv', name: 'Curriculum Vitae', accept: '.pdf,.doc,.docx' },
  { id: 'dni', name: 'DNI (Frente y Dorso)', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'titulo', name: 'Título/Certificado', accept: '.pdf,.jpg,.jpeg,.png' },
  { id: 'certificado', name: 'Certificados Adicionales', accept: '.pdf,.jpg,.jpeg,.png' },
];

// Helper para obtener valor de customfield
const getCustomField = (fields: any[] | undefined, shortname: string): string => {
  if (!fields) return '';
  const field = fields.find(f => f.shortname === shortname);
  return field?.value || '';
};

interface UserDocument {
  id: string;
  type: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  file?: File;
}

export function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Sección General
    firstname: '',
    lastname: '',
    email: '',
    description: '',
    
    // Sección Datos personales
    provincia: '',
    city: '',
    cod_post: '',
    domicilio: '',
    fecha_nac: '',
    dni: '',
    cuil_cuit: '',
    phone1: '',
    phone2: '',
    address: '',
    institution: '',
    department: '',
    
    // Sección Formación
    niv_est: '',
    
    // Sección Sucursal
    sucursales: [] as string[],
  });

  // Estado de documentos
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadDocuments();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener datos actualizados del usuario incluyendo customfields
      const userData = await moodleApi.getUserProfile(user!.id);
      
      setFormData({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || '',
        description: userData.description || '',
        
        provincia: getCustomField(userData.customfields, 'PROVINCIA'),
        city: userData.city || '',
        cod_post: getCustomField(userData.customfields, 'COD_POST'),
        domicilio: getCustomField(userData.customfields, 'DOMICILIO'),
        fecha_nac: getCustomField(userData.customfields, 'FECHA_NAC'),
        dni: getCustomField(userData.customfields, 'DNI'),
        cuil_cuit: getCustomField(userData.customfields, 'CUIL_CUIT'),
        phone1: userData.phone1 || '',
        phone2: userData.phone2 || '',
        address: userData.address || '',
        institution: userData.institution || '',
        department: userData.department || '',
        
        niv_est: getCustomField(userData.customfields, 'NIV_EST'),
        
        sucursales: getCustomField(userData.customfields, 'sucursales') 
          ? getCustomField(userData.customfields, 'sucursales').split(',').filter(Boolean)
          : [],
      });
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
      setError('Error al cargar los datos del perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    // Por ahora cargamos desde localStorage, en el futuro se puede integrar con la API de Moodle
    try {
      const savedDocs = localStorage.getItem(`user_documents_${user?.id}`);
      if (savedDocs) {
        setDocuments(JSON.parse(savedDocs));
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSucursalChange = (sucursalId: string) => {
    setFormData(prev => {
      const current = [...prev.sucursales];
      if (current.includes(sucursalId)) {
        return { ...prev, sucursales: current.filter(s => s !== sucursalId) };
      } else {
        return { ...prev, sucursales: [...current, sucursalId] };
      }
    });
  };

  const handleFileSelect = async (docType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10MB');
      return;
    }

    setUploadingDoc(docType);
    setUploadProgress(0);

    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // En una implementación real, aquí se subiría el archivo a Moodle
      // Por ahora simulamos la carga y guardamos en localStorage
      await new Promise(resolve => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setUploadProgress(100);

      const docInfo: UserDocument = {
        id: `${docType}-${Date.now()}`,
        type: docType,
        name: DOCUMENT_TYPES.find(d => d.id === docType)?.name || docType,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
      };

      // Guardar en localStorage (simulando persistencia)
      const updatedDocs = [...documents.filter(d => d.type !== docType), docInfo];
      setDocuments(updatedDocs);
      localStorage.setItem(`user_documents_${user?.id}`, JSON.stringify(updatedDocs));

      toast.success(`${docInfo.name} subido correctamente`);
    } catch (err) {
      console.error('Error al subir documento:', err);
      toast.error('Error al subir el documento');
    } finally {
      setTimeout(() => {
        setUploadingDoc(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = documents.filter(d => d.id !== docId);
    setDocuments(updatedDocs);
    localStorage.setItem(`user_documents_${user?.id}`, JSON.stringify(updatedDocs));
    toast.success('Documento eliminado');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Preparar customfields para la API
      const customfields = [
        { shortname: 'PROVINCIA', value: formData.provincia },
        { shortname: 'COD_POST', value: formData.cod_post },
        { shortname: 'DOMICILIO', value: formData.domicilio },
        { shortname: 'FECHA_NAC', value: formData.fecha_nac },
        { shortname: 'DNI', value: formData.dni },
        { shortname: 'CUIL_CUIT', value: formData.cuil_cuit },
        { shortname: 'NIV_EST', value: formData.niv_est },
        { shortname: 'sucursales', value: formData.sucursales.join(',') },
      ] as any[];
      
      // Llamar a la API para actualizar el usuario
      await moodleApi.updateUser({
        id: user!.id,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        description: formData.description,
        city: formData.city,
        phone1: formData.phone1,
        phone2: formData.phone2,
        address: formData.address,
        institution: formData.institution,
        department: formData.department,
        customfields,
      });
      
      // Actualizar el usuario en el contexto
      await updateUser({
        ...user,
        firstname: formData.firstname,
        lastname: formData.lastname,
        fullname: `${formData.firstname} ${formData.lastname}`,
        email: formData.email,
      });
      
      toast.success('Perfil actualizado correctamente');
      navigate('/profile');
    } catch (err: any) {
      console.error('Error al guardar perfil:', err);
      setError(err.message || 'Error al guardar los cambios');
      toast.error('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return <ProfileEditSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          <p className="text-gray-600">Actualiza tu información personal</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Foto de perfil */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.profileimageurl} alt={user?.fullname} />
                    <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white text-2xl">
                      {getInitials(`${formData.firstname} ${formData.lastname}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-gray-900">Foto de perfil</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Para cambiar tu foto de perfil, accede a la plataforma de Moodle
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`${MOODLE_BASE_URL}/user/edit.php`, '_blank')}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Cambiar en Moodle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#8B9A7D]" />
                  Información General
                </CardTitle>
                <CardDescription>Datos básicos de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstname"
                      value={formData.firstname}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">
                      Apellido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastname"
                      value={formData.lastname}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sección Datos personales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#8B9A7D]" />
                  Datos Personales
                </CardTitle>
                <CardDescription>Información de contacto y ubicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select 
                      value={formData.provincia} 
                      onValueChange={(value) => handleInputChange('provincia', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCIAS.map(prov => (
                          <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad/Municipio</Label>
                    <Select 
                      value={formData.city} 
                      onValueChange={(value) => handleInputChange('city', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {CIUDADES.map(ciudad => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cod_post">Código Postal</Label>
                    <Input
                      id="cod_post"
                      value={formData.cod_post}
                      onChange={(e) => handleInputChange('cod_post', e.target.value)}
                      placeholder="Ej: 3300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nac">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nac"
                      type="date"
                      value={formData.fecha_nac}
                      onChange={(e) => handleInputChange('fecha_nac', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domicilio">Domicilio Particular</Label>
                  <Input
                    id="domicilio"
                    value={formData.domicilio}
                    onChange={(e) => handleInputChange('domicilio', e.target.value)}
                    placeholder="Calle, número, piso, departamento"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={formData.dni}
                      onChange={(e) => handleInputChange('dni', e.target.value)}
                      placeholder="Sin puntos ni guiones"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuil_cuit">CUIL/CUIT</Label>
                    <Input
                      id="cuil_cuit"
                      value={formData.cuil_cuit}
                      onChange={(e) => handleInputChange('cuil_cuit', e.target.value)}
                      placeholder="XX-XXXXXXXX-X"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone1">Teléfono</Label>
                    <Input
                      id="phone1"
                      value={formData.phone1}
                      onChange={(e) => handleInputChange('phone1', e.target.value)}
                      placeholder="Ej: 3755-123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone2">Teléfono Móvil</Label>
                    <Input
                      id="phone2"
                      value={formData.phone2}
                      onChange={(e) => handleInputChange('phone2', e.target.value)}
                      placeholder="Ej: 3755-654321"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institución</Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                      placeholder="Nombre de la institución"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Área o departamento"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección Formación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#8B9A7D]" />
                  Formación
                </CardTitle>
                <CardDescription>Tu nivel educativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="niv_est">Nivel de Estudios</Label>
                  <Select 
                    value={formData.niv_est} 
                    onValueChange={(value) => handleInputChange('niv_est', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu nivel de estudios" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVELES_ESTUDIO.map(nivel => (
                        <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sección Sucursal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#8B9A7D]" />
                  Sucursal
                </CardTitle>
                <CardDescription>Selecciona tu(s) sucursal(es) asignada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>
                    Sucursales <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {SUCURSALES.map(sucursal => (
                      <label
                        key={sucursal.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.sucursales.includes(sucursal.id)
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.sucursales.includes(sucursal.id)}
                          onChange={() => handleSucursalChange(sucursal.id)}
                          className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-sm">{sucursal.name}</span>
                      </label>
                    ))}
                  </div>
                  {formData.sucursales.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      Debes seleccionar al menos una sucursal
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sección Documentos - Implementación directa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8B9A7D]" />
                  Documentos
                </CardTitle>
                <CardDescription>
                  Subí tus documentos (CV, DNI, Título, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DOCUMENT_TYPES.map((docType) => {
                    const existingDoc = documents.find(d => d.type === docType.id);
                    const isUploading = uploadingDoc === docType.id;

                    return (
                      <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#8B9A7D]/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#8B9A7D]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{docType.name}</p>
                              <p className="text-xs text-gray-500">
                                Formatos: {docType.accept}
                              </p>
                            </div>
                          </div>

                          {existingDoc ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <Check className="w-3 h-3 mr-1" />
                                Subido
                              </Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500"
                                onClick={() => handleDeleteDocument(existingDoc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept={docType.accept}
                                onChange={(e) => handleFileSelect(docType.id, e)}
                                className="hidden"
                                id={`file-${docType.id}`}
                              />
                              <label htmlFor={`file-${docType.id}`}>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer"
                                  disabled={isUploading}
                                  asChild
                                >
                                  <span>
                                    {isUploading ? (
                                      <>
                                        <div className="w-3 h-3 mr-2 border-2 border-[#8B9A7D]/30 border-t-[#8B9A7D] rounded-full animate-spin" />
                                        Subiendo...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Progreso de carga */}
                        {isUploading && (
                          <div className="mt-3">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              {uploadProgress}% completado
                            </p>
                          </div>
                        )}

                        {/* Info del archivo subido */}
                        {existingDoc && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700 truncate">
                                {existingDoc.fileName}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({formatFileSize(existingDoc.fileSize)})
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Subido el {new Date(existingDoc.uploadDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Los documentos se guardan localmente. En una futura actualización se sincronizarán con Moodle.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Acciones */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSaving || formData.sucursales.length === 0}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-gray-500">
                  <span className="text-red-500">*</span> Campos obligatorios
                </p>
                <Separator />
                <p className="text-gray-500">
                  Los campos marcados con asterisco son obligatorios para completar tu perfil.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function ProfileEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;
