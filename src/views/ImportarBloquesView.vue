<template>
  <div class="importar-container">
    <div class="header-section">
      <h1>Importar Bloques y Horarios</h1>
      <p>Sube tu archivo Excel para iniciar el proceso de generación de horarios con IA.</p>
    </div>

    <div class="card upload-card">
      <div v-if="!file" class="upload-area" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
        <div class="upload-icon">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <h3>Arrastra tu archivo Excel aquí</h3>
        <p>o haz clic para seleccionar</p>
        <span class="file-types">Soporta .xlsx, .xls</span>
        <input type="file" ref="fileInput" class="hidden-input" accept=".xlsx, .xls" @change="handleFileSelect">
      </div>

      <div v-else class="file-selected">
        <div class="file-info">
          <span class="file-icon">📄</span>
          <span class="file-name">{{ file.name }}</span>
          <button class="btn-remove" @click="removeFile">✕</button>
        </div>
        <button class="btn btn-primary" :disabled="uploading" @click="uploadFile">
          {{ uploading ? 'Procesando...' : 'Subir y Analizar' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <div v-if="previewData" class="card preview-card">
      <div class="card-header">
        <h2>Vista Previa de Datos</h2>
        <span class="badge badge-info">{{ previewData.totalRows }} filas detectadas</span>
      </div>
      
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th v-for="(header, index) in previewData.headers" :key="index">
                {{ header || `Columna ${index + 1}` }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="previewData.firstRow">
              <td v-for="(cell, index) in previewData.firstRow" :key="index">
                {{ cell }}
              </td>
            </tr>
            <tr v-else>
              <td :colspan="previewData.headers.length" class="text-center">No hay datos de fila para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions-footer">
        <p>¿Los datos se ven correctos?</p>
        <button class="btn btn-success" @click="startGeneration">Confirmar e Iniciar Generación IA 🤖</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { inject } from 'vue'

const toast = inject('toast')
const fileInput = ref(null)
const file = ref(null)
const uploading = ref(false)
const error = ref(null)
const previewData = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const selectedFile = event.target.files[0]
  validateAndSetFile(selectedFile)
}

const handleDrop = (event) => {
  const droppedFile = event.dataTransfer.files[0]
  validateAndSetFile(droppedFile)
}

const validateAndSetFile = (selectedFile) => {
  error.value = null
  if (!selectedFile) return
  
  if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
    error.value = 'Por favor sube un archivo Excel válido (.xlsx o .xls)'
    return
  }
  
  file.value = selectedFile
}

const removeFile = () => {
  file.value = null
  previewData.value = null
  error.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const uploadFile = async () => {
  if (!file.value) return

  uploading.value = true
  error.value = null
  
  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const response = await api.post('/upload/bloques', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      previewData.value = response.data.preview
      toast.success('Éxito', 'Archivo procesado correctamente')
    } else {
      error.value = response.data.message
      toast.error('Error', response.data.message)
    }
  } catch (err) {
    console.error(err)
    error.value = 'Ocurrió un error al subir el archivo. Revisa la consola.'
    toast.error('Error', 'Fallo en la conexión')
  } finally {
    uploading.value = false
  }
}

const startGeneration = async () => {
  if (!previewData.value || !previewData.value.filepath) {
    toast.error('Error', 'No hay archivo para procesar')
    return
  }

  uploading.value = true
  error.value = null

  try {
    toast.info('Procesando', 'Importando bloques y asignando automáticamente...')
    
    const response = await api.post('/upload/bloques/importar-y-asignar', {
      filepath: previewData.value.filepath
    })

    if (response.data.success) {
      toast.success('¡Éxito! 🎉', response.data.message)
      
      // Mostrar estadísticas
      const stats = `
        📦 Bloques importados: ${response.data.importacion.bloquesCreados}
        📚 Asignaciones: ${response.data.asignacion.asignacionesCreadas}
        📅 Horarios: ${response.data.asignacion.horariosCreados}
      `
      console.log('Estadísticas:', stats)
      
      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        removeFile()
      }, 2000)
      
    } else {
      error.value = response.data.message
      toast.error('Error', response.data.message)
    }
  } catch (err) {
    console.error('Error en asignación:', err)
    error.value = err.response?.data?.message || 'Error al procesar la asignación automática'
    toast.error('Error', error.value)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.header-section {
  margin-bottom: 2rem;
  text-align: center;
}

.upload-card {
  max-width: 600px;
  margin: 0 auto 2rem;
  text-align: center;
}

.upload-area {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 3rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--light-gray);
}

.upload-area:hover {
  border-color: var(--primary);
  background: #f0f7ff;
}

.upload-icon {
  color: var(--primary);
  margin-bottom: 1rem;
}

.hidden-input {
  display: none;
}

.file-types {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--gray);
}

.file-selected {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--light-gray);
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.btn-remove {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-weight: bold;
  margin-left: 0.5rem;
}

.error-message {
  color: var(--danger);
  margin-top: 1rem;
  font-size: 0.9rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.actions-footer {
  margin-top: 2rem;
  text-align: center;
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}

.actions-footer p {
  margin-bottom: 1rem;
  color: var(--gray);
}
</style>
