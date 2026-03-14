<template>
  <div class="reportes-view fadeIn">
    <div class="page-header">
      <div class="title-area">
        <h1 class="text-gradient">Analítica Académica</h1>
        <p>Centro de mando y reportes estratégicos de horarios</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="exportarPDF" :disabled="loading || horariosFiltrados.length === 0">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generar Reporte PDF
        </button>
      </div>
    </div>

    <!-- Filtros Inteligentes (Glassmorphism) -->
    <div class="glass-card filters-panel">
      <div class="filters-grid">
        <div class="filter-group">
          <label>☀️ Turno Ciclo</label>
          <select v-model="filtros.turno" class="modern-select">
            <option value="">Cualquier Turno</option>
            <option v-for="t in turnos" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>🎓 Especialidad</label>
          <select v-model="filtros.carrera" class="modern-select">
            <option value="">Todas las Carreras</option>
            <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>📅 Nivel Semestral</label>
          <select v-model="filtros.semestre" class="modern-select">
            <option value="">Todos los niveles</option>
            <option v-for="sem in [1, 2, 3, 4, 5, 6]" :key="sem" :value="sem">
              Semestre {{ sem }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>👨‍🏫 Docente Titular</label>
          <select v-model="filtros.profesor" class="modern-select">
            <option value="">Todos los Docentes</option>
            <option v-for="prof in profesores" :key="prof._id" :value="prof._id">
              {{ prof.apellidos }}, {{ prof.nombres }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="filter-footer" v-if="filtrosActivosCount > 0">
        <div class="active-count">
          <span class="pulse-dot"></span>
          {{ filtrosActivosCount }} filtros aplicados
        </div>
        <button @click="limpiarFiltros" class="clear-btn">Limpiar todo ×</button>
      </div>
    </div>

    <!-- Módulo de KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon blue">🕒</div>
        <div class="kpi-data">
          <span class="value">{{ stats.totalHoras }}</span>
          <span class="label">Horas Lectivas</span>
        </div>
        <div class="kpi-trend positive">↑ Eficiencia</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon orange">📚</div>
        <div class="kpi-data">
          <span class="value">{{ stats.totalCursos }}</span>
          <span class="label">Módulos Activos</span>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon green">👨‍🏫</div>
        <div class="kpi-data">
          <span class="value">{{ stats.totalProfesores }}</span>
          <span class="label">Plantilla Docente</span>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon purple">🚪</div>
        <div class="kpi-data">
          <span class="value">{{ stats.totalAulas }}</span>
          <span class="label">Infraestructura</span>
        </div>
      </div>
    </div>

    <!-- Grilla de Resultados -->
    <div class="glass-card results-section">
      <div class="results-header">
        <h3>Detalle de Malla Horaria <span class="count-badge">{{ horariosFiltrados.length }}</span></h3>
      </div>
      
      <div v-if="loading" class="state-container">
        <div class="spinner-modern"></div>
        <p>Procesando datos académicos...</p>
      </div>
      
      <div v-else-if="horariosFiltrados.length === 0" class="state-container">
        <div class="empty-icon">🔍</div>
        <p>No se encontraron registros para los criterios establecidos.</p>
      </div>
      
      <div v-else class="modern-table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Temporización</th>
              <th>Cursos & Nivel</th>
              <th>Docente de Aula</th>
              <th>Espacio Físico</th>
              <th>Bloque/Id</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in horariosPaginados" :key="h._id">
              <td>
                <div class="time-block">
                  <span class="day">{{ h.diaSemana }}</span>
                  <span class="hours">{{ h.horaInicio }} - {{ h.horaFin }}</span>
                </div>
              </td>
              <td>
                <div class="course-cell">
                  <span class="name">{{ h.asignacion?.curso?.nombre || 'General' }}</span>
                  <span class="sem-tag">Nivel {{ h.asignacion?.bloque?.semestre }}</span>
                </div>
              </td>
              <td>
                <div class="prof-cell">
                  <span class="avatar">{{ h.asignacion?.profesor?.nombres?.charAt(0) }}</span>
                  <span>{{ h.asignacion?.profesor?.apellidos }}</span>
                </div>
              </td>
              <td>
                <span class="aula-pill" :class="h.aula?.tipo === 'Laboratorio' ? 'lab' : 'teo'">
                  {{ h.aula?.codigo || 'Virtual' }}
                </span>
              </td>
              <td>
                <span class="id-text">#{{ h.asignacion?.bloque?.codigo }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Paginación Premium -->
        <div class="premium-pagination" v-if="horariosFiltrados.length > itemsPerPage">
          <button class="nav-btn" :disabled="currentPage === 1" @click="currentPage--">
            ← Anterior
          </button>
          <div class="page-info">
            Página <strong>{{ currentPage }}</strong> de {{ totalPages }}
          </div>
          <button class="nav-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../services/api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Estado
const loading = ref(true)
const horarios = ref([])
const carreras = ref([])
const profesores = ref([])
const turnos = ['Mañana', 'Tarde', 'Noche']

const filtros = reactive({
  turno: '',
  carrera: '',
  semestre: '',
  profesor: ''
})

const currentPage = ref(1)
const itemsPerPage = 15 // Reducido para mejor scroll UX

onMounted(async () => {
  try {
    loading.value = true
    const [resHorarios, resCarreras, resProfesores] = await Promise.all([
      api.get('/horarios'),
      api.get('/carreras'),
      api.get('/profesores')
    ])
    horarios.value = resHorarios.data.data || resHorarios.data || []
    carreras.value = resCarreras.data.data || resCarreras.data || []
    profesores.value = resProfesores.data.data || resProfesores.data || []
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
})

const horariosFiltrados = computed(() => {
  return horarios.value.filter(h => {
    if (filtros.turno) {
       const hora = parseInt(h.horaInicio.split(':')[0]);
       let turnoDetectado = 'Mañana';
       if (hora >= 13 && hora < 18) turnoDetectado = 'Tarde';
       if (hora >= 18) turnoDetectado = 'Noche';
       const turnoBloque = h.asignacion?.bloque?.subPeriodo || h.asignacion?.bloque?.turno;
       const coincide = (turnoBloque && turnoBloque.toLowerCase().includes(filtros.turno.toLowerCase())) ||
                        (turnoDetectado.toLowerCase() === filtros.turno.toLowerCase());
       if (!coincide) return false;
    }
    if (filtros.carrera) {
      if (!h.asignacion?.bloque?.carrera) return false
      const carreraId = h.asignacion.bloque.carrera._id || h.asignacion.bloque.carrera
      if (carreraId?.toString() !== filtros.carrera) return false
    }
    if (filtros.semestre) {
      if (parseInt(h.asignacion?.bloque?.semestre) !== parseInt(filtros.semestre)) return false
    }
    if (filtros.profesor) {
      const profId = h.asignacion?.profesor?._id || h.asignacion?.profesor
      if (profId?.toString() !== filtros.profesor) return false
    }
    return true
  })
})

const stats = computed(() => {
  const data = horariosFiltrados.value
  let totalMinutos = 0
  const cursosUnicos = new Set()
  const profesoresUnicos = new Set()
  const aulasUnicas = new Set()
  
  data.forEach(h => {
    const [hI, mI] = h.horaInicio.split(':').map(Number)
    const [hF, mF] = h.horaFin.split(':').map(Number)
    totalMinutos += (hF * 60 + mF) - (hI * 60 + mI)
    if (h.asignacion?.curso?._id) cursosUnicos.add(h.asignacion.curso._id)
    if (h.asignacion?.profesor?._id) profesoresUnicos.add(h.asignacion.profesor._id)
    if (h.aula?._id) aulasUnicas.add(h.aula._id)
  })
  
  return {
    totalHoras: Math.round(totalMinutos / 45),
    totalCursos: cursosUnicos.size,
    totalProfesores: profesoresUnicos.size,
    totalAulas: aulasUnicas.size
  }
})

const totalPages = computed(() => Math.ceil(horariosFiltrados.value.length / itemsPerPage))
const horariosPaginados = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return horariosFiltrados.value.slice(start, start + itemsPerPage)
})

const filtrosActivosCount = computed(() => Object.values(filtros).filter(v => v).length)
const limpiarFiltros = () => { Object.keys(filtros).forEach(k => filtros[k] = '') }

const exportarPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(22); doc.setTextColor(0, 66, 139); doc.text('SENATI - Reporte Académico', 14, 20)
  doc.setFontSize(10); doc.setTextColor(100); doc.text(`Emisión: ${new Date().toLocaleString()}`, 14, 28)
  
  doc.autoTable({
    startY: 40,
    head: [['Día/Hora', 'Curso', 'Profesor', 'Aula', 'Bloque']],
    body: horariosFiltrados.value.map(h => [
      `${h.diaSemana}\n${h.horaInicio}-${h.horaFin}`,
      h.asignacion?.curso?.nombre || '-',
      `${h.asignacion?.profesor?.apellidos || ''}`,
      h.aula?.codigo || '-',
      h.asignacion?.bloque?.codigo || '-'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 66, 139] }
  })
  doc.save(`reporte_${Date.now()}.pdf`)
}
</script>

