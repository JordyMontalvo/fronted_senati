<template>
  <div class="profesores-view fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">👨‍🏫 Gestión Docente</h1>
        <p>Administración del registro de instructores y especialistas</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nuevo Profesor</span>
      </button>
    </div>

    <!-- Filtros Inteligentes -->
    <div class="glass-card filters-card">
      <div class="filtros-grid">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            v-model="busqueda" 
            type="text" 
            placeholder="Buscar por nombre, código o especialidad..."
            class="search-input"
          >
        </div>
        <div class="select-group">
          <select v-model="estadoFiltro" class="modern-select">
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
        <div class="select-group">
          <select v-model="porPagina" class="modern-select">
            <option :value="24">24 por página</option>
            <option :value="48">48 por página</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Vista de Profesores -->
    <div v-if="loading" class="state-container">
      <div class="spinner-modern"></div>
      <p>Sincronizando plantilla docente...</p>
    </div>

    <div v-else class="profesores-grid">
      <div v-for="profesor in profesoresPaginados" :key="profesor._id" class="profesor-glass-card">
        <div class="card-inner">
          <div class="profesor-avatar-wrapper">
            <div class="profesor-avatar">
              <span class="avatar-initials">{{ profesor.nombres.charAt(0) }}{{ profesor.apellidos.charAt(0) }}</span>
            </div>
            <div :class="['status-dot', profesor.activo ? 'active' : 'inactive']"></div>
          </div>

          <div class="profesor-main-info">
            <div class="profesor-header">
              <div class="name-group">
                <h3>{{ profesor.nombres }} {{ profesor.apellidos }}</h3>
                <span class="profesor-code">{{ profesor.codigo || 'S/C' }}</span>
              </div>
            </div>

            <div class="profesor-details-list">
              <div v-if="profesor.especialidad" class="detail-pill">
                <span class="icon">🎓</span>
                <span class="text">{{ profesor.especialidad }}</span>
              </div>
              <div v-if="profesor.email" class="detail-pill">
                <span class="icon">📧</span>
                <span class="text">{{ profesor.email }}</span>
              </div>
            </div>
          </div>

          <div class="profesor-footer-actions">
            <button class="action-btn edit" @click="editarProfesor(profesor)" title="Editar">
              ✏️
            </button>
            <button class="action-btn delete" @click="eliminarProfesor(profesor)" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="profesoresFiltrados.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <p>No se encontraron registros para esta búsqueda</p>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-wrapper">
      <Pagination 
        v-if="profesoresFiltrados.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="profesoresFiltrados.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal -->
    <Modal
      v-model="mostrarModal"
      :titulo="profesorEditando ? 'Configurar Profesor' : 'Nuevo Registro Docente'"
      :loading="guardando"
      @guardar="guardarProfesor"
    >
      <form @submit.prevent="guardarProfesor" class="form-modal">
        <div class="form-row">
          <div class="form-group">
            <label>Nombres *</label>
            <input v-model="formulario.nombres" type="text" placeholder="Nombres del docente" required>
          </div>
          <div class="form-group">
            <label>Apellidos *</label>
            <input v-model="formulario.apellidos" type="text" placeholder="Apellidos del docente" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Código de Empleado</label>
            <input v-model="formulario.codigo" type="text" placeholder="Ej: P12345">
          </div>
          <div class="form-group">
            <label>DNI / Identificación</label>
            <input v-model="formulario.dni" type="text" maxlength="8" placeholder="Documento de identidad">
          </div>
        </div>

        <div class="form-group">
          <label>Especialidad Académica</label>
          <input v-model="formulario.especialidad" type="text" placeholder="Ej: Ingeniería de Software, Matemáticas...">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Correo Institucional</label>
            <input v-model="formulario.email" type="email" placeholder="docente@senati.edu.pe">
          </div>
          <div class="form-group">
            <label>Teléfono de Contacto</label>
            <input v-model="formulario.telefono" type="tel" placeholder="+51 ...">
          </div>
        </div>

        <div class="form-group-checkbox">
          <label class="premium-checkbox">
            <input v-model="formulario.activo" type="checkbox">
            <span class="checkmark"></span>
            <span class="label-text">Profesor habilitado para programación de horarios</span>
          </label>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { profesoresService } from '../services'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const profesores = ref([])
const busqueda = ref('')
const estadoFiltro = ref('')
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const profesorEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(24)

const formulario = ref({
  nombres: '',
  apellidos: '',
  codigo: '',
  dni: '',
  especialidad: '',
  email: '',
  telefono: '',
  activo: true
})

