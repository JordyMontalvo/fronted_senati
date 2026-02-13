<template>
  <div class="preview-horarios-container">
    <!-- Header -->
    <div class="header-section">
      <div class="header-content">
        <h1>📋 Vista Previa de Horarios Generados</h1>
        <p>Revisa y modifica los horarios antes de confirmar la importación</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-info" @click="exportarPDF" :disabled="guardando">
          📄 Exportar PDF
        </button>
        <button class="btn btn-secondary" @click="cancelar">
          ✕ Cancelar
        </button>
        <button class="btn btn-success" @click="confirmarImportacion" :disabled="guardando">
          <span v-if="!guardando">✅ Confirmar y Guardar Todo</span>
          <span v-else>⏳ Guardando...</span>
        </button>
      </div>
    </div>

    <!-- Alertas de Conflictos -->
    <div v-if="conflictosDetectados.length > 0" class="alert alert-warning">
      <strong>⚠️ Conflictos Detectados:</strong>
      <ul>
        <li v-for="(conflicto, idx) in conflictosDetectados" :key="idx">
          {{ conflicto.mensaje }}
        </li>
      </ul>
    </div>

    <!-- Estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-value">{{ datosPrev.bloques || 0 }}</div>
          <div class="stat-label">Bloques</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <div class="stat-value">{{ datosPrev.asignaciones || 0 }}</div>
          <div class="stat-label">Asignaciones</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-value">{{ datosPrev.horarios || 0 }}</div>
          <div class="stat-label">Horarios</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✏️</div>
        <div class="stat-content">
          <div class="stat-value">{{ modificaciones }}</div>
          <div class="stat-label">Modificaciones</div>
        </div>
      </div>
    </div>

    <!-- Chatbot Integration -->
    <div class="chatbot-helper">
      <div class="chatbot-icon">🤖</div>
      <div class="chatbot-text">
        <strong>Asistente activo</strong>
        <p>Usa el chatbot de la esquina para hacer cambios. Ejemplo: "cambiar aula del horario..."</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="filter-group">
          <label>🏫 Bloque</label>
          <select v-model="filtro.bloque">
            <option value="">Todos</option>
            <option v-for="bloque in bloquesGenerados" :key="bloque.codigo" :value="bloque.codigo">
              {{ bloque.codigo }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>⏰ Turno</label>
          <select v-model="filtro.turno">
            <option value="">Todos</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>

        <div class="filter-group">
          <label>📖 Día</label>
          <select v-model="filtro.dia">
            <option value="">Todos</option>
            <option v-for="d in dias" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Vista de Calendario Simplificada -->
    <div class="card calendario-preview">
      <h3>Calendario Semanal - {{ bloqueActual || 'Todos los bloques' }}</h3>
      
      <div class="calendario-grid">
        <!-- Columna de horas -->
        <div class="horas-column">
          <div class="header-cell">Hora</div>
          <div v-for="hora in horasDisponibles" :key="hora" class="hora-cell">
            {{ hora }}
          </div>
        </div>

        <!-- Columnas de días -->
        <div v-for="dia in dias" :key="dia" class="dia-column">
          <div class="header-cell">{{ dia }}</div>
          <div v-for="hora in horasDisponibles" :key="hora" class="horario-cell">
            <div
              v-for="horario in obtenerHorarioFiltrado(dia, hora)"
              :key="horario.id"
              :class="['horario-item', getTipoClase(horario)]"
              @click="editarHorario(horario)"
            >
              <div class="horario-curso">{{ horario.curso }}</div>
              <div class="horario-profesor">👨‍🏫 {{ horario.profesor }}</div>
              <div class="horario-aula">🚪 {{ horario.aula }}</div>
              <div class="horario-bloque">📦 {{ horario.bloque }}</div>
              <button class="btn-edit-mini">✏️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de todos los horarios -->
    <div class="card">
      <h3>📋 Lista Detallada de Horarios</h3>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Bloque</th>
              <th>Curso</th>
              <th>Profesor</th>
              <th>Aula</th>
              <th>Día</th>
              <th>Horario</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="horario in horariosFiltrados" :key="horario.id">
              <td><span class="badge badge-primary">{{ horario.bloque }}</span></td>
              <td>{{ horario.curso }}</td>
              <td>{{ horario.profesor }}</td>
              <td>{{ horario.aula }}</td>
              <td>{{ horario.dia }}</td>
              <td>{{ horario.horaInicio }} - {{ horario.horaFin }}</td>
              <td><span :class="['badge', getBadgeClass(horario)]">{{ horario.tipo }}</span></td>
              <td>
                <button class="btn-icon" @click="editarHorario(horario)" title="Editar">
                  ✏️
                </button>
                <button class="btn-icon" @click="eliminarHorario(horario)" title="Eliminar">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de edición -->
    <div v-if="horarioEditando" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✏️ Editar Horario</h3>
          <button class="btn-close" @click="cerrarModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Día</label>
            <select v-model="horarioEditando.dia">
              <option v-for="d in dias" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Hora Inicio</label>
              <input type="time" v-model="horarioEditando.horaInicio" />
            </div>
            <div class="form-group">
              <label>Hora Fin</label>
              <input type="time" v-model="horarioEditando.horaFin" />
            </div>
          </div>

          <div class="form-group">
            <label>Aula</label>
            <input type="text" v-model="horarioEditando.aula" placeholder="Ej: A-101" />
          </div>

          <div class="form-group">
            <label>Profesor</label>
            <input type="text" v-model="horarioEditando.profesor" />
          </div>

          <div class="form-group">
            <label>Tipo de Sesión</label>
            <select v-model="horarioEditando.tipo">
              <option value="Teoría">Teoría</option>
              <option value="Taller">Taller</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
          <button class="btn btn-primary" @click="guardarEdicion">Guardar Cambios</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import api from '../services/api'

const route = useRoute()
const router = useRouter()
const toast = inject('toast')

// Estados
const datosPrev = ref({
  bloques: 0,
  asignaciones: 0,
  horarios: 0
})
const horariosGenerados = ref([])
const bloquesGenerados = ref([])
const modificaciones = ref(0)
const guardando = ref(false)
const horarioEditando = ref(null)
const conflictosDetectados = ref([])

// Filtros
const filtro = ref({
  bloque: '',
  turno: '',
  dia: ''
})

// Configuración
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horasDisponibles = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
]

