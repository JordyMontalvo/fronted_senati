<template>
  <div class="cursos-view fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">📚 Malla Curricular</h1>
        <p>Catálogo nacional de programas y unidades académicas</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nuevo Curso</span>
      </button>
    </div>

    <!-- Filtros Inteligentes -->
    <div class="glass-card filters-card">
      <div class="filtros-grid">
        <div class="select-group">
          <select v-model="carreraFiltro" class="modern-select">
            <option value="">Todas las Carreras</option>
            <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
              {{ carrera.codigo }} - {{ carrera.nombre }}
            </option>
          </select>
        </div>
        <div class="select-group">
          <select v-model="semestreFiltro" class="modern-select">
            <option value="">Todos los Ciclos</option>
            <option v-for="sem in semestres" :key="sem" :value="sem">{{ sem }}</option>
          </select>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="busqueda" 
            type="text" 
            placeholder="Buscar por nombre o código..."
            class="search-input"
          >
        </div>
      </div>
    </div>

    <!-- Estadísticas Rápidas -->
    <div class="stats-grid">
      <div class="stat-glass-card">
        <span class="stat-val">{{ cursosFiltrados.length }}</span>
        <span class="stat-lab">Unidades Encontradas</span>
      </div>
      <div class="stat-glass-card">
        <span class="stat-val">{{ creditosTotales }}</span>
        <span class="stat-lab">Créditos Totales</span>
      </div>
      <div class="stat-glass-card">
        <span class="stat-val">{{ horasTotales }}</span>
        <span class="stat-lab">Horas Lectivas</span>
      </div>
    </div>

    <!-- Listado de Cursos (Tabla Premium) -->
    <div class="glass-card table-card">
      <div v-if="loading" class="state-container">
        <div class="spinner-modern"></div>
        <p>Cargando unidades académicas...</p>
      </div>

      <div v-else class="modern-table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Unidad Académica</th>
              <th>Carrera & Ciclo</th>
              <th>Horas / Créditos</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="curso in cursosPaginados" :key="curso._id">
              <td>
                <span class="code-badge">{{ curso.codigo }}</span>
              </td>
              <td class="course-main-cell">
                <strong>{{ curso.nombre }}</strong>
                <span class="course-meta">{{ curso.materia }} {{ curso.numero }}</span>
              </td>
              <td>
                <div class="loc-cell">
                  <span class="carrera-tag">{{ curso.carrera?.codigo || 'TEC' }}</span>
                  <span class="sem-badge">Sem. {{ curso.semestre }}</span>
                </div>
              </td>
              <td class="numeric-cell">
                <div class="stats-pills">
                  <span class="pill horas">{{ curso.horasTotal }}h</span>
                  <span class="pill creditos">{{ curso.creditos }} CR</span>
                </div>
              </td>
              <td class="text-right">
                <div class="actions-flex">
                  <button class="action-btn edit" @click="editarCurso(curso)">✏️</button>
                  <button class="action-btn delete" @click="eliminarCurso(curso)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="cursosFiltrados.length === 0" class="empty-state">
           <div class="empty-icon">📚</div>
           <h3>Malla curricular vacía</h3>
           <p>No hay cursos registrados que coincidan con los filtros actuales. Registra las unidades formativas para los bloques.</p>
           <button class="btn btn-primary" @click="abrirModalNuevo">
             Añadir Primer Curso
           </button>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-wrapper">
      <Pagination 
        v-if="cursosFiltrados.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="cursosFiltrados.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal Extendido -->
    <Modal
      v-model="mostrarModal"
      :titulo="cursoEditando ? 'Actualizar Unidad' : 'Nueva Unidad Académica'"
      size="large"
      :loading="guardando"
      @guardar="guardarCurso"
    >
      <form @submit.prevent="guardarCurso" class="form-modal">
        <div class="form-grid-layout">
          <div class="form-column">
            <h4 class="form-subtitle">Información Base</h4>
            <div class="form-group">
              <label>ID Único (CSV) *</label>
              <input v-model="formulario.codigo" type="text" class="form-input" required :disabled="!!cursoEditando">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Materia (Siglas) *</label>
                <input v-model="formulario.materia" type="text" class="form-input" placeholder="Ej: NAID" required>
              </div>
              <div class="form-group">
                <label>Número *</label>
                <input v-model="formulario.numero" type="text" class="form-input" placeholder="Ej: 178" required>
              </div>
            </div>
            <div class="form-group">
              <label>Nombre del Curso *</label>
              <input v-model="formulario.nombre" type="text" class="form-input" required>
            </div>
          </div>

          <div class="form-column">
            <h4 class="form-subtitle">Estructura Curricular</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Carrera *</label>
                <select v-model="formulario.carrera" class="form-input" required>
                  <option value="">Seleccionar...</option>
                  <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
                    {{ carrera.nombre }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Semestre *</label>
                <input v-model="formulario.semestre" type="text" class="form-input" placeholder="Ej: I, II, 3..." required>
              </div>
            </div>
            <div class="form-row three-col">
              <div class="form-group">
                <label>Horas T.</label>
                <input v-model.number="formulario.horasTeoria" type="number" class="form-input" min="0">
              </div>
              <div class="form-group">
                <label>Horas P/T.</label>
                <input v-model.number="formulario.horasTaller" type="number" class="form-input" min="0">
              </div>
              <div class="form-group">
                <label>Créditos</label>
                <input v-model.number="formulario.creditos" type="number" class="form-input" min="0" step="0.5">
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { cursosService } from '../services'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const store = useAppStore()

const carreraFiltro = ref('')
const semestreFiltro = ref('')
const busqueda = ref('')
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const cursoEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(20)

const formulario = ref({
  codigo: '', nombre: '', carrera: '', semestre: '', materia: '',
  numero: '', tipoCurso: '', creditos: 0, horasTeoria: 0, horasTaller: 0,
  horasVirtual: 0, semanas: 16
})

const carreras = computed(() => store.carreras)
const cursos = computed(() => store.cursos)

const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6 }
const romanToInt = (s) => romanMap[s] || 99

