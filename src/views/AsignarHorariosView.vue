<template>
  <div class="asignar-horarios-view fadeIn">
    <!-- Stepper & Block Selection -->
    <div class="header-section">
      <div class="stepper-minimal">
        <div class="s-step" :class="{ active: !bloqueActual }">1. Bloque</div>
        <div class="s-arrow">→</div>
        <div class="s-step" :class="{ active: bloqueActual }">2. Programación</div>
      </div>

      <div class="glass-card selector-bar">
        <div class="selectors">
          <div class="sel-group">
            <label>Período</label>
            <select v-model="periodoSeleccionado" @change="cargarBloquesPorPeriodo">
              <option value="">Seleccionar...</option>
              <option v-for="p in periodos" :key="p._id" :value="p._id">{{ p.codigo }}</option>
            </select>
          </div>
          <div class="sel-group main">
            <label>Bloque Académico (NRC)</label>
            <select v-model="bloqueSeleccionado" @change="cargarInfoBloque">
              <option value="">Seleccionar bloque objetivo...</option>
              <option v-for="b in bloquesFiltrados" :key="b._id" :value="b._id">
                {{ b.codigo }} - {{ b.carrera?.nombre }} (Sem. {{ b.semestreAcademico }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN WORKSPACE -->
    <div v-if="bloqueActual" class="workspace-master fadeIn">
      <!-- SIDEBAR: Academic Progress -->
      <aside class="academic-sidebar glass-card">
        <div class="sidebar-header">
          <h3>Malla Académica</h3>
          <span class="block-badge">{{ bloqueActual.codigo }}</span>
        </div>
        
        <div class="course-list">
          <div v-for="curso in cursosDisponibles" :key="curso._id" class="course-progress-card" 
               :class="{ completed: isCursoCompletado(curso._id) }">
            <div class="c-info">
              <div class="c-main">
                <span class="c-code">{{ curso.codigo }}</span>
                <span class="c-name">{{ curso.nombre }}</span>
              </div>
              <div class="c-stats">
                <span class="progress-txt">{{ getHorasAsignadas(curso._id) }}/{{ curso.horasTotal }}h</span>
              </div>
            </div>
            <div class="c-progress-bar">
              <div class="c-fill" :style="{ width: `${(getHorasAsignadas(curso._id) / curso.horasTotal) * 100}%` }"></div>
            </div>
            
            <div class="c-actions">
              <button class="btn-add-session" @click="abrirAsignacionParaCurso(curso)">
                {{ getAsignacionParaCurso(curso._id) ? 'Configurar Sesión' : '+ Asignar Docente' }}
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="total-progress">
            <label>Avance General del Bloque</label>
            <div class="p-bar-total">
              <div class="p-fill-total" :style="{ width: `${progresoGeneral}%` }"></div>
            </div>
            <span>{{ progresoGeneral }}% Completado</span>
          </div>
        </div>
      </aside>

      <!-- MAIN AREA: Master Calendar -->
      <main class="calendar-workspace glass-card">
        <div class="calendar-header">
          <div class="legend-premium">
            <div class="leg-item teor"><span class="box"></span> Teoría</div>
            <div class="leg-item tall"><span class="box"></span> Taller</div>
            <div class="leg-item labo"><span class="box"></span> Laboratorio</div>
          </div>
          <div class="header-actions">
             <button class="btn-refresh" @click="cargarAsignaciones">🔄 Sincronizar</button>
          </div>
        </div>

        <div class="calendar-overflow">
          <div class="calendar-grid-premium">
            <!-- Header Dias -->
            <div class="grid-time-label">Horas</div>
            <div v-for="dia in diasSemana" :key="dia" class="grid-day-header">{{ dia }}</div>

            <!-- Grid Content -->
            <template v-for="hora in horasGrid" :key="hora">
              <div class="time-label">{{ hora }}</div>
              <div v-for="dia in diasSemana" :key="dia" class="schedule-cell"
                   @click="manejarClickCelda(dia, hora)">
                <div v-if="obtenerSesion(dia, hora)" 
                     class="slot-premium" 
                     :class="obtenerSesion(dia, hora).tipo"
                     @click.stop="editarHorario(obtenerSesion(dia, hora).original)">
                  <div class="s-top">
                    <span class="s-course">{{ obtenerSesion(dia, hora).curso }}</span>
                    <button class="s-del" @click.stop="eliminarHorario(obtenerSesion(dia, hora).original._id)">×</button>
                  </div>
                  <div class="s-mid">
                    <span class="s-prof">{{ obtenerSesion(dia, hora).profesor }}</span>
                  </div>
                  <div class="s-bot">
                     <span class="s-room">📍 {{ obtenerSesion(dia, hora).aula }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </main>
    </div>

    <!-- Fallback -->
    <div v-else class="empty-workspace fadeIn">
      <div class="empty-content">
        <div class="empty-art">🗓️</div>
        <h2>Entorno de Programación</h2>
        <p>Selecciona un período y bloque para comenzar la orquestación de horarios.</p>
      </div>
    </div>

    <!-- Modales Rediseñados -->
    <Modal
      v-model="mostrarModalAsignacion"
      :titulo="asignacionActual ? 'Configurar Docente' : 'Vincular Docente a Curso'"
      size="medium"
      :loading="guardando"
      @guardar="guardarAsignacion"
    >
      <form @submit.prevent="guardarAsignacion" class="form-modal">
        <div class="selected-course-info">
          <span class="label">Curso Seleccionado:</span>
          <strong>{{ cursoSeleccionadoParaAsignar?.nombre }}</strong>
        </div>
        
        <div class="form-group">
          <label>Catedrático Especialista *</label>
          <select v-model="formularioAsignacion.profesor" class="form-input" required>
            <option value="">Seleccionar profesor...</option>
            <option v-for="p in profesores" :key="p._id" :value="p._id">
              {{ p.nombres }} {{ p.apellidos }} ({{ p.especialidad || 'General' }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Aula Predeterminada</label>
          <select v-model="formularioAsignacion.aula" class="form-input">
            <option value="">Asignar después...</option>
            <option v-for="a in aulas" :key="a._id" :value="a._id">
              {{ a.codigo }} - {{ a.nombre }} [{{ a.tipo }}]
            </option>
          </select>
        </div>
      </form>
    </Modal>

    <Modal
      v-model="mostrarModalHorario"
      :titulo="horarioEditando ? 'Reajustar Bloque Horario' : 'Definir Nueva Sesión'"
      :loading="guardando"
      @guardar="guardarHorario"
    >
      <form @submit.prevent="guardarHorario" class="form-modal">
        <div class="horario-context">
          <div class="context-item">
             <span class="l">Día</span>
             <span class="v">{{ formularioHorario.diaSemana }}</span>
          </div>
          <div class="context-item">
             <span class="l">Inicio</span>
             <span class="v">{{ formularioHorario.horaInicio }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Tipo de Sesion / Entorno</label>
          <select v-model="formularioHorario.tipoSesion" class="form-input" required>
            <option value="Teoría">Teoría (Aula Común)</option>
            <option value="Taller">Taller (Equipamiento)</option>
            <option value="Laboratorio">Laboratorio (Dual/Cómputo)</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Hora de Término *</label>
            <input v-model="formularioHorario.horaFin" type="time" class="form-input" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Cambiar Aula para esta sesión</label>
          <select v-model="formularioHorario.aulaOverride" class="form-input">
            <option :value="null">Usar aula predeterminada</option>
            <option v-for="a in aulas" :key="a._id" :value="a._id">
              {{ a.codigo }} - {{ a.nombre }} ({{ a.tipo }})
            </option>
          </select>
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
const asignacionActual = ref(null)
const horarioEditando = ref(null)
const cursoSeleccionadoParaAsignar = ref(null)

const formularioAsignacion = ref({ curso: '', profesor: '', aula: '', bloque: '' })
const formularioHorario = ref({ asignacion: '', diaSemana: '', horaInicio: '', horaFin: '', tipoSesion: 'Teoría', aulaOverride: null })

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horasGrid = ['07:45', '08:30', '09:15', '10:00', '10:45', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:30', '17:15', '18:00', '18:45', '19:30', '20:15', '21:00']

const bloquesFiltrados = computed(() => periodoSeleccionado.value ? bloques.value.filter(b => b.periodo?._id === periodoSeleccionado.value) : [])

const cursosDisponibles = computed(() => {
  if (!bloqueActual.value) return []
  const bcId = String(bloqueActual.value.carrera?._id || bloqueActual.value.carrera || '');
  const sem = String(bloqueActual.value.semestreAcademico || '').trim().toUpperCase();
  return cursos.value.filter(c => String(c.carrera?._id || c.carrera || '') === bcId && String(c.semestre || '').trim().toUpperCase() === sem);
})

const progresoGeneral = computed(() => {
  if (!cursosDisponibles.value.length) return 0
  const total = cursosDisponibles.value.reduce((s, c) => s + c.horasTotal, 0)
  const asig = cursosDisponibles.value.reduce((s, c) => s + getHorasAsignadas(c._id), 0)
  return Math.round((asig / total) * 100)
})

function getAsignacionParaCurso(cursoId) {
  return asignaciones.value.find(a => a.curso?._id === cursoId || a.curso === cursoId)
}

function getHorasAsignadas(cursoId) {
  const asig = getAsignacionParaCurso(cursoId)
  if (!asig || !asig.horarios) return 0
  return asig.horarios.reduce((sum, h) => {
    const [h1, m1] = h.horaInicio.split(':').map(Number)
    const [h2, m2] = h.horaFin.split(':').map(Number)
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
    return sum + Math.ceil(diff / 45) // Suponiendo horas pedagógicas de 45min
  }, 0)
}

function isCursoCompletado(cursoId) {
  const c = cursosDisponibles.value.find(x => x._id === cursoId)
  return c && getHorasAsignadas(cursoId) >= c.horasTotal
}

function obtenerSesion(dia, hora) {
  for (const asig of asignaciones.value) {
    const slot = asig.horarios?.find(h => h.diaSemana === dia && h.horaInicio === hora)
    if (slot) {
      return {
        curso: asig.curso?.codigo || 'CUR',
        profesor: `${asig.profesor?.apellidos || ''}`,
        aula: slot.aula?.codigo || asig.aula?.codigo || 'S/A',
        tipo: slot.tipoSesion?.toLowerCase() === 'laboratorio' ? 'labo' : (slot.tipoSesion?.toLowerCase() === 'taller' ? 'tall' : 'teor'),
        original: slot
      }
    }
  }
  return null
}

function manejarClickCelda(dia, hora) {
  const cur = cursoSeleccionadoParaAsignar.value
  if (!cur) return toast?.info('Selecciona un curso de la izquierda primero')
  const asig = getAsignacionParaCurso(cur._id)
  if (!asig) return toast?.info('Primero asigna un docente al curso')
  
  horarioEditando.value = null
  formularioHorario.value = {
    asignacion: asig._id,
    diaSemana: dia,
    horaInicio: hora,
    horaFin: calcularSiguienteHora(hora),
    tipoSesion: 'Teoría'
  }
  mostrarModalHorario.value = true
}

function calcularSiguienteHora(hora) {
  const idx = horasGrid.indexOf(hora)
  if (idx !== -1 && idx < horasGrid.length - 1) return horasGrid[idx + 1]
  const [h, m] = hora.split(':').map(Number)
  const dt = new Date(0,0,0, h, m + 45)
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

async function cargarPeriodos() {
  const res = await periodosService.getAll(); periodos.value = res.data.data
  const act = periodos.value.find(p => p.estado === 'activo')
  if (act) { periodoSeleccionado.value = act._id; cargarBloquesPorPeriodo() }
}

async function cargarBloquesPorPeriodo() {
  const res = await bloquesService.getAll({ periodo: periodoSeleccionado.value }); bloques.value = res.data.data
}

async function cargarInfoBloque() {
  loadingStart()
  const res = await bloquesService.getById(bloqueSeleccionado.value); bloqueActual.value = res.data.data
  if (bloqueActual.value) {
    const cRes = await cursosService.getAll({ carrera: bloqueActual.value.carrera?._id, semestre: bloqueActual.value.semestreAcademico, limit: 100 })
    cursos.value = cRes.data.data
  }
  await cargarAsignaciones(); loadingEnd()
}

async function cargarAsignaciones() {
  const res = await api.get(`/asignaciones?bloque=${bloqueSeleccionado.value}`); asignaciones.value = res.data.data
  for (let a of asignaciones.value) { const h = await api.get(`/horarios?asignacion=${a._id}`); a.horarios = h.data.data }
}

function abrirAsignacionParaCurso(curso) {
  cursoSeleccionadoParaAsignar.value = curso
  const asig = getAsignacionParaCurso(curso._id)
  if (asig) {
    asignacionActual.value = asig
    formularioAsignacion.value = { curso: curso._id, profesor: asig.profesor?._id, aula: asig.aula?._id, bloque: bloqueSeleccionado.value }
  } else {
    asignacionActual.value = null
    formularioAsignacion.value = { curso: curso._id, profesor: '', aula: '', bloque: bloqueSeleccionado.value }
  }
  mostrarModalAsignacion.value = true
}

async function guardarAsignacion() {
  try {
    guardando.value = true
    if (asignacionActual.value) await api.put(`/asignaciones/${asignacionActual.value._id}`, formularioAsignacion.value)
    else await api.post('/asignaciones', formularioAsignacion.value)
    await cargarAsignaciones(); mostrarModalAsignacion.value = false
  } catch (e) { toast?.error('Conflicto detectado') }
  finally { guardando.value = false }
}

async function guardarHorario() {
  try {
    guardando.value = true
    if (horarioEditando.value) await api.put(`/horarios/${horarioEditando.value._id}`, formularioHorario.value)
    else await api.post('/horarios', formularioHorario.value)
    await cargarAsignaciones(); mostrarModalHorario.value = false
  } catch (e) { toast?.error('Cruce de Horario Detectado', e.response?.data?.message) }
  finally { guardando.value = false }
}

async function eliminarHorario(id) {
  if (confirm('¿Retirar esta sesión?')) { await api.delete(`/horarios/${id}`); cargarAsignaciones() }
}

const professorsAndAulas = async () => {
  const [p, a] = await Promise.all([profesoresService.getAll(), aulasService.getAll()])
  profesores.value = p.data.data; aulas.value = a.data.data
}

const loadingStart = () => document.body.classList.add('loading')
const loadingEnd = () => document.body.classList.remove('loading')

onMounted(() => { cargarPeriodos(); professorsAndAulas() })
</script>

<style scoped>
.asignar-horarios-view { height: calc(100vh - 120px); display: flex; flex-direction: column; gap: 1.5rem; }

/* Header & Selectors */
.header-section { display: flex; flex-direction: column; gap: 1rem; }
.stepper-minimal { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 1.5rem; background: rgba(255,255,255,0.03); width: fit-content; border-radius: 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); }
.s-step.active { color: var(--accent); }

.selector-bar { padding: 1rem 2rem; display: flex; align-items: center; }
.selectors { display: flex; gap: 2rem; width: 100%; }
.sel-group { display: flex; flex-direction: column; gap: 0.25rem; }
.sel-group.main { flex: 1; }
.sel-group select { background: none; border: none; font-size: 1.1rem; font-weight: 900; color: var(--text-main); outline: none; padding: 0; cursor: pointer; }

/* Workspace */
.workspace-master { flex: 1; display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; overflow: hidden; }

/* Sidebar */
.academic-sidebar { display: flex; flex-direction: column; padding: 1.5rem; overflow: hidden; }
.sidebar-header { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
.sidebar-header h3 { font-size: 0.9rem; text-transform: uppercase; font-weight: 900; }
.block-badge { background: var(--accent); color: white; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 900; }

.course-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding-right: 0.5rem; }

.course-progress-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 1rem; padding: 1rem; transition: all 0.3s; cursor: pointer; }
.course-progress-card:hover, .course-progress-card.active { border-color: var(--accent); background: rgba(242, 101, 34, 0.05); }
.course-progress-card.completed { border-color: #10b981; opacity: 0.8; }

.c-info { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
.c-main { display: flex; flex-direction: column; }
.c-code { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }
.c-name { font-size: 0.9rem; font-weight: 700; }
.progress-txt { font-size: 0.75rem; font-weight: 900; color: var(--accent); }

.c-progress-bar { height: 6px; background: rgba(0,0,0,0.2); border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem; }
.c-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.5s; }
.completed .c-fill { background: #10b981; }

.btn-add-session { width: 100%; background: var(--bg-main); border: 1px solid var(--border); padding: 0.5rem; border-radius: 0.6rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; }

.sidebar-footer { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.total-progress label { font-size: 0.7rem; text-transform: uppercase; margin-bottom: 0.5rem; }
.p-bar-total { height: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; overflow: hidden; margin-bottom: 0.5rem; }
.p-fill-total { height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); }

/* Calendar Workspace */
.calendar-workspace { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.calendar-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.legend-premium { display: flex; gap: 1.5rem; font-size: 0.75rem; font-weight: 800; }
.legend-premium .box { width: 12px; height: 12px; border-radius: 3px; display: inline-block; margin-right: 0.5rem; }
.leg-item.teor .box { background: var(--primary); }
.leg-item.tall .box { background: #F26522; }
.leg-item.labo .box { background: #10B981; }

.calendar-overflow { flex: 1; overflow: auto; padding: 1.5rem; }
.calendar-grid-premium { display: grid; grid-template-columns: 80px repeat(6, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }

.grid-time-label, .grid-day-header { background: var(--bg-main); padding: 1rem 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }

.time-label { background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 900; }

.schedule-cell { background: var(--bg-card); min-height: 85px; padding: 0.25rem; transition: background 0.2s; cursor: cell; }
.schedule-cell:hover { background: rgba(242, 101, 34, 0.05); }

.slot-premium { height: 100%; border-radius: 0.75rem; padding: 0.6rem; display: flex; flex-direction: column; gap: 0.3rem; color: white; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: scale(0.9); } }

.slot-premium.teor { background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 4px 12px rgba(0, 66, 139, 0.3); }
.slot-premium.tall { background: linear-gradient(135deg, #F26522, #FF8E53); box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3); }
.slot-premium.labo { background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

.s-top { display: flex; justify-content: space-between; align-items: center; }
.s-course { font-size: 0.8rem; font-weight: 900; }
.s-del { background: none; border: none; color: white; font-size: 1rem; cursor: pointer; opacity: 0.7; }
.s-del:hover { opacity: 1; }
.s-prof { font-size: 0.65rem; font-weight: 700; opacity: 0.9; }
.s-room { font-size: 0.6rem; font-weight: 800; background: rgba(0,0,0,0.1); padding: 0.1rem 0.4rem; border-radius: 0.3rem; width: fit-content; }

/* Empty State */
.empty-workspace { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty-content { text-align: center; }
.empty-art { font-size: 5rem; margin-bottom: 2rem; opacity: 0.2; }

@media (max-width: 1200px) { .workspace-master { grid-template-columns: 1fr; } .academic-sidebar { display: none; } }
</style>
