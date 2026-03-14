<template>
  <div class="ubicaciones-view fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">🗺️ Estructura Orgánica</h1>
        <p>Administración de Direcciones Zonales y Sedes Operativas</p>
      </div>
      <div class="header-actions">
        <button v-if="activeTab === 'zonales'" class="btn btn-premium" @click="abrirModalZonal">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
            <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Nueva Zonal</span>
        </button>
        <button v-if="activeTab === 'sedes'" class="btn btn-premium" @click="abrirModalSede">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
            <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Nueva Sede</span>
        </button>
      </div>
    </div>

    <!-- Tabs Glassmorphism -->
    <div class="tabs-wrapper">
      <div class="tabs-glass">
        <button 
          class="nav-tab" 
          :class="{ active: activeTab === 'zonales' }" 
          @click="activeTab = 'zonales'"
        >
          <span class="tab-icon">🏢</span>
          <span class="tab-label">Direcciones Zonales</span>
          <div class="active-indicator"></div>
        </button>
        <button 
          class="nav-tab" 
          :class="{ active: activeTab === 'sedes' }" 
          @click="activeTab = 'sedes'"
        >
          <span class="tab-icon">📍</span>
          <span class="tab-label">Sedes / CFP</span>
          <div class="active-indicator"></div>
        </button>
      </div>
    </div>

    <!-- TAB ZONALES -->
    <div v-if="activeTab === 'zonales'" class="tab-content fadeIn">
      <div class="glass-card table-card">
        <div v-if="loading" class="state-container">
          <div class="spinner-modern"></div>
          <p>Sincronizando zonales...</p>
        </div>
        
        <div v-else-if="zonales.length === 0" class="empty-state">
           <div class="empty-icon">📂</div>
           <p>No hay zonales registradas aún.</p>
        </div>
        
        <div v-else class="modern-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Nombre Zonal</th>
                <th>Código</th>
                <th>Presencia</th>
                <th class="text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zonal in zonales" :key="zonal._id">
                <td class="primary-cell">
                  <strong>{{ zonal.nombre }}</strong>
                </td>
                <td>
                  <span class="code-badge">{{ zonal.codigo || 'DZ-N/A' }}</span>
                </td>
                <td>
                  <span class="meta-info">Nacional</span>
                </td>
                <td class="text-right">
                  <span :class="['status-pill', zonal.activo ? 'active' : 'inactive']">
                    {{ zonal.activo ? 'Operativa' : 'Suspendida' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB SEDES -->
    <div v-if="activeTab === 'sedes'" class="tab-content fadeIn">
      <div class="glass-card filters-card">
        <div class="filters-flex">
          <div class="filter-group">
            <label>Filtrar por Zonal:</label>
            <select v-model="filtroZonal" @change="filtrarSedes" class="modern-select">
              <option value="">Todas las Zonales</option>
              <option v-for="z in zonales" :key="z._id" :value="z._id">{{ z.nombre }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="glass-card table-card">
        <div v-if="loading" class="state-container">
          <div class="spinner-modern"></div>
          <p>Localizando sedes académicas...</p>
        </div>
        
        <div v-else-if="sedes.length === 0" class="empty-state">
           <div class="empty-icon">📂</div>
           <p>No hay sedes registradas para esta selección.</p>
        </div>
        
        <div v-else class="modern-table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Nombre Sede</th>
                <th>Dirección Zonal</th>
                <th>Tipo</th>
                <th class="text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sede in sedesFiltradas" :key="sede._id">
                <td class="primary-cell">
                  <div class="sede-info">
                    <strong>{{ sede.nombre }}</strong>
                    <span class="sub-text">{{ sede.direccion || 'Sin dirección registrada' }}</span>
                  </div>
                </td>
                <td>
                  <span class="zonal-tag">{{ sede.zonal?.nombre || 'General' }}</span>
                </td>
                <td>
                  <span class="type-badge">{{ sede.tipo }}</span>
                </td>
                <td class="text-right">
                  <span :class="['status-pill', sede.activo ? 'active' : 'inactive']">
                    {{ sede.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals Slim -->
    <Modal v-model="showModalZonal" titulo="Nueva Dirección Zonal" @guardar="showModalZonal = false">
      <div class="modal-notice">
        <p>Módulo de edición avanzada deshabilitado temporalmente.</p>
      </div>
    </Modal>
    <Modal v-model="showModalSede" titulo="Nueva Sede / CFP" @guardar="showModalSede = false">
      <div class="modal-notice">
        <p>Módulo de edición avanzada deshabilitado temporalmente.</p>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import api from '../services/api'
import Modal from '../components/Modal.vue'

const toast = inject('toast')

const activeTab = ref('zonales')
const loading = ref(false)
const zonales = ref([])
const sedes = ref([])
const filtroZonal = ref("")
const showModalZonal = ref(false)
const showModalSede = ref(false)

onMounted(async () => {
  await cargarZonales()
  await cargarSedes()
})

const cargarZonales = async () => {
  try {
    loading.value = true
    const { data } = await api.get('/ubicaciones/zonales')
    zonales.value = data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const cargarSedes = async () => {
  try {
    loading.value = true
    const url = filtroZonal.value 
      ? `/ubicaciones/sedes?zonal=${filtroZonal.value}`
      : '/ubicaciones/sedes'
    const { data } = await api.get(url)
    sedes.value = data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const filtrarSedes = () => cargarSedes()
const sedesFiltradas = computed(() => sedes.value)

const abrirModalZonal = () => toast.info('Edición disponible próximamente')
const abrirModalSede = () => toast.info('Edición disponible próximamente')
</script>

<style scoped>
.ubicaciones-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
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
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

/* Tabs Redesign */
.tabs-wrapper { margin-bottom: 2.5rem; }
.tabs-glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  padding: 0.5rem;
  border-radius: 1.25rem;
  display: flex;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-tab {
  padding: 0.75rem 1.75rem;
  border-radius: 1rem;
  border: none;
  background: none;
  color: var(--text-muted);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  transition: all 0.3s;
}

.nav-tab.active {
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent);
}

.nav-tab .active-indicator {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0;
  transition: all 0.3s;
}

.nav-tab.active .active-indicator { opacity: 1; }

/* Table Premium */
.table-card { padding: 0; overflow: hidden; margin-bottom: 3rem; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 1.25rem 2rem; background: rgba(0,0,0,0.02); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 800; }
.modern-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); }

.primary-cell strong { font-size: 1rem; font-weight: 800; }
.code-badge { background: var(--bg-main); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-family: monospace; font-size: 0.8rem; font-weight: 800; }

.status-pill { padding: 0.3rem 0.8rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 800; }
.status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.status-pill.inactive { background: rgba(0,0,0,0.1); color: var(--text-muted); }

.sede-info { display: flex; flex-direction: column; }
.sub-text { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
.zonal-tag { font-weight: 800; color: var(--primary); font-size: 0.85rem; }
.type-badge { background: var(--bg-main); padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-size: 0.7rem; font-weight: 900; border: 1px solid var(--border); }

.filters-card { padding: 1.25rem 2rem; margin-bottom: 1.5rem; }
.modern-select { padding: 0.6rem 1rem; border-radius: 0.5rem; border: 1px solid var(--border); font-weight: 700; outline: none; background: var(--bg-main); }

.modal-notice { padding: 2rem; text-align: center; color: var(--text-muted); font-weight: 600; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
  .tabs-glass { width: 100%; }
  .nav-tab { flex: 1; padding: 0.75rem; font-size: 0.8rem; }
}
</style>