<style scoped>
.reportes-view {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
}

.title-area h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
.title-area p { color: var(--text-muted); font-size: 1.1rem; }

.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Filters Panel */
.filters-panel {
  padding: 2.5rem;
  margin-bottom: 3rem;
  border: 1px solid var(--glass-border);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 2rem;
}

.filter-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.modern-select {
  width: 100%;
  padding: 0.8rem 1.25rem;
  background: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-weight: 600;
  transition: all 0.2s;
}

.modern-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(242, 101, 34, 0.1); }

.filter-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border);
}

.active-count { font-weight: 700; display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
.pulse-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; animation: pulse-red 2s infinite; }
.clear-btn { background: none; border: none; color: var(--accent); font-weight: 800; cursor: pointer; }

@keyframes pulse-red { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.kpi-card {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid var(--border);
  position: relative;
  transition: transform 0.3s;
}

.kpi-card:hover { transform: translateY(-5px); border-color: var(--accent); }

.kpi-icon {
  width: 60px;
  height: 60px;
  background: rgba(0,0,0,0.05);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.kpi-data { display: flex; flex-direction: column; }
.kpi-data .value { font-size: 2rem; font-weight: 900; line-height: 1; }
.kpi-data .label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-top: 0.4rem; }

/* Table Section */
.results-section { padding: 2rem; overflow: hidden; }
.results-header { margin-bottom: 2rem; }
.count-badge { background: var(--accent); color: white; padding: 0.2rem 0.6rem; border-radius: 0.5rem; font-size: 0.8rem; vertical-align: middle; margin-left: 0.5rem; }

.modern-table-wrapper { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; min-width: 800px; }
.modern-table th { text-align: left; padding: 1.25rem; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
.modern-table td { padding: 1.25rem; border-bottom: 1px solid var(--border); }
.modern-table tr:hover { background: rgba(0,0,0,0.02); }

.time-block { display: flex; flex-direction: column; }
.time-block .day { font-weight: 800; color: var(--primary); }
.time-block .hours { font-size: 0.85rem; color: var(--text-muted); }

.course-cell .name { display: block; font-weight: 700; margin-bottom: 0.3rem; }
.sem-tag { font-size: 0.7rem; background: rgba(0,0,0,0.05); padding: 0.2rem 0.5rem; border-radius: 0.3rem; }

.prof-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
.prof-cell .avatar { width: 30px; height: 30px; background: var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }

.aula-pill { padding: 0.4rem 0.8rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 800; }
.aula-pill.lab { background: #fee2e2; color: #b91c1c; }
.aula-pill.teo { background: #e0f2fe; color: #0369a1; }

/* Pagination */
.premium-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
.nav-btn { background: var(--bg-card); border: 1px solid var(--border); padding: 0.6rem 1.2rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; }
.nav-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
}
</style>
