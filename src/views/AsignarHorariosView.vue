<template>
  <div class="asignar-horarios-view">
    <div class="page-intro">
      <div class="stepper">
        <div class="step" :class="{ 'active': !bloqueActual, 'completed': bloqueActual }">
          <div class="step-num">1</div>
          <div class="step-label">Seleccionar Bloque</div>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ 'active': bloqueActual && asignaciones.length === 0, 'completed': asignaciones.length > 0 }">
          <div class="step-num">2</div>
          <div class="step-label">Asignar Cursos</div>
        </div>
        <div class="step-line"></div>
        <div class="step" :class="{ 'active': asignaciones.length > 0 }">
          <div class="step-num">3</div>
          <div class="step-label">Vista Previa</div>
        </div>
      </div>
    </div>

    <!-- PASO 1: Seleccionar Bloque -->
    <div class="glass-card selector-card" :class="{ 'minimized': bloqueActual }">
      <div class="card-header">
        <div class="header-icon">📍</div>
        <h2>Selección de Bloque Académico</h2>
      </div>
      <div class="selector-grid">
        <div class="form-group">
          <label>Período Académico</label>
          <div class="input-wrapper">
            <select v-model="periodoSeleccionado" @change="cargarBloquesPorPeriodo" class="custom-select">
              <option value="">Seleccionar período...</option>
              <option v-for="periodo in periodos" :key="periodo._id" :value="periodo._id">
                {{ periodo.codigo }} - {{ periodo.nombre }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Bloque / NRC</label>
          <div class="input-wrapper">
            <select v-model="bloqueSeleccionado" @change="cargarInfoBloque" class="custom-select">
              <option value="">Seleccionar bloque...</option>
              <option v-for="bloque in bloquesFiltrados" :key="bloque._id" :value="bloque._id">
                {{ bloque.codigo }} - {{ bloque.carrera?.nombre }} (Sem. {{ bloque.semestreAcademico }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Información del Bloque Seleccionado (Floating Pill Style) -->
    <div v-if="bloqueActual" class="bloque-summary-pill fadeIn">
      <div class="pill-info">
        <span class="pill-code">{{ bloqueActual.codigo }}</span>
        <span class="pill-divider"></span>
        <span class="pill-carrera">{{ bloqueActual.carrera?.nombre }}</span>
        <span class="pill-semestre">Semestre {{ bloqueActual.semestreAcademico }}</span>
      </div>
      <div class="pill-stats">
        <div class="mini-stat">
          <span class="label">Capacidad</span>
          <span class="value">{{ bloqueActual.totalInscritos || 0 }}/{{ bloqueActual.capacidadMax }}</span>
        </div>
      </div>
    </div>

    <!-- PASO 2: Asignar Cursos al Bloque -->
    <div v-if="bloqueActual" class="main-content-grid">
      <div class="glass-card assignment-card fadeIn">
        <div class="section-header">
          <h2>📚 Cursos del Semestre</h2>
          <button class="btn btn-premium" @click="mostrarModalAsignacion = true">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Asignar Nuevo</span>
          </button>
        </div>

        <div v-if="asignaciones.length === 0" class="empty-state-container">
          <div class="empty-icon">📂</div>
          <p>No hay cursos asignados. Comienza agregando el primer curso de la malla.</p>
        </div>

        <div v-else class="asignaciones-grid">
          <div v-for="asignacion in asignaciones" :key="asignacion._id" class="asignacion-glass-item">
            <div class="item-header">
              <div class="curso-title-group">
                <h3>{{ asignacion.curso?.nombre }}</h3>
                <div class="badges">
                  <span class="badge badge-code">{{ asignacion.curso?.codigo }}</span>
                  <span class="badge badge-credits">{{ asignacion.curso?.creditos }} Cred.</span>
                </div>
              </div>
              <div class="item-actions">
                <button class="icon-btn edit" @click="editarAsignacion(asignacion)" title="Editar">
                  ✏️
                </button>
                <button class="icon-btn delete" @click="eliminarAsignacion(asignacion._id)" title="Eliminar">
                  🗑️
                </button>
              </div>
            </div>

            <div class="item-details">
              <div class="detail">
                <span class="detail-label">Profesor</span>
                <span class="detail-val">{{ asignacion.profesor?.nombres }} {{ asignacion.profesor?.apellidos }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Aula</span>
                <span class="detail-val">{{ asignacion.aula?.nombre || 'Pendiente' }}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Horas</span>
                <span class="detail-val">{{ asignacion.curso?.horasTotal }}h</span>
              </div>
            </div>

            <div class="item-horarios">
              <div class="horarios-top">
                <h4>Horarios Registrados</h4>
                <button class="text-btn" @click="agregarHorario(asignacion)">+ Agregar</button>
              </div>
              <div v-if="asignacion.horarios && asignacion.horarios.length > 0" class="horario-pills">
                <div 
                  v-for="horario in asignacion.horarios" 
                  :key="horario._id" 
                  class="horario-pill"
                  @click="editarHorario(horario)"
                >
                  <span class="day">{{ horario.diaSemana.substring(0,2) }}</span>
                  <span class="time">{{ horario.horaInicio }} - {{ horario.horaFin }}</span>
                  <button class="pill-close" @click.stop="eliminarHorario(horario._id)">×</button>
                </div>
              </div>
              <div v-else class="no-horarios-msg">Sin horarios definidos</div>
            </div>
          </div>
        </div>
      </div>

      <!-- PASO 3: Vista Previa Real-Time -->
      <div v-if="asignaciones.length > 0" class="glass-card preview-card fadeIn">
        <div class="card-header">
          <h2>🕒 Vista Previa Semanal</h2>
          <div class="legend">
            <span class="dot t"></span> Teoría
            <span class="dot p"></span> Práctica
            <span class="dot l"></span> Lab
          </div>
        </div>
        
        <div class="calendar-container">
          <div class="calendar-grid">
            <div class="grid-header">
              <div class="time-col">Hora</div>
              <div v-for="dia in diasSemana" :key="dia" class="day-col">{{ dia }}</div>
            </div>
            <div class="grid-body">
              <div v-for="hora in horasUnicas" :key="hora" class="grid-row">
                <div class="time-cell">{{ hora }}</div>
                <div v-for="dia in diasSemana" :key="dia" class="content-cell">
                  <div v-if="obtenerSesion(dia, hora)" :class="['slot-box', `type-${obtenerSesion(dia, hora).tipo}`]">
                    <div class="slot-curso">{{ obtenerSesion(dia, hora).curso }}</div>
                    <div class="slot-meta">{{ obtenerSesion(dia, hora).aula }}</div>
                    <div class="slot-prof">{{ obtenerSesion(dia, hora).profesor.split(' ')[0] }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Asignar Curso al Bloque -->
    <Modal
      v-model="mostrarModalAsignacion"
      :titulo="asignacionActual ? 'Editar Asignación' : 'Asignar Curso'"
      size="large"
      :loading="guardando"
      @guardar="guardarAsignacion"
    >
      <form @submit.prevent="guardarAsignacion" class="form-modal">
        <div class="form-group">
          <label>Curso *</label>
          <select v-model="formularioAsignacion.curso" class="form-input" required>
            <option value="">Seleccionar curso</option>
            <option v-for="curso in cursosDisponibles" :key="curso._id" :value="curso._id">
              {{ curso.codigo }} - {{ curso.nombre }} ({{ curso.horasTotal }}h)
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Profesor *</label>
            <select v-model="formularioAsignacion.profesor" class="form-input" required>
              <option value="">Seleccionar profesor</option>
              <option v-for="profesor in profesores" :key="profesor._id" :value="profesor._id">
                {{ profesor.nombres }} {{ profesor.apellidos }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Aula</label>
            <select v-model="formularioAsignacion.aula" class="form-input">
              <option value="">Seleccionar aula</option>
              <option v-for="aula in aulas" :key="aula._id" :value="aula._id">
                {{ aula.codigo }} - {{ aula.nombre }} ({{ aula.tipo }}, Cap: {{ aula.capacidad }})
              </option>
            </select>
          </div>
        </div>
      </form>
    </Modal>

    <!-- Modal: Agregar/Editar Horario -->
    <Modal
      v-model="mostrarModalHorario"
      :titulo="horarioEditando ? 'Editar Horario' : 'Agregar Horario'"
      :loading="guardando"
      @guardar="guardarHorario"
    >
      <form @submit.prevent="guardarHorario" class="form-modal">
        <div class="form-row">
          <div class="form-group">
            <label>Día de la Semana *</label>
            <select v-model="formularioHorario.diaSemana" class="form-input" required>
              <option value="">Seleccionar</option>
              <option v-for="dia in diasSemana" :key="dia" :value="dia">{{ dia }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo de Sesión *</label>
            <select v-model="formularioHorario.tipoSesion" class="form-input" required>
              <option value="">Seleccionar</option>
              <option value="Teoría">Teoría</option>
              <option value="Taller">Taller</option>
              <option value="Laboratorio">Laboratorio</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Hora Inicio *</label>
            <input v-model="formularioHorario.horaInicio" type="time" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Hora Fin *</label>
            <input v-model="formularioHorario.horaFin" type="time" class="form-input" required>
          </div>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import Modal from '../components/Modal.vue'
import { bloquesService, periodosService, cursosService, profesoresService, aulasService } from '../services'
import api from '../services/api'

const toast = inject('toast')
const periodos = ref([])
const bloques = ref([])
const periodoSeleccionado = ref('')
const bloqueSeleccionado = ref('')
const bloqueActual = ref(null)
const asignaciones = ref([])
const profesores = ref([])
const aulas = ref([])
const cursos = ref([])
const guardando = ref(false)

const mostrarModalAsignacion = ref(false)
const mostrarModalHorario = ref(false)
const asignacionActual = ref(null) // Para saber a qué asignación agregar horario
const horarioEditando = ref(null) // Para saber si estamos editando un horario

const formularioAsignacion = ref({
  curso: '',
  profesor: '',
  aula: '',
  bloque: ''
})

const formularioHorario = ref({
  asignacion: '',
  diaSemana: '',
  horaInicio: '',
  horaFin: '',
  tipoSesion: ''
})

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const bloquesFiltrados = computed(() => {
  if (!periodoSeleccionado.value) return []
  return bloques.value.filter(b => b.periodo?._id === periodoSeleccionado.value)
})

const cursosDisponibles = computed(() => {
  if (!bloqueActual.value) return []
  
  const bloqueCarreraId = String(bloqueActual.value.carrera?._id || bloqueActual.value.carrera || '');
  const bloqueSemestre = String(bloqueActual.value.semestreAcademico || '').trim().toUpperCase();

  return cursos.value.filter(c => {
    const cursoCarreraId = String(c.carrera?._id || c.carrera || '');
    const cursoSemestre = String(c.semestre || '').trim().toUpperCase();
    
    return cursoCarreraId === bloqueCarreraId && cursoSemestre === bloqueSemestre;
  });
})

const horasUnicas = computed(() => {
  const horas = new Set()
  asignaciones.value.forEach(asig => {
    asig.horarios?.forEach(h => {
      horas.add(h.horaInicio)
    })
  })
  return Array.from(horas).sort()
})

function obtenerSesion(dia, hora) {
  for (const asig of asignaciones.value) {
    if (!asig.horarios) continue
    const horario = asig.horarios.find(h => h.diaSemana === dia && h.horaInicio === hora)
    if (horario) {
      return {
        curso: asig.curso?.codigo || '',
        profesor: `${asig.profesor?.nombres || ''} ${asig.profesor?.apellidos || ''}`,
        aula: asig.aula?.codigo || 'N/A',
        tipo: (horario.tipoSesion || 'teoria').toLowerCase()
      }
    }
  }
  return null
}

async function cargarPeriodos() {
  try {
    const response = await periodosService.getAll()
    periodos.value = response.data.data
    const activo = periodos.value.find(p => p.estado === 'activo')
    if (activo) {
      periodoSeleccionado.value = activo._id
      await cargarBloquesPorPeriodo()
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function cargarBloquesPorPeriodo() {
  try {
    const response = await bloquesService.getAll({ periodo: periodoSeleccionado.value })
    bloques.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

async function cargarInfoBloque() {
  try {
    const response = await bloquesService.getById(bloqueSeleccionado.value)
    bloqueActual.value = response.data.data
    
    // Cargar específicamente los cursos de esta carrera y semestre para evitar problemas de paginación/límites
    if (bloqueActual.value) {
      const carreraId = bloqueActual.value.carrera?._id || bloqueActual.value.carrera;
      const semestre = bloqueActual.value.semestreAcademico;
      
      const cursosRes = await cursosService.getAll({ 
        carrera: carreraId, 
        semestre: semestre,
        limit: 500 // Suficiente para un semestre
      });
      cursos.value = cursosRes.data.data;
    }
    
    await cargarAsignaciones()
  } catch (error) {
    console.error('Error:', error)
  }
}

async function cargarAsignaciones() {
  try {
    const response = await api.get(`/asignaciones?bloque=${bloqueSeleccionado.value}`)
    asignaciones.value = response.data.data
    
    // Cargar horarios para cada asignación
    for (const asig of asignaciones.value) {
      const horariosRes = await api.get(`/horarios?asignacion=${asig._id}`)
      asig.horarios = horariosRes.data.data
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function guardarAsignacion() {
  try {
    guardando.value = true
    formularioAsignacion.value.bloque = bloqueSeleccionado.value
    
    if (asignacionActual.value) {
      await api.put(`/asignaciones/${asignacionActual.value._id}`, formularioAsignacion.value)
    } else {
      await api.post('/asignaciones', formularioAsignacion.value)
    }

    await cargarAsignaciones()
    mostrarModalAsignacion.value = false
    formularioAsignacion.value = { curso: '', profesor: '', aula: '', bloque: '' }
    asignacionActual.value = null
  } catch (error) {
    console.error('Error:', error)
    alert('Error al guardar la asignación')
  } finally {
    guardando.value = false
  }
}

function editarAsignacion(asignacion) {
  asignacionActual.value = asignacion
  formularioAsignacion.value = {
    curso: asignacion.curso?._id || '',
    profesor: asignacion.profesor?._id || '',
    aula: asignacion.aula?._id || '',
    bloque: bloqueSeleccionado.value
  }
  mostrarModalAsignacion.value = true
}

function agregarHorario(asignacion) {
  asignacionActual.value = asignacion
  horarioEditando.value = null
  formularioHorario.value = {
    asignacion: asignacion._id,
    diaSemana: '',
    horaInicio: '',
    horaFin: '',
    tipoSesion: 'Teoría'
  }
  mostrarModalHorario.value = true
}

function editarHorario(horario) {
  horarioEditando.value = horario
  formularioHorario.value = {
    asignacion: horario.asignacion,
    diaSemana: horario.diaSemana,
    horaInicio: horario.horaInicio,
    horaFin: horario.horaFin,
    tipoSesion: horario.tipoSesion
  }
  mostrarModalHorario.value = true
}

async function guardarHorario() {
  try {
    guardando.value = true
    
    if (horarioEditando.value) {
       await api.put(`/horarios/${horarioEditando.value._id}`, formularioHorario.value)
       toast.success('Éxito', 'Horario actualizado correctamente')
    } else {
       await api.post('/horarios', formularioHorario.value)
       toast.success('Éxito', 'Horario agregado correctamente')
    }

    await cargarAsignaciones()
    mostrarModalHorario.value = false
  } catch (error) {
    console.error('Error:', error)
    const status = error.response?.status
    const msg = error.response?.data?.message || 'Error al guardar el horario'
    
    if (status === 409) {
      toast.error('Conflicto de Horario', msg)
    } else {
      toast.error('Error', msg)
    }
  } finally {
    guardando.value = false
  }
}

async function eliminarAsignacion(id) {
  if (!confirm('¿Eliminar esta asignación? Se borrarán todos sus horarios.')) return
  try {
    await api.delete(`/asignaciones/${id}`)
    toast.success('Eliminado', 'Asignación eliminada correctamente')
    await cargarAsignaciones()
  } catch (error) {
    console.error('Error:', error)
    toast.error('Error', 'No se pudo eliminar la asignación')
  }
}

async function eliminarHorario(id) {
  if (!confirm('¿Eliminar este horario?')) return
  try {
    await api.delete(`/horarios/${id}`)
    toast.success('Eliminado', 'Horario eliminado correctamente')
    await cargarAsignaciones()
  } catch (error) {
    console.error('Error:', error)
    toast.error('Error', 'No se pudo eliminar el horario')
  }
}

async function cargarDatos() {
  try {
    const [profesoresRes, aulasRes] = await Promise.all([
      profesoresService.getAll(),
      aulasService.getAll()
    ])
    profesores.value = profesoresRes.data.data
    aulas.value = aulasRes.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    cargarPeriodos(),
    cargarDatos()
  ])
})
</script>

<style scoped>
.asignar-horarios-view {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border-radius: 2rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.4;
  transition: all 0.3s;
}

.step.active { opacity: 1; }
.step.completed { opacity: 0.8; color: var(--accent); }

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.step.active .step-num {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 0 15px rgba(242, 101, 34, 0.4);
}

.step.completed .step-num {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.step-line {
  width: 50px;
  height: 2px;
  background: var(--border);
}

.selector-card {
  margin-bottom: 2rem;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.selector-card.minimized {
  padding: 1rem 2.5rem;
  opacity: 0.8;
}

.selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

.custom-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2em;
}

.bloque-summary-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  padding: 1rem 2.5rem;
  border-radius: 3rem;
  color: white;
  margin-bottom: 2.5rem;
  box-shadow: var(--shadow-lg);
}

.pill-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.pill-code { font-weight: 900; font-size: 1.25rem; }
.pill-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.3); }

.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
}

.assignment-card {
  max-height: 850px;
  overflow-y: auto;
}

.asignaciones-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.asignacion-glass-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  padding: 1.5rem;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.asignacion-glass-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(252, 163, 17, 0.3);
  transform: translateX(5px);
}

.btn-premium {
  background: linear-gradient(135deg, var(--accent), #FF8E53);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

.btn-premium:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(242, 101, 34, 0.5);
}

.item-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 1rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
.detail-val { font-size: 0.85rem; font-weight: 600; }

.item-actions { display: flex; gap: 0.5rem; }
.icon-btn { 
  background: var(--bg-main); 
  border: 1px solid var(--border); 
  width: 32px; height: 32px; 
  border-radius: 50%; 
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover { border-color: var(--accent); transform: scale(1.1); }

.item-horarios {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.horarios-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.horarios-top h4 { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; }

.text-btn {
  background: rgba(242, 101, 34, 0.1);
  border: 1px solid rgba(242, 101, 34, 0.2);
  color: var(--accent);
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
}

.text-btn:hover { background: var(--accent); color: white; }

.horario-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.horario-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  padding: 0.35rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.horario-pill .day { font-weight: 900; color: var(--accent); }

/* Calendar */
.calendar-container {
  margin-top: 1.5rem;
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-card);
}

.grid-header { display: grid; grid-template-columns: 80px repeat(6, 1fr); background: rgba(0,0,0,0.1); }
.day-col { padding: 1rem; text-align: center; font-weight: 800; font-size: 0.8rem; }

.grid-row { display: grid; grid-template-columns: 80px repeat(6, 1fr); border-top: 1px solid var(--border); }
.time-cell { padding: 1rem; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); }

.content-cell { padding: 0.25rem; border-left: 1px solid var(--border); min-height: 90px; }

.slot-box {
  padding: 0.6rem;
  height: 100%;
  border-radius: 0.6rem;
  font-size: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.type-teoría { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
.type-taller { background: linear-gradient(135deg, #10b981, #047857); color: white; }
.type-laboratorio { background: linear-gradient(135deg, #f59e0b, #b45309); color: white; }

.slot-curso { font-weight: 900; }
.slot-prof { font-size: 0.6rem; opacity: 0.9; }

@media (max-width: 1400px) {
  .main-content-grid { grid-template-columns: 1fr; }
}
</style>