// Computed
const bloqueActual = computed(() => filtro.value.bloque || '')

const horariosFiltrados = computed(() => {
  let resultado = [...horariosGenerados.value]
  
  if (filtro.value.bloque) {
    resultado = resultado.filter(h => h.bloque === filtro.value.bloque)
  }
  
  if (filtro.value.turno) {
    // Filtrar por horario del turno
    resultado = resultado.filter(h => {
      const hora = parseInt(h.horaInicio.split(':')[0])
      if (filtro.value.turno === 'mañana') return hora < 13
      if (filtro.value.turno === 'tarde') return hora >= 14 && hora < 19
      if (filtro.value.turno === 'noche') return hora >= 19
      return true
    })
  }
  
  if (filtro.value.dia) {
    resultado = resultado.filter(h => h.dia === filtro.value.dia)
  }
  
  return resultado
})

// Métodos
const cargarDatosPreview = () => {
  // Cargar datos del preview desde sessionStorage
  const previewData = sessionStorage.getItem('horariosPreview')
  
  if (!previewData) {
    toast.error('Error', 'No hay datos de preview disponibles')
    router.push('/importar-excel')
    return
  }
  
  try {
    const data = JSON.parse(previewData)
    
    if (data.success && data.preview) {
      // Cargar bloques
      bloquesGenerados.value = data.preview.bloques || []
      
      // Cargar horarios
      const horariosFromBackend = data.preview.horarios || []
      
      // Transformar al formato esperado por la vista
      horariosGenerados.value = horariosFromBackend.map(h => ({
        id: h.id,
        bloque: h.bloque,
        curso: h.curso,
        profesor: h.profesor,
        aula: h.aula,
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        tipo: h.tipo
      }))
      
      // Actualizar estadísticas
      datosPrev.value = {
        bloques: data.stats.bloques || 0,
        asignaciones: data.stats.asignaciones || 0,
        horarios: data.stats.horarios || 0
      }
      
      toast.success('Vista Previa Cargada', `${horariosGenerados.value.length} horarios listos para revisar`)
    } else {
      throw new Error('Datos de preview inválidos')
    }
  } catch (error) {
    console.error('Error al cargar preview:', error)
    toast.error('Error', 'No se pudieron cargar los datos del preview')
    router.push('/importar-excel')
  }
}

const obtenerHorarioFiltrado = (dia, hora) => {
  return horariosFiltrados.value.filter(h => {
    return h.dia === dia && h.horaInicio === hora
  })
}

const getTipoClase = (horario) => {
  return `tipo-${horario.tipo.toLowerCase()}`
}

const getBadgeClass = (horario) => {
  const tipos = {
    'Teoría': 'badge-primary',
    'Taller': 'badge-warning',
    'Laboratorio': 'badge-info',
    'Virtual': 'badge-success'
  }
  return tipos[horario.tipo] || 'badge-secondary'
}

const editarHorario = (horario) => {
  horarioEditando.value = { ...horario }
}

const cerrarModal = () => {
  horarioEditando.value = null
}

const guardarEdicion = () => {
  const index = horariosGenerados.value.findIndex(h => h.id === horarioEditando.value.id)
  if (index !== -1) {
    horariosGenerados.value[index] = { ...horarioEditando.value }
    modificaciones.value++
    toast.success('Guardado', 'Cambios aplicados a la vista previa')
  }
  cerrarModal()
}

