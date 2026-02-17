<template>
  <div class="horarios-visuales">
    <!-- Header con filtros -->
    <div class="header-section">
      <h1>📅 Horarios Visuales</h1>
      <p>Vista interactiva de todos los horarios generados</p>
    </div>

    <!-- Filtros -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="filter-group">
          <label>🏫 Bloque</label>
          <select v-model="filtros.bloqueId" @change="cargarHorarios">
            <option value="">Todos los bloques</option>
            <option v-for="bloque in bloques" :key="bloque._id" :value="bloque._id">
              {{ bloque.codigo }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>👨‍🏫 Profesor</label>
          <select v-model="filtros.profesorId" @change="cargarHorarios">
            <option value="">Todos los profesores</option>
            <option v-for="profesor in profesores" :key="profesor._id" :value="profesor._id">
              {{ profesor.nombres }} {{ profesor.apellidos }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>🚪 Aula</label>
          <select v-model="filtros.aulaId" @change="cargarHorarios">
            <option value="">Todas las aulas</option>
            <option v-for="aula in aulas" :key="aula._id" :value="aula._id">
              {{ aula.codigo }} - {{ aula.nombre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>⏰ Turno</label>
          <select v-model="filtros.turno" @change="cargarHorarios">
            <option value="">Todos</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>
      </div>

      <button class="btn btn-secondary" @click="limpiarFiltros">
        Limpiar Filtros
      </button>
    </div>

    <!-- Calendario Semanal -->
    <div v-if="!cargando" class="card calendario-card">
      <div class="calendario-header">
        <h2>Horario Semanal</h2>
        <div class="stats">
          <span class="stat-badge">📚 {{ totalHorarios }} sesiones</span>
          <span class="stat-badge">👨‍🏫 {{ profesoresActivos }} profesores</span>
          <span class="stat-badge">🚪 {{ aulasActivas }} aulas</span>
        </div>
      </div>

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
              v-for="horario in obtenerHorario(dia, hora)"
              :key="horario._id"
              :class="['horario-item', getTipoClase(horario)]"
              @click="seleccionarHorario(horario)"
            >
              <div class="horario-curso">{{ horario.curso?.nombre }}</div>
              <div class="horario-profesor">
                👨‍🏫 {{ horario.profesor?.nombres }} {{ horario.profesor?.apellidos?.charAt(0) }}.
              </div>
              <div class="horario-aula">🚪 {{ horario.aula?.codigo }}</div>
              <div class="horario-tiempo">{{ horario.horaInicio }} - {{ horario.horaFin }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="loading">
      <div class="spinner"></div>
      <p>Cargando horarios...</p>
    </div>

    <!-- Modal de detalle -->
    <div v-if="horarioSeleccionado" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📋 Detalle del Horario</h3>
          <button class="btn-close" @click="cerrarModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-row">
            <strong>Curso:</strong>
            <span>{{ horarioSeleccionado.curso?.nombre }}</span>
          </div>
          <div class="detail-row">
            <strong>Bloque:</strong>
            <span>{{ horarioSeleccionado.bloque?.codigo }}</span>
          </div>
          <div class="detail-row">
            <strong>Profesor:</strong>
            <span>{{ horarioSeleccionado.profesor?.nombres }} {{ horarioSeleccionado.profesor?.apellidos }}</span>
          </div>
          <div class="detail-row">
            <strong>Aula:</strong>
            <span>{{ horarioSeleccionado.aula?.codigo }} - {{ horarioSeleccionado.aula?.nombre }}</span>
          </div>
          <div class="detail-row">
            <strong>Día:</strong>
            <span>{{ horarioSeleccionado.diaSemana }}</span>
          </div>
          <div class="detail-row">
            <strong>Horario:</strong>
            <span>{{ horarioSeleccionado.horaInicio }} - {{ horarioSeleccionado.horaFin }}</span>
          </div>
          <div class="detail-row">
            <strong>Tipo:</strong>
            <span class="badge">{{ horarioSeleccionado.tipoSesion }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" @click="editarHorario">
            ✏️ Editar
          </button>
          <button class="btn btn-secondary" @click="cerrarModal">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { inject } from 'vue'

const toast = inject('toast')

// Estados
const cargando = ref(true)
const horarios = ref([])
const bloques = ref([])
const profesores = ref([])
const aulas = ref([])
const horarioSeleccionado = ref(null)

// Filtros
const filtros = ref({
  bloqueId: '',
  profesorId: '',
  aulaId: '',
  turno: ''
})

// Configuración del calendario
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horasDisponibles = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
]

// Computed
const totalHorarios = computed(() => horarios.value.length)

const profesoresActivos = computed(() => {
  const profesoresSet = new Set(horarios.value.map(h => h.asignacion?.profesor?._id).filter(Boolean))
  return profesoresSet.size
})

const aulasActivas = computed(() => {
  const aulasSet = new Set(horarios.value.map(h => h.aula?._id).filter(Boolean))
  return aulasSet.size
})

// Métodos
const cargarDatos = async () => {
  try {
    cargando.value = true
    
    const [bloquesRes, profesoresRes, aulasRes] = await Promise.all([
      api.get('/bloques'),
      api.get('/profesores'),
      api.get('/aulas')
    ])
    
    bloques.value = bloquesRes.data
    profesores.value = profesoresRes.data
    aulas.value = aulasRes.data
    
    await cargarHorarios()
  } catch (error) {
    console.error('Error cargando datos:', error)
    toast.error('Error', 'No se pudieron cargar los datos')
  } finally {
    cargando.value = false
  }
}

const cargarHorarios = async () => {
  try {
    const params = {}
    if (filtros.value.bloqueId) params.bloque = filtros.value.bloqueId
    if (filtros.value.profesorId) params.profesor = filtros.value.profesorId
    if (filtros.value.aulaId) params.aula = filtros.value.aulaId
    
    const response = await api.get('/horarios', { params })
    const listaHorarios = Array.isArray(response.data) ? response.data : (response.data.data || [])
    
    // Expandir datos de cada horario
    const horariosExpandidos = await Promise.all(
      listaHorarios.map(async (horario) => {
        try {
          // Obtener la asignación completa
          const asignacionRes = await api.get(`/asignaciones/${horario.asignacion}`)
          const asignacion = asignacionRes.data
          
          return {
            ...horario,
            asignacion: asignacion,
            curso: asignacion.curso,
            bloque: asignacion.bloque,
            profesor: asignacion.profesor
          }
        } catch {
          return horario
        }
      })
    )
    
    horarios.value = horariosExpandidos
  } catch (error) {
    console.error('Error cargando horarios:', error)
    toast.error('Error', 'No se pudieron cargar los horarios')
  }
}

const obtenerHorario = (dia, hora) => {
  return horarios.value.filter(h => {
    if (h.diaSemana !== dia) return false
    
    const horaInicio = h.horaInicio?.substring(0, 5)
    return horaInicio === hora
  })
}

const getTipoClase = (horario) => {
  const tipo = horario.tipoSesion?.toLowerCase() || 'teoria'
  return `tipo-${tipo}`
}

const seleccionarHorario = (horario) => {
  horarioSeleccionado.value = horario
}

const cerrarModal = () => {
  horarioSeleccionado.value = null
}

const editarHorario = () => {
  toast.info('Próximamente', 'Usa el chatbot para editar horarios')
  cerrarModal()
}

const limpiarFiltros = () => {
  filtros.value = {
    bloqueId: '',
    profesorId: '',
    aulaId: '',
    turno: ''
  }
  cargarHorarios()
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.horarios-visuales {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
  text-align: center;
}

.header-section h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

.filters-card {
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--dark);
}

.filter-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
}

.calendario-card {
  overflow-x: auto;
}

.calendario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border);
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat-badge {
  background: var(--light-gray);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.calendario-grid {
  display: grid;
  grid-template-columns: 80px repeat(6, 1fr);
  gap: 2px;
  background: var(--border);
  border: 2px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  min-width: 1200px;
}

.horas-column,
.dia-column {
  display: grid;
  grid-template-rows: auto;
  gap: 2px;
}

.header-cell {
  background: var(--primary);
  color: white;
  padding: 1rem;
  font-weight: 700;
  text-align: center;
  font-size: 1rem;
}

.hora-cell {
  background: var(--light-gray);
  padding: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
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
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.horario-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

.horario-item.tipo-virtual {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.horario-curso {
  font-weight: 700;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

.horario-profesor,
.horario-aula,
.horario-tiempo {
  font-size: 0.7rem;
  opacity: 0.95;
  margin-bottom: 0.15rem;
}

.loading {
  text-align: center;
  padding: 4rem;
}

.spinner {
  border: 4px solid var(--light-gray);
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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

.modal-header h3 {
  margin: 0;
  color: var(--primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray);
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--light-gray);
}

.detail-row:last-child {
  border-bottom: none;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
