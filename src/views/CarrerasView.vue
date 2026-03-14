<template>
  <div class="carreras-view fadeIn">
    <div class="page-header">
      <div class="header-title">
        <h1 class="text-gradient">🎓 Carreras Profesionales</h1>
        <p>Administración del catálogo de programas académicos</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nueva Carrera</span>
      </button>
    </div>

    <!-- Filtros Inteligentes -->
    <div class="glass-card filters-card">
      <div class="filters-grid">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchTerm" 
            type="text" 
            placeholder="Buscar por nombre o código..."
            class="search-input"
          >
        </div>
        <div class="select-group">
          <select v-model="filtroActivo" class="modern-select">
            <option value="">Todos los Estados</option>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
          </select>
        </div>
        <div class="select-group">
          <select v-model="porPagina" class="modern-select">
            <option :value="20">20 registros</option>
            <option :value="50">50 registros</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabla Dinámica -->
    <div class="glass-card table-card">
      <div v-if="loading" class="state-container">
        <div class="spinner-modern"></div>
        <p>Sincronizando carreras...</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Programa Académico</th>
              <th>Información</th>
              <th>Estado</th>
              <th class="text-right">Gestión</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="carrera in carrerasPaginadas" :key="carrera._id">
              <td>
                <span class="code-badge">{{ carrera.codigo }}</span>
              </td>
              <td class="name-cell">
                <strong>{{ carrera.nombre }}</strong>
                <span class="sub-text">Catálogo {{ carrera.catalogo || '2024' }}</span>
              </td>
              <td>
                <div class="info-cell">
                  <span>🏫 {{ carrera.escuela?.nombre || 'N/A' }}</span>
                  <span class="level-tag">{{ carrera.nivel || 'Técnico' }}</span>
                </div>
              </td>
              <td>
                <span :class="['status-pill', carrera.activo ? 'active' : 'inactive']">
                  {{ carrera.activo ? 'Operativa' : 'Suspendida' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="glass-btn edit" @click="editarCarrera(carrera)" title="Editar">
                  ✏️
                </button>
                <button class="glass-btn delete" @click="eliminarCarrera(carrera)" title="Eliminar">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="carrerasFiltradas.length === 0" class="empty-state">
           <div class="empty-icon">📂</div>
           <p>No se encontraron carreras que coincidan con la búsqueda</p>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-container">
      <Pagination 
        v-if="carrerasFiltradas.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="carrerasFiltradas.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal de Crear/Editar -->
    <Modal
      v-model="mostrarModal"
      :titulo="carreraEditando ? 'Configurar Carrera' : 'Registro de Carrera'"
      :loading="guardando"
      @guardar="guardarCarrera"
    >
      <form @submit.prevent="guardarCarrera" class="form-modal">
        <div class="form-row">
          <div class="form-group">
            <label>Código Identificador</label>
            <input v-model="formulario.codigo" type="text" class="form-input" placeholder="Ej: NAID" required>
          </div>
          <div class="form-group">
            <label>Catálogo</label>
            <input v-model="formulario.catalogo" type="text" class="form-input" placeholder="2024">
          </div>
        </div>

        <div class="form-group">
          <label>Nombre del Programa</label>
          <input v-model="formulario.nombre" type="text" class="form-input" placeholder="Ej: Administración Industrial" required>
        </div>

        <div class="form-group">
          <label>Escuela / Facultad</label>
          <select v-model="formulario.escuela" class="form-input">
            <option value="">Seleccionar escuela...</option>
            <option v-for="escuela in escuelas" :key="escuela._id" :value="escuela._id">
              {{ escuela.nombre }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Nivel de Formación</label>
            <input v-model="formulario.nivel" type="text" class="form-input" placeholder="Pregrado">
          </div>
          <div class="form-group">
            <label>Grado Académico</label>
            <input v-model="formulario.grado" type="text" class="form-input" placeholder="Profesional">
          </div>
        </div>

        <div class="form-footer-check">
           <label class="premium-checkbox">
             <input v-model="formulario.activo" type="checkbox">
             <span class="checkmark"></span>
             <span class="label-text">Carrera Activa para Programación</span>
           </label>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAppStore } from '../stores/app'
import { carrerasService } from '../services'
import api from '../services/api'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const store = useAppStore()
const toast = inject('toast')

const searchTerm = ref('')
const filtroActivo = ref('')
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const carreraEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(20)

const formulario = ref({
  codigo: '',
  nombre: '',
  escuela: '',
  nivel: '',
  grado: '',
  catalogo: '',
  activo: true
})

const carreras = computed(() => store.carreras)
const escuelas = ref([])

const carrerasFiltradas = computed(() => {
  let filtered = carreras.value
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(c => 
      c.nombre.toLowerCase().includes(term) ||
      c.codigo.toLowerCase().includes(term)
    )
  }
  if (filtroActivo.value !== '') {
    filtered = filtered.filter(c => c.activo === (filtroActivo.value === 'true'))
  }
  return filtered
})

const carrerasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  const fin = inicio + porPagina.value
  return carrerasFiltradas.value.slice(inicio, fin)
})