const eliminarHorario = (horario) => {
  if (confirm('¿Seguro que quieres eliminar este horario?')) {
    const index = horariosGenerados.value.findIndex(h => h.id === horario.id)
    if (index !== -1) {
      horariosGenerados.value.splice(index, 1)
      modificaciones.value++
      datosPrev.value.horarios--
      toast.success('Eliminado', 'Horario eliminado de la vista previa')
    }
  }
}

const cancelar = () => {
  if (confirm('¿Seguro que quieres cancelar? Se perderán todos los cambios.')) {
    router.push('/importar-excel')
  }
}

const confirmarImportacion = async () => {
  if (!confirm(`¿Confirmar importación de ${datosPrev.value.bloques} bloques y ${datosPrev.value.horarios} horarios?`)) {
    return
  }
  
  guardando.value = true
  conflictosDetectados.value = []
  
  try {
    toast.info('Guardando', 'Validando y guardando en la base de datos...')
    
    // Preparar datos para enviar
    const payload = {
      bloques: bloquesGenerados.value,
      horarios: horariosGenerados.value.map(h => ({
        ...h,
        bloqueId: bloquesGenerados.value.find(b => b.codigo === h.bloque)?.id
      }))
    }
    
    // Llamar al endpoint real
    const response = await api.post('/upload/bloques/confirmar-preview', payload)
    
    if (response.data.success) {
      // Verificar si hay conflictos
      if (response.data.conflictos && response.data.conflictos.length > 0) {
        conflictosDetectados.value = response.data.conflictos
        toast.warning('⚠️ Conflictos Detectados', `${response.data.conflictos.length} horarios con conflictos no se guardaron`)
        
        // Scroll a la alerta
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.success('¡Éxito! 🎉', response.data.message)
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('horariosPreview')
        
        // Esperar un momento y redirigir
        setTimeout(() => {
          router.push('/horarios/visuales')
        }, 2000)
      }
    } else {
      toast.error('Error', response.data.message)
    }
  } catch (error) {
    console.error('Error al confirmar:', error)
    toast.error('Error', error.response?.data?.message || 'No se pudieron guardar los horarios')
  } finally {
    guardando.value = false
  }
}

const exportarPDF = () => {
  try {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.setTextColor(0, 66, 139)
    doc.text('Horarios Generados - Vista Previa', 14, 20)
    
    // Estadísticas
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`📦 Bloques: ${datosPrev.value.bloques}`, 14, 35)
    doc.text(`📚 Asignaciones: ${datosPrev.value.asignaciones}`, 70, 35)
    doc.text(`📅 Horarios: ${datosPrev.value.horarios}`, 130, 35)
    
    // Tabla de horarios
    const tableData = horariosGenerados.value.map(h => [
      h.bloque,
      h.curso,
      h.profesor,
      h.aula,
      h.dia,
      `${h.horaInicio}-${h.horaFin}`,
      h.tipo
    ])
    
    doc.autoTable({
      head: [['Bloque', 'Curso', 'Profesor', 'Aula', 'Día', 'Horario', 'Tipo']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 66, 139] }
    })
    
    // Guardar
    const fecha = new Date().toISOString().split('T')[0]
    doc.save(`horarios-preview-${fecha}.pdf`)
    
    toast.success('PDF Generado', 'Descarga iniciada')
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toast.error('Error', 'No se pudo generar el PDF')
  }
}

onMounted(() => {
  cargarDatosPreview()
})
</script>

<style scoped>
.preview-horarios-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray);
  font-weight: 500;
}

.chatbot-helper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.chatbot-icon {
  font-size: 2rem;
}

.chatbot-text strong {
  display: block;
  margin-bottom: 0.25rem;
}

.chatbot-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.filters-card {
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.filter-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.calendario-preview h3 {
  margin-bottom: 1.5rem;
  color: var(--dark);
}

.calendario-grid {
  display: grid;
  grid-template-columns: 80px repeat(6, 1fr);
  gap: 2px;
  background: var(--border);
  border-radius: 8px;
  overflow-x: auto;
  min-width: 1200px;
}

.horas-column,
.dia-column {
  display: grid;
  gap: 2px;
}

.header-cell {
  background: var(--primary);
  color: white;
  padding: 1rem;
  font-weight: 700;
  text-align: center;
}

.hora-cell {
  background: var(--light-gray);
  padding: 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.horario-cell {
  background: white;
  padding: 4px;
  min-height: 80px;
  position: relative;
}

.horario-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  margin-bottom: 4px;
  position: relative;
  transition: all 0.2s;
}

.horario-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.horario-item.tipo-teoria {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.horario-item.tipo-taller {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.horario-item.tipo-laboratorio {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.btn-edit-mini {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255,255,255,0.3);
  border: none;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  font-size: 0.7rem;
}

.table-responsive {
  overflow-x: auto;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.alert-warning {
  background: #fef0eb;
  border-left: 4px solid #F26522;
  color: #d84b0e;
}

.alert ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}

.alert li {
  margin: 0.25rem 0;
}
</style>
