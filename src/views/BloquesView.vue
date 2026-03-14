<template>
  <div class="bloques-view fadeIn">
    <!-- Header con selector de período -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">📚 Bloques Académicos</h1>
        <p>Estructuración de grupos y cohortes por período electivo</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nuevo Bloque</span>
      </button>
    </div>

    <!-- Selector de Período Glassmorphism -->
    <div class="glass-card period-selector-card">
      <div class="selector-flex">
        <div class="period-info">
          <span class="p-icon">📅</span>
          <div class="p-text">
            <label>Período de Planificación</label>
            <select v-model="periodoSeleccionado" class="period-select-premium" @change="cargarBloques">
              <option value="">Todos los ciclos temporales</option>
              <option v-for="periodo in periodos" :key="periodo._id" :value="periodo._id">
                {{ periodo.codigo }} - {{ periodo.nombre }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros Avanzados -->
    <div class="glass-card filters-card">
      <div class="filtros-grid-bloques">
        <div class="filter-item">
          <label>Especialidad</label>
          <select v-model="carreraFiltro" class="modern-select">
            <option value="">Todas las carreras</option>
            <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
              {{ carrera.codigo }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>Estado Operativo</label>
          <select v-model="estadoFiltro" class="modern-select">
            <option value="">Cualquier estado</option>
            <option value="planificado">Planificado</option>
            <option value="activo">En Curso</option>
            <option value="finalizado">Concluido</option>
          </select>
        </div>
        <div class="filter-item search">
          <label>Búsqueda Rápida</label>
          <div class="search-input-wrapper">
            <span>🔍</span>
            <input v-model="busqueda" type="text" placeholder="Código de bloque...">
          </div>
        </div>
      </div>
    </div>

    <!-- Grid de Bloques Premium -->
    <div v-if="loading" class="state-container">
      <div class="spinner-modern"></div>
      <p>Sincronizando bloques académicos...</p>
    </div>

    <div v-else>
      <div class="bloques-grid">
        <div v-for="bloque in bloquesPaginados" :key="bloque._id" class="bloque-premium-card">
          <div class="card-accent" :class="bloque.estado"></div>
          
          <div class="bloque-card-header">
            <div class="title-area">
              <span class="bloque-code">{{ bloque.codigo }}</span>
              <span :class="['status-pill-mini', bloque.estado]">
                {{ bloque.estado === 'activo' ? 'En Curso' : bloque.estado }}
              </span>
            </div>
            <div class="actions-area">
              <button class="icon-btn edit" @click="editarBloque(bloque)">✏️</button>
              <button class="icon-btn delete" @click="eliminarBloque(bloque)">🗑️</button>
            </div>
          </div>

          <div class="bloque-card-body">
            <div class="meta-row">
              <span class="label">Carrera</span>
              <span class="value">{{ bloque.carrera?.nombre || 'General' }}</span>
            </div>
            <div class="meta-row">
              <span class="label">Nivel Académico</span>
              <span class="value">Semestre {{ bloque.semestreAcademico }}</span>
            </div>
            
            <div class="capacity-section">
              <div class="cap-header">
                <span class="label">Ocupación de Aula</span>
                <span class="value">{{ Math.round((bloque.totalInscritos / bloque.capacidadMax) * 100) }}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" 
                     :style="{ width: `${(bloque.totalInscritos / bloque.capacidadMax) * 100}%` }"
                     :class="{ critical: (bloque.totalInscritos / bloque.capacidadMax) > 0.9 }">
                </div>
              </div>
              <span class="cap-footer">{{ bloque.totalInscritos }} de {{ bloque.capacidadMax }} inscritos</span>
            </div>
          </div>

          <div class="bloque-card-footer">
            <button class="btn-action-premium" @click="verHorario(bloque)">
              <span>Configurar Horario</span>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="bloquesFiltrados.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No se encontraron bloques activos para los criterios seleccionados</p>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-wrapper">
      <Pagination 
        v-if="bloquesFiltrados.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="bloquesFiltrados.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal Moderno -->
    <Modal
      v-model="mostrarModal"
      :titulo="bloqueEditando ? 'Actualizar Bloque' : 'Nuevo Bloque Académico'"
      :loading="guardando"
      @guardar="guardarBloque"
    >
      <form @submit.prevent="guardarBloque" class="form-modal">
        <div class="form-group">
          <label>Código Identificador *</label>
          <input v-model="formulario.codigo" type="text" class="form-input" placeholder="Ej: NAIDE201" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Período Lectivo *</label>
            <select v-model="formulario.periodo" class="form-input" required>
              <option value="">Seleccionar Período</option>
              <option v-for="periodo in periodos" :key="periodo._id" :value="periodo._id">
                {{ periodo.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Especialidad / Carrera *</label>
            <select v-model="formulario.carrera" class="form-input" required>
              <option value="">Seleccionar Carrera</option>
              <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
                {{ carrera.nombre }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Semestre Académico *</label>
            <select v-model="formulario.semestreAcademico" class="form-input" required>
              <option value="">Seleccionar</option>
              <option v-for="i in 6" :key="i" :value="'I'.repeat(i)">Semestre {{ 'I'.repeat(i) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Capacidad del Grupo *</label>
            <input v-model.number="formulario.capacidadMax" type="number" class="form-input" min="1" required>
          </div>
        </div>

        <div class="form-group">
          <label>Estado del Bloque</label>
          <select v-model="formulario.estado" class="form-input" required>
            <option value="planificado">Planificado</option>
            <option value="activo">Activo</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { bloquesService, periodosService } from '../services'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const router = useRouter()
const store = useAppStore()

const periodos = ref([])
const bloques = ref([])
const periodoSeleccionado = ref('')
const carreraFiltro = ref('')
const estadoFiltro = ref('')
const busqueda = ref('')
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const bloqueEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(20)

const formulario = ref({
  codigo: '', periodo: '', carrera: '', semestreAcademico: '',
  capacidadMax: 30, fechaInicio: '', fechaFin: '', estado: 'planificado'
})

const carreras = computed(() => store.carreras)

const bloquesFiltrados = computed(() => {
  let filtered = bloques.value
  if (periodoSeleccionado.value) filtered = filtered.filter(b => b.periodo?._id === periodoSeleccionado.value)
  if (carreraFiltro.value) filtered = filtered.filter(b => b.carrera?._id === carreraFiltro.value)
  if (estadoFiltro.value) filtered = filtered.filter(b => b.estado === estadoFiltro.value)
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    filtered = filtered.filter(b => b.codigo.toLowerCase().includes(term))
  }
  return filtered
})

const bloquesPaginados = computed(() => {
  const skip = (paginaActual.value - 1) * porPagina.value
  return bloquesFiltrados.value.slice(skip, skip + porPagina.value)
})

function verHorario(bloque) {
  router.push(`/horarios/bloque/${bloque._id}`)
}

function abrirModalNuevo() {
  bloqueEditando.value = null
  formulario.value = {
    codigo: '', periodo: periodoSeleccionado.value || '', carrera: '',
    semestreAcademico: '', capacidadMax: 30, fechaInicio: '', fechaFin: '', estado: 'planificado'
  }
  mostrarModal.value = true
}

function editarBloque(bloque) {
  bloqueEditando.value = bloque
  formulario.value = {
    codigo: bloque.codigo,
    periodo: bloque.periodo?._id || '',
    carrera: bloque.carrera?._id || '',
    semestreAcademico: bloque.semestreAcademico || '',
    capacidadMax: bloque.capacidadMax || 30,
    estado: bloque.estado || 'planificado'
  }
  mostrarModal.value = true
}

async function guardarBloque() {
  try {
    guardando.value = true
    if (bloqueEditando.value) await bloquesService.update(bloqueEditando.value._id, formulario.value)
    else await bloquesService.create(formulario.value)
    await cargarBloques()
    mostrarModal.value = false
  } catch (err) { console.error(err) }
  finally { guardando.value = false }
}

async function eliminarBloque(bloque) {
  if (!confirm(`¿Eliminar bloque "${bloque.codigo}"?`)) return
  try {
    await bloquesService.delete(bloque._id)
    await cargarBloques()
  } catch (err) { console.error(err) }
}

async function cargarPeriodos() {
  try {
    const response = await periodosService.getAll()
    periodos.value = response.data.data
    const activo = periodos.value.find(p => p.estado === 'activo')
    if (activo) periodoSeleccionado.value = activo._id
  } catch (err) { console.error(err) }
}

async function cargarBloques() {
  try {
    loading.value = true
    const params = {}
    if (periodoSeleccionado.value) params.periodo = periodoSeleccionado.value
    const response = await bloquesService.getAll(params)
    bloques.value = response.data.data
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

onMounted(async () => {
  await Promise.all([store.fetchCarreras(), cargarPeriodos()])
  await cargarBloques()
})
</script>

<style scoped>
.bloques-view { max-width: 1600px; margin: 0 auto; }

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

.period-selector-card { padding: 1.5rem; margin-bottom: 1.5rem; }
.selector-flex { display: flex; align-items: center; }
.period-info { display: flex; gap: 1rem; align-items: center; width: 100%; }
.p-icon { font-size: 2rem; background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 1rem; }
.p-text { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.p-text label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); }
.period-select-premium { 
  background: none; 
  border: none; 
  font-size: 1.5rem; 
  font-weight: 900; 
  color: var(--text-main); 
  outline: none; 
  cursor: pointer; 
  width: 100%;
}

.filters-card { padding: 1.5rem 2rem; margin-bottom: 2.5rem; }
.filtros-grid-bloques { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 2rem; }
.filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
.filter-item label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

.search-input-wrapper { 
  display: flex; 
  align-items: center; 
  gap: 0.75rem; 
  background: var(--bg-main); 
  padding: 0.75rem 1rem; 
  border-radius: 0.75rem; 
  border: 1px solid var(--border); 
}
.search-input-wrapper input { background: none; border: none; outline: none; color: var(--text-main); font-weight: 600; width: 100%; }

.modern-select { padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border); background: var(--bg-main); font-weight: 700; color: var(--text-main); }

/* Grid */
.bloques-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 2rem; margin-bottom: 3rem; }

.bloque-premium-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.75rem;
  padding: 1.75rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.bloque-premium-card:hover { transform: translateY(-8px); border-color: var(--accent); }

.card-accent { position: absolute; left: 0; top: 0; width: 6px; height: 100%; }
.card-accent.activo { background: #10b981; }
.card-accent.planificado { background: #f59e0b; }
.card-accent.finalizado { background: #94a3b8; }

.bloque-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.bloque-code { font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; display: block; }
.status-pill-mini { font-size: 0.6rem; font-weight: 900; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 0.5rem; }
.status-pill-mini.activo { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-pill-mini.planificado { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.actions-area { display: flex; gap: 0.5rem; }
.icon-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.icon-btn:hover { border-color: var(--accent); transform: scale(1.1); }

.bloque-card-body { flex: 1; display: flex; flex-direction: column; gap: 1rem; }
.meta-row { display: flex; flex-direction: column; }
.meta-row .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
.meta-row .value { font-size: 0.95rem; font-weight: 700; }

.capacity-section { margin-top: 0.5rem; }
.cap-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.progress-bar-bg { height: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden; margin-bottom: 0.4rem; }
.progress-bar-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.5s; }
.progress-bar-fill.critical { background: #ef4444; }
.cap-footer { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }

.bloque-card-footer { margin-top: 2rem; }
.btn-action-premium { 
  width: 100%; 
  padding: 1rem; 
  background: var(--bg-main); 
  border: 1px solid var(--border); 
  border-radius: 1.25rem; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.75rem; 
  color: var(--text-main); 
  font-weight: 800; 
  cursor: pointer; 
  transition: all 0.3s;
}
.btn-action-premium:hover { background: var(--accent); color: white; border-color: var(--accent); }

@media (max-width: 992px) {
  .filtros-grid-bloques { grid-template-columns: 1fr; gap: 1rem; }
  .bloques-grid { grid-template-columns: 1fr; }
}
</style>
