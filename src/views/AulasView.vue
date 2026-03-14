<template>
  <div class="aulas-view fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">🚪 Infraestructura</h1>
        <p>Gestión de aulas, laboratorios y talleres tecnológicos</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nueva Aula</span>
      </button>
    </div>

    <!-- Filtros Inteligentes -->
    <div class="glass-card filters-card">
      <div class="filtros-grid">
        <div class="select-group">
          <select v-model="tipoFiltro" class="modern-select">
            <option value="">Todos los Tipos</option>
            <option value="Aula">Aulas Teóricas</option>
            <option value="Laboratorio">Laboratorios</option>
            <option value="Taller">Talleres</option>
            <option value="Auditorio">Auditorios</option>
          </select>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="busqueda" 
            type="text" 
            placeholder="Buscar por código o nombre..."
            class="search-input"
          >
        </div>
        <div class="select-group">
          <select v-model="porPagina" class="modern-select">
            <option :value="20">20 registros</option>
            <option :value="50">50 registros</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Grid de Aulas -->
    <div v-if="loading" class="state-container">
      <div class="spinner-modern"></div>
      <p>Sincronizando espacios físicos...</p>
    </div>

    <div v-else class="aulas-grid">
      <div v-for="aula in aulasPaginadas" :key="aula._id" class="aula-premium-card" :class="`type-${aula.tipo.toLowerCase()}`">
        <div class="card-overlay"></div>
        
        <div class="card-top">
          <div class="type-icon-wrapper">
            <div class="type-icon">
              <span v-if="aula.tipo === 'Laboratorio'">🔬</span>
              <span v-else-if="aula.tipo === 'Taller'">🛠️</span>
              <span v-else-if="aula.tipo === 'Auditorio'">🎭</span>
              <span v-else>📖</span>
            </div>
          </div>
          <div class="badges-row">
            <span :class="['type-badge', aula.tipo.toLowerCase()]">{{ aula.tipo }}</span>
            <span v-if="!aula.activo" class="status-badge inactive">Inactiva</span>
          </div>
        </div>

        <div class="card-main">
          <div class="code-title">
            <span class="aula-code">{{ aula.codigo }}</span>
            <h3>{{ aula.nombre }}</h3>
          </div>
          
          <div class="space-stats">
            <div class="stat-pill">
              <span class="label">Capacidad</span>
              <span class="value">{{ aula.capacidad }} pers.</span>
            </div>
            <div class="stat-pill">
              <span class="label">Ubicación</span>
              <span class="value">{{ aula.edificio || 'Gral' }} - P{{ aula.piso || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button class="icon-action-btn edit" @click="editarAula(aula)">
            <span>Editar</span>
            ✏️
          </button>
          <button class="icon-action-btn delete" @click="eliminarAula(aula)">
            🗑️
          </button>
        </div>
      </div>

      <div v-if="aulasFiltradas.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No se encontraron ambientes que coincidan con la búsqueda</p>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-wrapper">
      <Pagination 
        v-if="aulasFiltradas.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="aulasFiltradas.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal -->
    <Modal
      v-model="mostrarModal"
      :titulo="aulaEditando ? 'Configurar Ambiente' : 'Registro de Nueva Aula'"
      :loading="guardando"
      @guardar="guardarAula"
    >
      <form @submit.prevent="guardarAula" class="form-modal">
        <div class="form-row">
          <div class="form-group">
            <label>Código Identificador *</label>
            <input v-model="formulario.codigo" type="text" class="form-input" placeholder="Ej: LAB-101" required>
          </div>
          <div class="form-group">
            <label>Nombre del Ambiente *</label>
            <input v-model="formulario.nombre" type="text" class="form-input" placeholder="Ej: Laboratorio de Redes" required>
          </div>
        </div>

        <div class="form-group">
          <label>Tipo de Espacio *</label>
          <select v-model="formulario.tipo" class="form-input" required>
            <option value="">Seleccionar tipo</option>
            <option value="Aula">Aula Teórica</option>
            <option value="Taller">Taller de Especialidad</option>
            <option value="Laboratorio">Laboratorio Tecnológico</option>
            <option value="Auditorio">Auditorio / Sala Múltiple</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Edificio / Pabellón</label>
            <input v-model="formulario.edificio" type="text" class="form-input" placeholder="Ej: Pabellón A">
          </div>
          <div class="form-group">
            <label>Nivel / Piso</label>
            <input v-model.number="formulario.piso" type="number" class="form-input" min="0" placeholder="0">
          </div>
        </div>

        <div class="form-group">
          <label>Capacidad Máxima (Aforo) *</label>
          <input v-model.number="formulario.capacidad" type="number" class="form-input" min="1" placeholder="Ej: 30" required>
        </div>

        <div class="form-footer-check">
           <label class="premium-checkbox">
             <input v-model="formulario.activo" type="checkbox">
             <span class="checkmark"></span>
             <span class="label-text">Ambiente disponible para asignación de horarios</span>
           </label>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { aulasService } from '../services'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const aulas = ref([])
const tipoFiltro = ref('')
const busqueda = ref('')
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const aulaEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(20)

const formulario = ref({
  codigo: '',
  nombre: '',
  tipo: '',
  edificio: '',
  piso: 0,
  capacidad: 30,
  activo: true
})

const aulasFiltradas = computed(() => {
  let filtered = aulas.value
  if (tipoFiltro.value) filtered = filtered.filter(a => a.tipo === tipoFiltro.value)
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.nombre.toLowerCase().includes(term) ||
      a.codigo.toLowerCase().includes(term)
    )
  }
  return filtered
})

const aulasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  const fin = inicio + porPagina.value
  return aulasFiltradas.value.slice(inicio, fin)
})

function abrirModalNuevo() {
  aulaEditando.value = null
  formulario.value = {
    codigo: '', nombre: '', tipo: '', edificio: '', piso: 0, capacidad: 30, activo: true
  }
  mostrarModal.value = true
}

function editarAula(aula) {
  aulaEditando.value = aula
  formulario.value = {
    codigo: aula.codigo,
    nombre: aula.nombre,
    tipo: aula.tipo,
    edificio: aula.edificio || '',
    piso: aula.piso || 0,
    capacidad: aula.capacidad,
    activo: aula.activo !== false
  }
  mostrarModal.value = true
}

async function guardarAula() {
  try {
    guardando.value = true
    if (aulaEditando.value) {
      await aulasService.update(aulaEditando.value._id, formulario.value)
    } else {
      await aulasService.create(formulario.value)
    }
    await cargarAulas()
    mostrarModal.value = false
  } catch (error) {
    console.error('Error guardando aula:', error)
  } finally {
    guardando.value = false
  }
}

async function eliminarAula(aula) {
  if (!confirm(`¿Eliminar el aula "${aula.nombre}"?`)) return
  try {
    await aulasService.delete(aula._id)
    await cargarAulas()
  } catch (error) {
    console.error('Error eliminando aula:', error)
  }
}

async function cargarAulas() {
  try {
    loading.value = true
    const response = await aulasService.getAll()
    aulas.value = response.data.data
  } catch (error) {
    console.error('Error cargando aulas:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarAulas()
})
</script>

<style scoped>
.aulas-view {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
}

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
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

.btn-premium:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 15px rgba(242, 101, 34, 0.5);
}

/* Filters */
.filters-card { padding: 1.5rem 2rem; margin-bottom: 2.5rem; }
.filtros-grid { display: grid; grid-template-columns: 1.2fr 2fr 1.2fr; gap: 1.5rem; }

.search-box { position: relative; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 600; outline: none; transition: border-color 0.2s; }
.search-input:focus { border-color: var(--accent); }

.modern-select { width: 100%; padding: 0.82rem 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-main); font-weight: 700; outline: none; }

/* Grid */
.aulas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.aula-premium-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  padding: 1.75rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.aula-premium-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(242, 101, 34, 0.4);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-icon {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.05);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.badges-row { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; }
.type-badge { padding: 0.3rem 0.75rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
.type-badge.aula { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.type-badge.laboratorio { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.type-badge.taller { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.type-badge.auditorio { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

.status-badge.inactive { background: rgba(0,0,0,0.2); color: #94a3b8; padding: 0.2rem 0.5rem; border-radius: 0.3rem; font-size: 0.6rem; font-weight: 800; }

.code-title h3 { font-size: 1.25rem; font-weight: 800; margin-top: 0.25rem; }
.aula-code { font-size: 0.75rem; font-weight: 900; color: var(--accent); letter-spacing: 1px; }

.space-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-pill {
  padding: 0.75rem;
  background: rgba(0,0,0,0.1);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
}

.stat-pill .label { font-size: 0.6rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem; }
.stat-pill .value { font-size: 0.85rem; font-weight: 700; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.icon-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: all 0.2s;
}

.icon-action-btn:hover { color: var(--accent); }
.icon-action-btn.delete:hover { transform: scale(1.2); }

/* Checklist Premium */
.form-footer-check { margin-top: 1rem; }
.premium-checkbox { display: flex; align-items: center; gap: 1rem; cursor: pointer; font-weight: 700; user-select: none; }
.premium-checkbox input { display: none; }
.checkmark { width: 22px; height: 22px; border: 2px solid var(--border); border-radius: 6px; position: relative; transition: all 0.3s; }
.premium-checkbox input:checked + .checkmark { background: var(--accent); border-color: var(--accent); }
.premium-checkbox input:checked + .checkmark::after { content: '✓'; color: white; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: 900; }

@media (max-width: 768px) {
  .filtros-grid { grid-template-columns: 1fr; }
  .aulas-grid { grid-template-columns: 1fr; }
}
</style>