const profesoresFiltrados = computed(() => {
  let filtered = profesores.value
  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.nombres.toLowerCase().includes(term) ||
      p.apellidos.toLowerCase().includes(term) ||
      (p.codigo && p.codigo.toLowerCase().includes(term)) ||
      (p.especialidad && p.especialidad.toLowerCase().includes(term))
    )
  }
  if (estadoFiltro.value !== '') {
    filtered = filtered.filter(p => p.activo === (estadoFiltro.value === 'true'))
  }
  return filtered
})

const profesoresPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return profesoresFiltrados.value.slice(inicio, inicio + porPagina.value)
})

function abrirModalNuevo() {
  profesorEditando.value = null
  formulario.value = {
    nombres: '', apellidos: '', codigo: '', dni: '', especialidad: '',
    email: '', telefono: '', activo: true
  }
  mostrarModal.value = true
}

function editarProfesor(profesor) {
  profesorEditando.value = profesor
  formulario.value = {
    nombres: profesor.nombres,
    apellidos: profesor.apellidos,
    codigo: profesor.codigo || '',
    dni: profesor.dni || '',
    especialidad: profesor.especialidad || '',
    email: profesor.email || '',
    telefono: profesor.telefono || '',
    activo: profesor.activo !== false
  }
  mostrarModal.value = true
}

async function guardarProfesor() {
  try {
    guardando.value = true
    if (profesorEditando.value) await profesoresService.update(profesorEditando.value._id, formulario.value)
    else await profesoresService.create(formulario.value)
    await cargarProfesores()
    mostrarModal.value = false
  } catch (error) { console.error('Error:', error) }
  finally { guardando.value = false }
}

async function eliminarProfesor(profesor) {
  if (!confirm(`¿Eliminar a ${profesor.nombres} ${profesor.apellidos}?`)) return
  try {
    await profesoresService.delete(profesor._id)
    await cargarProfesores()
  } catch (error) { console.error('Error:', error) }
}

async function cargarProfesores() {
  try {
    loading.value = true
    const response = await profesoresService.getAll()
    profesores.value = response.data.data
  } catch (error) { console.error('Error:', error) }
  finally { loading.value = false }
}

onMounted(() => cargarProfesores())
</script>

<style scoped>
.profesores-view { max-width: 1600px; margin: 0 auto; }
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
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

.btn-premium:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(242, 101, 34, 0.5); }

/* Filters */
.filters-card { padding: 1.5rem 2rem; margin-bottom: 2.5rem; }
.filtros-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.5rem; }
.search-box { position: relative; }
.search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }

/* Grid */
.profesores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 2rem; margin-bottom: 3rem; }

.profesor-glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 1.75rem;
  position: relative;
  transition: all 0.4s;
}

.profesor-glass-card:hover { 
  transform: translateY(-10px); 
  background: rgba(255, 255, 255, 0.07); 
  border-color: rgba(242, 101, 34, 0.3); 
}

.card-inner { display: flex; gap: 1.5rem; align-items: center; }
.profesor-avatar-wrapper { position: relative; flex-shrink: 0; }
.profesor-avatar {
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot { position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%; border: 4px solid var(--bg-main); }
.status-dot.active { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
.status-dot.inactive { background: #94a3b8; }

.profesor-main-info { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.name-group h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem; }
.profesor-code { font-size: 0.7rem; font-weight: 800; background: rgba(0,0,0,0.2); padding: 0.1rem 0.6rem; border-radius: 0.4rem; color: var(--text-muted); text-transform: uppercase; width: fit-content; }

.detail-pill { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
.profesor-footer-actions { position: absolute; top: 1.25rem; right: 1.25rem; display: flex; gap: 0.5rem; opacity: 0; transition: all 0.3s; }
.profesor-glass-card:hover .profesor-footer-actions { opacity: 1; }

.action-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { transform: scale(1.1); border-color: var(--accent); }

/* Premium Checkbox */
.premium-checkbox { display: flex; align-items: center; gap: 1rem; cursor: pointer; font-weight: 700; user-select: none; }
.premium-checkbox input { display: none; }
.checkmark { width: 22px; height: 22px; border: 2px solid var(--border); border-radius: 6px; position: relative; transition: all 0.3s; }
.premium-checkbox input:checked + .checkmark { background: var(--accent); border-color: var(--accent); }
.premium-checkbox input:checked + .checkmark::after { content: '✓'; color: white; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-weight: 900; }

@media (max-width: 768px) {
  .filtros-grid { grid-template-columns: 1fr; }
  .profesores-grid { grid-template-columns: 1fr; }
}
</style>