function abrirModalNuevo() {
  carreraEditando.value = null
  formulario.value = {
    codigo: '', nombre: '', escuela: '', nivel: '', grado: '', catalogo: '', activo: true
  }
  mostrarModal.value = true
}

function editarCarrera(carrera) {
  carreraEditando.value = carrera
  formulario.value = {
    codigo: carrera.codigo,
    nombre: carrera.nombre,
    escuela: carrera.escuela?._id || '',
    nivel: carrera.nivel || '',
    grado: carrera.grado || '',
    catalogo: carrera.catalogo || '',
    activo: carrera.activo !== false
  }
  mostrarModal.value = true
}

async function guardarCarrera() {
  try {
    guardando.value = true
    if (carreraEditando.value) {
      await carrerasService.update(carreraEditando.value._id, formulario.value)
      toast?.success('Carrera actualizada correctamente')
    } else {
      await carrerasService.create(formulario.value)
      toast?.success('Carrera registrada con éxito')
    }
    await store.fetchCarreras()
    mostrarModal.value = false
  } catch (error) {
    console.error('Error:', error)
    toast?.error('Error al procesar la solicitud')
  } finally {
    guardando.value = false
  }
}

async function eliminarCarrera(carrera) {
  if (!confirm(`¿Está seguro de eliminar la carrera "${carrera.nombre}"?`)) return
  try {
    await carrerasService.delete(carrera._id)
    await store.fetchCarreras()
    toast?.success('Registro eliminado')
  } catch (error) {
    console.error('Error:', error)
    toast?.error('No se pudo eliminar la carrera')
  }
}

async function cargarEscuelas() {
  try {
    const response = await api.get('/escuelas')
    escuelas.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([ store.fetchCarreras(), cargarEscuelas() ])
  loading.value = false
})
</script>

<style scoped>
.carreras-view {
  animation: fadeIn 0.6s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
}

.header-title h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 0.5rem; }
.header-title p { color: var(--text-muted); font-size: 1.1rem; }

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
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

.btn-premium:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(242, 101, 34, 0.5);
}

/* Filters */
.filters-card { padding: 1.5rem 2rem; margin-bottom: 2rem; }
.filters-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.5rem; }

.search-box { position: relative; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 600; outline: none; }
.search-input:focus { border-color: var(--accent); }

.modern-select { width: 100%; padding: 0.8rem 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 600; outline: none; }

/* Table */
.table-card { padding: 0; overflow: hidden; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 1.25rem 2rem; background: rgba(0,0,0,0.02); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
.modern-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); }
.modern-table tr:hover { background: rgba(255,255,255,0.02); }

.code-badge { background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-size: 0.8rem; font-weight: 800; font-family: monospace; }
.name-cell { display: flex; flex-direction: column; }
.name-cell strong { font-size: 1rem; margin-bottom: 0.25rem; }
.sub-text { font-size: 0.75rem; color: var(--text-muted); }

.info-cell { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; }
.level-tag { background: rgba(0,0,0,0.05); padding: 0.1rem 0.4rem; border-radius: 0.2rem; font-size: 0.7rem; width: fit-content; }

.status-pill { padding: 0.3rem 0.8rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 800; }
.status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-pill.inactive { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.actions-cell { display: flex; gap: 0.75rem; justify-content: flex-end; }
.glass-btn { background: var(--bg-main); border: 1px solid var(--border); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; filter: grayscale(1); }
.glass-btn:hover { filter: grayscale(0); transform: scale(1.1); border-color: var(--accent); }

/* Checklist Premium */
.form-footer-check { margin-top: 1rem; }
.premium-checkbox { display: flex; align-items: center; gap: 1rem; cursor: pointer; font-weight: 700; user-select: none; }
.premium-checkbox input { display: none; }
.checkmark { width: 22px; height: 22px; border: 2px solid var(--border); border-radius: 6px; position: relative; transition: all 0.3s; }
.premium-checkbox input:checked + .checkmark { background: var(--accent); border-color: var(--accent); }
.premium-checkbox input:checked + .checkmark::after { content: '✓'; color: white; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: 900; }

@media (max-width: 992px) {
  .filters-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
}
</style>
