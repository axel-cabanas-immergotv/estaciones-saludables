# Configuración S3 para Producer

## Variables de Entorno Requeridas

Para que el sistema de subida de fotos funcione correctamente, necesitas configurar las siguientes variables de entorno en tu archivo `.env`:

```bash
# S3 Endpoint (para DigitalOcean Spaces o AWS S3)
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Credenciales S3
S3_ACCESS_KEY_ID=tu_access_key_aqui
S3_SECRET_ACCESS_KEY=tu_secret_key_aqui

# Configuración del Bucket S3
S3_BUCKET_NAME=nombre_de_tu_bucket
S3_REGION=nyc3

# Opcional: URL del CDN si tienes un CDN delante de tu bucket S3
S3_CDN_URL=https://tu-dominio-cdn.com
```

## Configuración del Bucket S3

### Permisos Requeridos

El bucket S3 debe tener los siguientes permisos:

1. **Lectura pública**: Para que las imágenes subidas sean accesibles públicamente
2. **Escritura**: Para permitir la subida de archivos
3. **CORS**: Configurado para permitir requests desde tu dominio

### Configuración CORS

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://tu-dominio.com", "http://localhost:3000"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## Estructura de Carpetas

El sistema creará automáticamente las siguientes carpetas en tu bucket:

- `escrutinio/` - Para fotos de actas y certificados de escrutinio
- `images/stories/` - Para imágenes de historias (existente)
- `images/` - Para otras imágenes del sistema

## Funcionalidades Implementadas

### 1. Componente PhotoUpload

- **Ubicación**: `src/components/PhotoUpload/`
- **Características**:
  - **Subida de una sola foto**: Solo permite subir un archivo por tipo de documento
  - Validación de tipos de archivo (JPEG, PNG, GIF, WebP)
  - Validación de tamaño (máximo 10MB por archivo)
  - Preview de imagen antes de subir
  - Barra de progreso durante la subida
  - Manejo de errores
  - **Visualización de foto existente**: Muestra la foto ya subida (si existe)
  - **Galería integrada**: Permite ver la foto en una galería completa
  - **Drag & Drop**: Arrastra y suelta archivos directamente en el área de subida
  - **Funcionalidad móvil**: Botones separados para galería y cámara en dispositivos móviles
  - **Captura de cámara**: Acceso directo a la cámara del dispositivo móvil

### 2. Endpoint de Subida

- **Ruta**: `POST /api/upload/escrutinio`
- **Parámetros**:
  - `file`: Archivo a subir (un solo archivo)
  - `folder`: Carpeta de destino (default: 'escrutinio')
  - `escuela_id`: ID de la escuela (requerido)
  - `tipo_documento`: 'acta' o 'certificado'
- **Funcionalidad**:
  - Sube un solo archivo por petición
  - Actualiza automáticamente la tabla `Escuela` con el URL
  - **Reemplaza la foto existente** si ya hay una subida
  - No concatena URLs, solo guarda la URL de la foto actual

### 3. Componente PhotoGallery

- **Ubicación**: `src/components/PhotoGallery/`
- **Características**:
  - Visualización de una sola foto en galería
  - Enlace para abrir en nueva pestaña
  - Responsive design
  - Manejo de errores si la foto no se puede cargar

### 4. Botones en Tabla de Escuelas

- **A. Escrutinio**: Para subir foto de acta de escrutinio
- **C. Escrutinio**: Para subir foto de certificado de escrutinio
- **Permisos**: Solo visible para usuarios con rol 'fiscal_general'
- **Funcionalidad**: 
  - Si hay foto existente, la muestra en el modal
  - Permite subir una nueva foto (reemplaza la existente)
  - Integración con galería para visualización completa

## Uso

### Escritorio
1. Los botones aparecerán en la tabla de escuelas para usuarios con rol 'fiscal_general'
2. Al hacer clic en un botón, se abrirá el modal de subida de foto
3. **Si hay foto existente**: Se mostrará en la parte superior del modal
4. **Visualizar foto existente**: Hacer clic en "Ver foto" para abrir la galería
5. **Seleccionar archivo**: 
   - Hacer clic en el área de subida para abrir el explorador de archivos
   - **Arrastrar y soltar** archivos directamente en el área de subida
6. El archivo se sube automáticamente al S3
7. El URL se guarda en la tabla `Escuela` en los campos `acta_escrutinio` o `cert_escrutinio`
8. **Reemplaza la foto existente** si ya había una subida
9. Se muestra un mensaje de confirmación al completar la subida
10. La tabla se actualiza automáticamente para mostrar los badges de estado

### Móviles
1. Los botones aparecerán en la tabla de escuelas para usuarios con rol 'fiscal_general'
2. Al hacer clic en un botón, se abrirá el modal de subida de foto
3. **Opciones de subida**:
   - **Botón "Galería"**: Abre la galería de fotos del dispositivo
   - **Botón "Cámara"**: Abre directamente la cámara para tomar una foto
   - **Área de subida**: Hacer clic abre automáticamente la cámara
4. El archivo se sube automáticamente al S3
5. El resto del proceso es igual al de escritorio

## Galería de Fotos

### Características
- **Visualización simple**: Muestra una sola foto en tamaño completo
- **Enlace externo**: Abrir foto en nueva pestaña
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Zoom automático**: La foto se ajusta al tamaño del modal
- **Manejo de errores**: Muestra mensaje si la foto no se puede cargar

## Estructura de Datos en Base de Datos

### Tabla Escuela
- `acta_escrutinio`: String con URL de la foto de acta (una sola foto)
- `cert_escrutinio`: String con URL de la foto de certificado (una sola foto)

### Ejemplo de URLs almacenados:
```
acta_escrutinio: "https://bucket.com/escrutinio/acta1.jpg"
cert_escrutinio: "https://bucket.com/escrutinio/cert1.jpg"
```

## Seguridad

- Solo usuarios autenticados pueden subir archivos
- Validación de tipos de archivo en frontend y backend
- Límite de tamaño de archivo
- Hash de archivos para detección de duplicados
- Registro de metadatos en base de datos