const semestres = computed(() => {
  const sems = new Set()
  cursos.value.forEach(c => { if (c.semestre) sems.add(c.semestre) })
  return Array.from(sems).sort((a, b) => romanToInt(a) - romanToInt(b))
})

const cursosFiltrados = computed(() => {
  let filtered = cursos.value
  if (carreraFiltro.value) filtered = filtered.filter(c => c.carrera?._id === carreraFiltro.value)
  if (semestreFiltro.value) filtered = filtered.filter(c => c.semestre === semestreFiltro.value)
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    filtered = filtered.filter(c => 
      c.nombre.toLowerCase().includes(term) || 
      c.codigo.toLowerCase().includes(term)
    )
  }
  return filtered
})

const cursosPaginados = computed(() => {
  const skip = (paginaActual.value - 1) * porPagina.value
  return cursosFiltrados.value.slice(skip, skip + porPagina.value)
})

const creditosTotales = computed(() => cursosFiltrados.value.reduce((s, c) => s + (c.creditos || 0), 0))
const horasTotales = computed(() => cursosFiltrados.value.reduce((s, c) => s + (c.horasTotal || 0), 0))

function abrirModalNuevo() {
  cursoEditando.value = null
  formulario.value = { 
    codigo: '', nombre: '', carrera: '', semestre: '', materia: '',
    numero: '', tipoCurso: 'TEC', creditos: 0, horasTeoria: 0, horasTaller: 0,
    horasVirtual: 0, semanas: 16
  }
  mostrarModal.value = true
}

function editarCurso(curso) {
  cursoEditando.value = curso
  formulario.value = { ...curso, carrera: curso.carrera?._id || '' }
  mostrarModal.value = true
}

async function guardarCurso() {
  try {
    guardando.value = true
    const data = { ...formulario.value, horasTotal: (formulario.value.horasTeoria || 0) + (formulario.value.horasTaller || 0) }
    if (cursoEditando.value) await cursosService.update(cursoEditando.value._id, data)
    else await cursosService.create(data)
    await store.fetchCursos()
    mostrarModal.value = false
  } catch (err) { console.error(err) }
  finally { guardando.value = false }
}

async function eliminarCurso(curso) {
  if (!confirm(`¿Eliminar "${curso.nombre}"?`)) return
  try {
    await cursosService.delete(curso._id)
    await store.fetchCursos()
  } catch (err) { console.error(err) }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([store.fetchCarreras(), store.fetchCursos({ limit: 0 })])
  loading.value = false
})
</script>

<style scoped>
.cursos-view { max-width: 1600px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
.header-content h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
.header-content p { color: var(--text-muted); font-size: 1.1rem; }

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
}

.btn-premium:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(242, 101, 34, 0.4); }

/* Filters */
.filters-card { padding: 1.5rem 2rem; margin-bottom: 2rem; }
.filtros-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 1.5rem; }

.search-box { position: relative; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 600; outline: none; }

.modern-select { width: 100%; padding: 0.82rem 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 700; outline: none; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
.stat-glass-card { 
  background: rgba(255, 255, 255, 0.03); 
  backdrop-filter: blur(10px); 
  padding: 1.5rem; 
  border-radius: 1.5rem; 
  border: 1px solid rgba(255,255,255,0.1); 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
}
.stat-val { font-size: 2rem; font-weight: 900; color: var(--accent); }
.stat-lab { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

/* Table */
.table-card { padding: 0; overflow: hidden; margin-bottom: 2rem; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 1.25rem 2rem; background: rgba(0,0,0,0.02); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; }
.modern-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); }
.modern-table tr:hover { background: rgba(255,255,255,0.02); }

.code-badge { background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-weight: 800; font-family: monospace; }
.course-main-cell { display: flex; flex-direction: column; }
.course-main-cell strong { font-size: 1rem; }
.course-meta { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }

.loc-cell { display: flex; flex-direction: column; gap: 0.3rem; }
.carrera-tag { font-weight: 800; color: var(--secondary); font-size: 0.85rem; }
.sem-badge { font-size: 0.7rem; background: var(--bg-main); padding: 0.1rem 0.4rem; border-radius: 0.3rem; width: fit-content; font-weight: 700; }

.stats-pills { display: flex; gap: 0.5rem; }
.pill { padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-size: 0.7rem; font-weight: 800; }
.pill.horas { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.pill.creditos { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.actions-flex { display: flex; gap: 0.5rem; justify-content: flex-end; }
.action-btn { background: var(--bg-main); border: 1px solid var(--border); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: var(--accent); transform: scale(1.1); }

/* Modal Form */
.form-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
.form-subtitle { font-size: 0.9rem; text-transform: uppercase; color: var(--accent); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }

@media (max-width: 992px) {
  .form-grid-layout { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
  .filtros-grid { grid-template-columns: 1fr; }
}
</style>
