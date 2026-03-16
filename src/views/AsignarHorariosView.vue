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
                {{ b.codigo }} - {{ b.carrera?.nombre }} (Sem. {{ formatRoman(b.semestreAcademico) }})
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
               :class="{ 
                 completed: isCursoCompletado(curso._id),
                 active: cursoSeleccionadoParaAsignar?._id === curso._id
               }"
               @click="seleccionarCursoParaPlanificar(curso)">
            <div class="c-info">
              <div class="c-main">
                <span class="c-code">{{ curso.codigo }}</span>
                <span class="c-name">{{ curso.nombre }}</span>
              </div>
              <div class="c-actions-mini">
                <button 
                  class="btn-magic-mini" 
                  title="Auto-completar este curso con IA"
                  @click.stop="autoLlenarCurso(curso)"
                  :disabled="isCursoCompletado(curso._id) || guardando"
                >
                  🪄
                </button>
                <span class="progress-txt">{{ getHorasAsignadas(curso._id) }}/{{ curso.horasTotal }}h</span>
              </div>
            </div>
            <div class="c-progress-bar">
              <div class="c-fill" :style="{ width: `${(getHorasAsignadas(curso._id) / curso.horasTotal) * 100}%` }"></div>
            </div>
            
            <div class="c-actions">
              <button class="btn-add-session" @click.stop="abrirAsignacionParaCurso(curso)">
                {{ getAsignacionParaCurso(curso._id) ? 'Cambiar Especialista' : '+ Vincular Docente' }}
              </button>
            </div>
          </div>
        </div>

        <!-- AI Suggestions Panel -->
        <div v-if="cursoSeleccionadoParaAsignar" class="ai-suggestions-panel fadeIn">
           <div class="panel-header">
             <span class="ai-spark">✨</span>
             <h4>Sugerencias de la IA</h4>
           </div>
           <p class="panel-desc">
             Disponibilidad para: 
             <strong>{{ getAsignacionParaCurso(cursoSeleccionadoParaAsignar._id)?.profesor ? `${getAsignacionParaCurso(cursoSeleccionadoParaAsignar._id).profesor.nombres}` : 'Sin docente' }}</strong>
           </p>
           
           <div v-if="cargandoSugerencias" class="slots-loading">
              <div class="spinner-small"></div>
              <span>Consultando IA...</span>
           </div>
           <div v-else class="slots-list">
              <div v-for="slot in sugerenciasIA" :key="slot.dia + slot.hora" class="suggestion-tag" @click="aplicarSugerenciaIA(slot)">
                {{ slot.dia }} {{ slot.hora }} <span>+</span>
              </div>
              <div v-if="sugerenciasIA.length === 0" class="no-slots">
                No se hallaron bloques contiguos libres
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
            <div v-if="conflictosBloque.length > 0" class="conflict-status-badge" @click="mostrarPanelConflictos = !mostrarPanelConflictos">
              ⚠️ {{ conflictosBloque.length }} Conflictos
            </div>
            <button class="btn-automation magic" @click="autoAsignarBloqueActual" :disabled="guardando">
              <span class="ai-spark">✨</span> 
              {{ guardando ? 'IA Pensando...' : 'Auto-Asignar Bloque' }}
            </button>
            <button class="btn-automation secondary" @click="mostrarModalClonar = true">
              📋 Clonar de NRC
            </button>
          </div>
        </div>
        
        <!-- Panel de Conflictos Proactivo -->
        <div v-if="mostrarPanelConflictos && conflictosBloque.length > 0" class="conflict-panel-overlay fadeIn">
           <div class="panel-header">
             <h4>⚠️ Conflictos de Programación</h4>
             <button class="btn-close-mini" @click="mostrarPanelConflictos = false">✕</button>
           </div>
           <ul class="conflict-list">
             <li v-for="(c, i) in conflictosBloque" :key="i">
               <strong>{{ c.dia }} {{ c.hora }}</strong>: {{ c.mensaje }}
             </li>
           </ul>
           <button class="btn-resolve-ia" @click="resolverConflictosBloqueIA">
             🤖 Resolver con IA
           </button>
        </div>

        <div class="calendar-overflow">
          <div class="calendar-grid-premium">
            <!-- Header Dias -->
            <div class="grid-time-label">Horas</div>
            <div v-for="dia in diasSemana" :key="dia" class="grid-day-header">{{ dia }}</div>

            <!-- Grid Content -->
            <template v-for="hora in horasGrid" :key="hora">
              <div class="time-label">{{ formatTime(hora) }}</div>
              <div 
                  v-for="dia in diasSemana" 
                  :key="dia" 
                  class="schedule-cell"
                  :class="{ 
                    'drag-over': celdaDragOver === `${dia}-${hora}`,
                    'is-suggested': sugerenciasIA.some(s => s.dia === dia && s.hora === hora),
                    'is-busy-prof': esHoraOcupadaProfesor(dia, hora)
                  }"
                  @dragover.prevent="manejarDragOver(dia, hora)"
                  @drop="manejarDrop(dia, hora)"
                  @click="manejarClickCelda(dia, hora)"
                >
                  <!-- Busy UI for Professor -->
                  <div v-if="esHoraOcupadaProfesor(dia, hora)" class="busy-indicator">
                    <span>Ocupado</span>
                  </div>
                  
                  <!-- Existing Slot -->
                  <div 
                    v-if="obtenerSesion(dia, hora)" 
                    class="slot-premium"
                    :class="[obtenerSesion(dia, hora).tipo, { 'is-continuation': !obtenerSesion(dia, hora).isStart }]"
                    draggable="true"
                    @dragstart="manejarDragStart(obtenerSesion(dia, hora).original)"
                    @click.stop="editarHorario(obtenerSesion(dia, hora).original)">
                    <template v-if="obtenerSesion(dia, hora).isStart">
                      <div class="s-top">
                        <span class="s-time">{{ formatTime(obtenerSesion(dia, hora).original.horaInicio) }} - {{ formatTime(obtenerSesion(dia, hora).original.horaFin) }}</span>
                        <button class="s-del" @click.stop="eliminarHorario(obtenerSesion(dia, hora).original._id)">×</button>
                      </div>
                      <div class="s-mid">
                        <div class="s-course">{{ obtenerSesion(dia, hora).curso }}</div>
                      </div>
                      <div class="s-bot">
                        <div class="s-prof">{{ obtenerSesion(dia, hora).profesor }}</div>
                        <div class="s-room">🏛️ {{ obtenerSesion(dia, hora).aula }}</div>
                      </div>
                    </template>
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
             <span class="l">Curso</span>
             <span class="v">{{ cursoSeleccionadoParaAsignar?.nombre }}</span>
          </div>
          <div class="context-item" v-if="formularioHorario.aulaOverride || asignacionActual?.aula">
             <span class="l">Edificio/Sede</span>
             <span class="v">{{ getEdificioActual() }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Día de la Semana</label>
            <select v-model="formularioHorario.diaSemana" class="form-input">
              <option v-for="d in diasSemana" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Hora de Inicio *</label>
            <input v-model="formularioHorario.horaInicio" type="time" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Hora de Término *</label>
            <input v-model="formularioHorario.horaFin" type="time" class="form-input" required>
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

    <!-- Modal para Clonar -->
    <Modal
      v-model="mostrarModalClonar"
      titulo="Clonar Programación de otro Bloque"
      :loading="guardando"
      @guardar="clonarDeBloque"
    >
      <div class="form-modal">
        <p class="modal-intro">Esta acción copiará todas las asignaciones de docentes y horarios del bloque origen al bloque actual <strong>{{ bloqueActual?.codigo }}</strong>.</p>
        
        <div class="form-group">
          <label>Seleccionar Bloque de Origen</label>
          <select v-model="bloqueOrigenId" class="form-input">
            <option value="">Seleccionar bloque...</option>
            <option v-for="b in bloquesParaClonar" :key="b._id" :value="b._id">
              {{ b.codigo }} - {{ b.carrera?.nombre }} (Sem. {{ formatRoman(b.semestreAcademico) }})
            </option>
          </select>
        </div>

        <div class="alert warning">
          ⚠️ Los horarios que ya existen no serán duplicados, pero se añadirán los nuevos.
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
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
const mostrarModalClonar = ref(false)
const bloqueOrigenId = ref('')
const profesorBusySlots = ref([]) 
const celdaDragOver = ref(null)
const slotSiendoArrastrado = ref(null)
const cargandoSugerencias = ref(false)
const mostrarPanelConflictos = ref(false)

const formularioAsignacion = ref({ curso: '', profesor: '', aula: '', bloque: '' })
const formularioHorario = ref({ asignacion: '', diaSemana: '', horaInicio: '', horaFin: '', tipoSesion: 'Teoría', aulaOverride: null })

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horasGrid = ['07:45', '08:30', '09:15', '10:00', '10:45', '11:45', '12:30', '13:15', '14:00', '14:45', '15:30', '16:30', '17:15', '18:00', '18:45', '19:30', '20:15', '21:00']

const bloquesFiltrados = computed(() => periodoSeleccionado.value ? bloques.value.filter(b => b.periodo?._id === periodoSeleccionado.value) : [])
const bloquesParaClonar = computed(() => bloquesFiltrados.value.filter(b => b._id !== bloqueSeleccionado.value))

const cursosDisponibles = computed(() => {
  if (!bloqueActual.value || !Array.isArray(cursos.value)) return []
  const bcId = String(bloqueActual.value.carrera?._id || bloqueActual.value.carrera || '');
  const sem = String(bloqueActual.value.semestreAcademico || '').trim().toUpperCase();
  return cursos.value.filter(c => {
    const courseCarreraId = String(c.carrera?._id || c.carrera || '');
    const courseSem = String(c.semestre || '').trim().toUpperCase();
    return courseCarreraId === bcId && courseSem === sem;
  });
})

const progresoGeneral = computed(() => {
  if (!cursosDisponibles.value || !cursosDisponibles.value.length) return 0
  const total = cursosDisponibles.value.reduce((s, c) => s + (c.horasTotal || 0), 0)
  if (total === 0) return 0
  const asig = cursosDisponibles.value.reduce((s, c) => s + getHorasAsignadas(c._id), 0)
  return Math.round((asig / total) * 100)
})

function formatRoman(sem) {
  if (!sem) return ''
  const s = String(sem).toUpperCase().trim()
  const map = {
    '1': 'I', 'I': 'I', 'PRIMERO': 'I',
    '2': 'II', 'II': 'II', 'SEGUNDO': 'II',
    '3': 'III', 'III': 'III', 'TERCERO': 'III',
    '4': 'IV', 'IV': 'IV', 'IIII': 'IV', 'CUARTO': 'IV',
    '5': 'V', 'V': 'V', 'IIIII': 'V', 'QUINTO': 'V',
    '6': 'VI', 'VI': 'VI', 'IIIIII': 'VI', 'SEXTO': 'VI'
  }
  return map[s] || s
}
function formatTime(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

function getAsignacionParaCurso(cursoId) {
  return asignaciones.value.find(a => a.curso?._id === cursoId || a.curso === cursoId)
}

function getEdificioActual() {
  const aulaId = formularioHorario.value.aulaOverride || asignacionActual.value?.aula?._id || asignacionActual.value?.aula
  const found = aulas.value.find(a => a._id === aulaId)
  return found?.edificio || 'Sede Principal'
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

function getPreviaHora(hora) {
  const idx = horasGrid.indexOf(hora)
  return idx > 0 ? horasGrid[idx - 1] : null
}

function obtenerSesion(dia, hora) {
  const [hGrid, mGrid] = hora.split(':').map(Number)
  const minutosGrid = hGrid * 60 + mGrid

  for (const asig of asignaciones.value) {
    if (!asig.horarios) continue
    
    // Buscar si alguna sesión cubre este minuto del grid
    const slot = asig.horarios.find(h => {
      if (h.diaSemana !== dia) return false
      
      const [hStart, mStart] = h.horaInicio.split(':').map(Number)
      const [hEnd, mEnd] = h.horaFin.split(':').map(Number)
      const minStart = hStart * 60 + mStart
      const minEnd = hEnd * 60 + mEnd
      
      return minutosGrid >= minStart && minutosGrid < minEnd
    })

    if (slot) {
      // Determinamos si es el inicio visual: si NO hay sesión en la hora anterior del grid
      const prevHora = getPreviaHora(hora)
      let esContinuacion = false
      if (prevHora) {
        const [hp, mp] = prevHora.split(':').map(Number)
        const minP = hp * 60 + mp
        esContinuacion = asig.horarios.some(h => {
          if (h.diaSemana !== dia) return false
          const [hS, mS] = h.horaInicio.split(':').map(Number)
          const [hE, mE] = h.horaFin.split(':').map(Number)
          return minP >= hS * 60 + mS && minP < hE * 60 + mE
        })
      }

      const building = slot.aula?.edificio || asig.aula?.edificio || ''
      const buildingPrefix = building ? `${building} - ` : ''

      return {
        id: slot._id,
        curso: asig.curso?.nombre?.substring(0, 35) || 'CURSO',
        profesor: asig.profesor ? `${asig.profesor.apellidos}, ${asig.profesor.nombres}` : 'Docente no asignado',
        aula: `${buildingPrefix}${slot.aula?.codigo || asig.aula?.codigo || 'S/A'}`,
        tipo: slot.tipoSesion?.toLowerCase() === 'laboratorio' ? 'labo' : (slot.tipoSesion?.toLowerCase() === 'taller' ? 'tall' : 'teor'),
        isStart: !esContinuacion, 
        original: slot
      }
    }
  }
  return null
}

function manejarClickCelda(dia, hora) {
  if (esHoraOcupadaProfesor(dia, hora)) {
    return toast?.warning('Conflicto detectado', 'El profesor ya tiene clases en este horario en otro bloque.')
  }
  
  const cur = cursoSeleccionadoParaAsignar.value
  if (!cur) return toast?.info('Selecciona un curso de la izquierda primero')
  const asig = getAsignacionParaCurso(cur._id)
  if (!asig) return toast?.info('Primero vincula un docente al curso')
  
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

const sugerenciasIA = computed(() => {
  if (!cursoSeleccionadoParaAsignar.value || !Array.isArray(asignaciones.value)) return []
  const freeSlots = []
  const currentBlockSchedules = asignaciones.value.flatMap(a => a.horarios || [])
  
  for (const dia of diasSemana) {
    if (freeSlots.length >= 3) break
    for (const hora of horasGrid) {
      if (freeSlots.length >= 3) break
      
      // Validar si el profesor está libre y si el bloque en sí está libre en esa celda
      const busyProf = esHoraOcupadaProfesor(dia, hora)
      const busyBlock = currentBlockSchedules.some(h => h.diaSemana === dia && h.horaInicio === hora)
      
      if (!busyProf && !busyBlock) {
        freeSlots.push({ dia, hora })
      }
    }
  }
  return freeSlots
})

async function aplicarSugerenciaIA(slot) {
  const asig = getAsignacionParaCurso(cursoSeleccionadoParaAsignar.value._id)
  if (!asig) return
  
  try {
    guardando.value = true
    await api.post('/horarios', {
      asignacion: asig._id,
      diaSemana: slot.dia,
      horaInicio: slot.hora,
      horaFin: calcularSiguienteHora(slot.hora),
      tipoSesion: 'Teoría'
    })
    toast?.success('Sugerencia aplicada', `${asig.curso.nombre} asignado a ${slot.dia} ${slot.hora}`)
    await cargarAsignaciones()
  } catch (e) {
    toast?.error('Cruce detectado', 'Ese slot ya no está disponible.')
  } finally {
    guardando.value = false
  }
}

async function seleccionarCursoParaPlanificar(curso) {
  cursoSeleccionadoParaAsignar.value = curso
  const asig = getAsignacionParaCurso(curso._id)
  if (asig && asig.profesor) {
    cargandoSugerencias.value = true
    await cargarDisponibilidadProfesor(asig.profesor._id)
    cargandoSugerencias.value = false
  } else {
    profesorBusySlots.value = []
  }
}

async function autoLlenarCurso(curso) {
  const asig = getAsignacionParaCurso(curso._id)
  if (!asig) {
    return toast?.info('Vincula un docente primero', 'La IA necesita saber quién dicta el curso.')
  }
  
  try {
    guardando.value = true
    toast?.info('IA Trabajando', `Buscando los mejores horarios para ${curso.nombre}...`)
    
    // Usar las sugerencias de la IA recursivamente hasta llenar las horas
    let horasRestantes = curso.horasTotal - getHorasAsignadas(curso._id)
    let slotsEncontrados = 0
    
    // Intentamos asignar hasta llenar
    while (horasRestantes > 0 && slotsEncontrados < 10) {
      // Forzar recalculado de sugerencias
      const slots = sugerenciasIA.value
      if (slots.length === 0) break
      
      const slot = slots[0]
      await api.post('/horarios', {
        asignacion: asig._id,
        diaSemana: slot.dia,
        horaInicio: slot.hora,
        horaFin: calcularSiguienteHora(slot.hora),
        tipoSesion: 'Teoría'
      })
      
      await cargarAsignaciones()
      horasRestantes = curso.horasTotal - getHorasAsignadas(curso._id)
      slotsEncontrados++
    }
    
    if (slotsEncontrados > 0) {
      toast?.success('Curso optimizado', `Se han asignado ${slotsEncontrados} sesiones automáticamente.`)
    } else {
      toast?.warning('Sin espacios', 'No encontré espacios libres para este docente.')
    }
  } catch (e) {
    toast?.error('Límite alcanzado', 'No se pudieron asignar más horas sin conflictos.')
  } finally {
    guardando.value = false
  }
}

const conflictosBloque = computed(() => {
  if (!asignaciones.value) return []
  const list = []
  const allSchedules = asignaciones.value.flatMap(a => (a.horarios || []).map(h => ({...h, asig: a})))
  
  // 1. Conflictos de Aula
  const celdasAula = {}
  allSchedules.forEach(h => {
    const key = `${h.aula?._id || 'na'}-${h.diaSemana}-${h.horaInicio}`
    if (celdasAula[key]) {
      list.push({ dia: h.diaSemana, hora: h.horaInicio, mensaje: `Aula ${h.aula?.codigo} ocupada por dos cursos.` })
    }
    celdasAula[key] = true
  })
  
  // 2. Conflictos de Profesor (está en el backend pero lo mostramos proactivo aquí)
  allSchedules.forEach(h => {
    if (esHoraOcupadaProfesor(h.diaSemana, h.horaInicio)) {
      list.push({ dia: h.diaSemana, hora: h.horaInicio, mensaje: `El docente ${h.asig.profesor?.apellidos} ya tiene clases en otro bloque.` })
    }
  })
  
  return [...new Set(list.map(JSON.stringify))].map(JSON.parse) // Unique
})

async function resolverConflictosBloqueIA() {
  toast?.info('Sify IA', 'Reubicando sesiones con conflicto...')
  // Lógica de resolución...
  await autoAsignarBloqueActual()
}

async function cargarDisponibilidadProfesor(profId) {
  try {
    const res = await api.get(`/horarios?profesor=${profId}`)
    // Filtrar para obtener solo horarios que NO pertenezcan al bloque actual
    profesorBusySlots.value = res.data.data.filter(h => h.asignacion?.bloque !== bloqueSeleccionado.value)
  } catch (e) {
    console.error('Error cargando disponibilidad del profesor:', e)
  }
}

function esHoraOcupadaProfesor(dia, hora) {
  return profesorBusySlots.value.some(h => h.diaSemana === dia && h.horaInicio === hora)
}

// DRAG & DROP LOGIC
function manejarDragStart(slot) {
  slotSiendoArrastrado.value = slot
}

function manejarDragOver(dia, hora) {
  celdaDragOver.value = `${dia}-${hora}`
}

async function manejarDrop(dia, hora) {
  const slot = slotSiendoArrastrado.value
  celdaDragOver.value = null
  if (!slot) return

  if (esHoraOcupadaProfesor(dia, hora)) {
    return toast?.error('Conflicto', 'El docente tiene otra clase en ese horario.')
  }

  try {
    guardando.value = true
    const duration = calcularDuracion(slot.horaInicio, slot.horaFin)
    const nuevaHoraFin = sumarMinutos(hora, duration)
    
    await api.put(`/horarios/${slot._id}`, {
      ...slot,
      diaSemana: dia,
      horaInicio: hora,
      horaFin: nuevaHoraFin
    })
    
    toast?.success('Horario actualizado', `Clase movida a ${dia} ${hora}`)
    await cargarAsignaciones()
  } catch (e) {
    toast?.error('Error al mover', e.response?.data?.message || 'Cruce detectado')
  } finally {
    guardando.value = false
    slotSiendoArrastrado.value = null
  }
}

function calcularDuracion(inicio, fin) {
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

function sumarMinutos(hora, minutos) {
  const [h, m] = hora.split(':').map(Number)
  const dt = new Date(0, 0, 0, h, m + minutos)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function calcularSiguienteHora(hora) {
  const idx = horasGrid.indexOf(hora)
  if (idx !== -1 && idx < horasGrid.length - 1) return horasGrid[idx + 1]
  const [h, m] = hora.split(':').map(Number)
  const dt = new Date(0,0,0, h, m + 45)
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

function editarHorario(horario) {
  horarioEditando.value = horario
  formularioHorario.value = {
    asignacion: horario.asignacion?._id || horario.asignacion,
    diaSemana: horario.diaSemana,
    horaInicio: horario.horaInicio,
    horaFin: horario.horaFin,
    tipoSesion: horario.tipoSesion,
    aulaOverride: horario.aula?._id || horario.aula
  }
  mostrarModalHorario.value = true
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
  if (!bloqueSeleccionado.value) {
    bloqueActual.value = null
    asignaciones.value = []
    cursos.value = []
    return
  }
  loadingStart()
  try {
    const res = await bloquesService.getById(bloqueSeleccionado.value); bloqueActual.value = res.data.data
    if (bloqueActual.value) {
      const cRes = await cursosService.getAll({ 
        carrera: bloqueActual.value.carrera?._id, 
        semestre: bloqueActual.value.semestreAcademico, 
        limit: 100 
      })
      cursos.value = Array.isArray(cRes.data.data) ? cRes.data.data : []
    }
    await cargarAsignaciones()
  } catch (err) {
    toast?.error('Error', 'No se pudo cargar la información del bloque')
  } finally {
    loadingEnd()
  }
}

async function cargarAsignaciones() {
  try {
    const res = await api.get(`/asignaciones?bloque=${bloqueSeleccionado.value}`)
    const data = res.data.data
    if (!Array.isArray(data)) {
      asignaciones.value = []
      return
    }
    
    // Cargar horarios para cada asignación de forma concurrente
    const asignacionesConHorarios = await Promise.all(data.map(async (a) => {
      try {
        const hRes = await api.get(`/horarios?asignacion=${a._id}`)
        return { ...a, horarios: hRes.data.data || [] }
      } catch (err) {
        return { ...a, horarios: [] }
      }
    }))
    
    asignaciones.value = asignacionesConHorarios
  } catch (error) {
    console.error('Error al cargar asignaciones:', error)
    asignaciones.value = []
  }
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

async function autoAsignarBloqueActual() {
  if (!bloqueSeleccionado.value) return
  if (!confirm('La IA completará los espacios vacíos del bloque. ¿Deseas continuar?')) return
  
  try {
    guardando.value = true
    toast?.info('Iniciando IA', 'Calculando mejores horarios y docentes...')
    const res = await api.post('/upload/bloques/asignar-automatico', {
      bloquesIds: [bloqueSeleccionado.value]
    })
    
    if (res.data.success) {
      toast?.success('¡Proceso Completado!', res.data.message)
      await cargarAsignaciones()
    }
  } catch (e) {
    toast?.error('Error en Automatización', e.response?.data?.message || 'Error desconocido')
  } finally {
    guardando.value = false
  }
}

async function clonarDeBloque() {
  if (!bloqueOrigenId.value) return toast?.warning('Selección requerida', 'Debes elegir un bloque de origen')
  
  try {
    guardando.value = true
    toast?.info('Sincronizando...', 'Copiando estructura académica...')
    
    const res = await api.post(`/bloques/${bloqueSeleccionado.value}/clonar`, {
      fromBloqueId: bloqueOrigenId.value
    })
    
    if (res.data.success) {
      toast?.success('¡Clonación Exitosa!', 'Se han replicado los horarios y docentes.')
      await cargarAsignaciones()
      mostrarModalClonar.value = false
      bloqueOrigenId.value = ''
    }
  } catch (e) {
    toast?.error('Fallo en Clonación', e.response?.data?.message || 'Error del servidor')
  } finally {
    guardando.value = false
  }
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

.c-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.c-main { display: flex; flex-direction: column; flex: 1; }
.c-code { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }
.c-name { font-size: 0.9rem; font-weight: 700; line-height: 1.2; }
.c-actions-mini { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }

.btn-magic-mini {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 0;
  line-height: 1;
}
.btn-magic-mini:hover:not(:disabled) {
  transform: scale(1.3) rotate(15deg);
  filter: drop-shadow(0 0 5px var(--accent));
}
.btn-magic-mini:disabled { opacity: 0.2; cursor: not-allowed; }

.progress-txt { font-size: 0.7rem; font-weight: 900; color: var(--accent); white-space: nowrap; }

.c-progress-bar { height: 6px; background: rgba(0,0,0,0.2); border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem; }
.c-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.5s; }
.completed .c-fill { background: #10b981; }

.btn-add-session { width: 100%; background: var(--bg-main); border: 1px solid var(--border); padding: 0.5rem; border-radius: 0.6rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; }

.sidebar-footer { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.total-progress label { font-size: 0.7rem; text-transform: uppercase; margin-bottom: 0.5rem; }
.p-bar-total { height: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; overflow: hidden; margin-bottom: 0.5rem; }
.p-fill-total { height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); }

/* AI Suggestions */
.ai-suggestions-panel {
  margin: 1rem;
  padding: 1rem;
  background: rgba(242, 101, 34, 0.05);
  border: 1px solid rgba(242, 101, 34, 0.2);
  border-radius: 1rem;
}

.panel-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.ai-spark { font-size: 1.2rem; }
.panel-header h4 { font-size: 0.85rem; font-weight: 800; color: var(--accent); margin: 0; }
.panel-desc { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.75rem; }

.slots-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.suggestion-tag {
  background: white;
  border: 1px solid var(--border);
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(242, 101, 34, 0.1);
}

.no-slots { font-size: 0.7rem; font-style: italic; color: var(--text-muted); }

.slots-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(242, 101, 34, 0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Calendar Workspace */
.calendar-workspace { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.calendar-header { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.02); position: relative; }
.header-actions { display: flex; gap: 0.75rem; align-items: center; }

.conflict-status-badge {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fee2e2;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.conflict-panel-overlay {
  position: absolute;
  top: 70px;
  right: 1.5rem;
  width: 320px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  z-index: 100;
  padding: 1.25rem;
}

.conflict-panel-overlay .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0;
  background: none;
  border: none;
}

.conflict-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem 0;
  max-height: 200px;
  overflow-y: auto;
}

.conflict-list li {
  font-size: 0.75rem;
  padding: 0.6rem;
  border-bottom: 1px solid var(--border);
  color: #3f3f46;
}

.btn-close-mini { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--text-muted); }

.btn-resolve-ia {
  width: 100%;
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-automation {
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-automation.magic {
  background: linear-gradient(135deg, var(--primary), #6366f1);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-automation.magic:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.btn-automation.secondary {
  background: var(--bg-main);
  color: var(--text-main);
}

.legend-premium { display: flex; gap: 1.5rem; font-size: 0.75rem; font-weight: 800; }
.legend-premium .box { width: 12px; height: 12px; border-radius: 3px; display: inline-block; margin-right: 0.5rem; }
.leg-item.teor .box { background: var(--primary); }
.leg-item.tall .box { background: #F26522; }
.leg-item.labo .box { background: #10B981; }

.calendar-overflow { flex: 1; overflow: auto; padding: 1.5rem; }
.calendar-grid-premium { display: grid; grid-template-columns: 80px repeat(6, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }

.grid-time-label, .grid-day-header { background: var(--bg-main); padding: 1rem 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }

.time-label { background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 900; }
.schedule-cell { background: var(--bg-card); min-height: 85px; padding: 0.25rem; transition: background 0.2s; cursor: cell; position: relative; }
.schedule-cell:hover { background: rgba(242, 101, 34, 0.05); }
.schedule-cell.is-busy { background: rgba(0, 0, 0, 0.1); cursor: not-allowed; }
.schedule-cell.drag-over { background: var(--accent-glow); border: 2px dashed var(--accent); }

.schedule-cell.is-suggested {
  border: 1px dashed var(--accent);
  background: rgba(242, 101, 34, 0.08);
  box-shadow: inset 0 0 15px rgba(242, 101, 34, 0.1);
  animation: glow-suggested 2s infinite ease-in-out;
}

@keyframes glow-suggested {
  0%, 100% { background: rgba(242, 101, 34, 0.12); }
  50% { background: rgba(242, 101, 34, 0.05); }
}

.busy-indicator {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(1px) grayscale(1);
  color: #666;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  z-index: 1;
  pointer-events: none;
}

.slot-premium { height: 100%; border-radius: 0.75rem; padding: 0.6rem; display: flex; flex-direction: column; gap: 0.3rem; color: white; animation: slideIn 0.3s ease-out; position: relative; z-index: 2; transition: transform 0.2s, box-shadow 0.2s; }
.slot-premium:hover { transform: scale(1.02); cursor: grab; }
.slot-premium:active { cursor: grabbing; }

@keyframes slideIn { from { opacity: 0; transform: scale(0.9); } }

.slot-premium.teor { background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 4px 12px rgba(0, 66, 139, 0.3); }
.slot-premium.tall { background: linear-gradient(135deg, #F26522, #FF8E53); box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3); }
.slot-premium.labo { background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

.s-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem; }
.s-time { font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.85); font-style: italic; }
.s-course { font-size: 0.85rem; font-weight: 900; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0.3rem; }
.s-del { background: none; border: none; color: white; font-size: 1rem; cursor: pointer; opacity: 0.7; }
.s-del:hover { opacity: 1; }
.s-bot { margin-top: auto; display: flex; flex-direction: column; gap: 0.2rem; }
.s-prof { font-size: 0.65rem; font-weight: 700; opacity: 0.9; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.s-room { font-size: 0.65rem; font-weight: 800; background: rgba(0,0,0,0.15); padding: 0.2rem 0.5rem; border-radius: 0.4rem; white-space: nowrap; width: fit-content; }

/* Modal Design Fixes */
.horario-context { display: flex; flex-direction: column; gap: 1rem; background: rgba(242, 101, 34, 0.05); padding: 1.2rem; border-radius: 1rem; margin-bottom: 2rem; border-left: 4px solid var(--accent); }
.context-item { display: flex; flex-direction: column; gap: 0.3rem; }
.context-item .l { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--accent); letter-spacing: 0.05em; }
.context-item .v { font-size: 1.1rem; font-weight: 800; color: var(--text-main); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; }

@media (max-width: 1200px) { .workspace-master { grid-template-columns: 1fr; } .academic-sidebar { display: none; } }
</style>
