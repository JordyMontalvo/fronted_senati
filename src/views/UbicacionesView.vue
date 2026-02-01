<template>
  <div class="ubicaciones-container">
    <div class="header-section">
      <h1>Gestión de Ubicaciones</h1>
      <p>Administra las Direcciones Zonales y sus Sedes (CFP/UCP/Escuelas).</p>
      
      <div class="header-actions">
        <button v-if="activeTab === 'zonales'" class="btn btn-primary" @click="abrirModalZonal">
          + Nueva Zonal
        </button>
        <button v-if="activeTab === 'sedes'" class="btn btn-primary" @click="abrirModalSede">
          + Nueva Sede
        </button>
      </div>
    </div>

    <!-- Tabs de Selección -->
    <div class="tabs-container">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'zonales' }" 
        @click="activeTab = 'zonales'"
      >
        🗺️ Direcciones Zonales
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'sedes' }" 
        @click="activeTab = 'sedes'"
      >
        📍 Sedes / CFP
      </button>
    </div>

    <!-- TABLA ZONALES -->
    <div v-if="activeTab === 'zonales'" class="content-tab">
      <div class="card">
        <div v-if="loading" class="loading">Cargando Zonales...</div>
        <div v-else-if="zonales.length === 0" class="empty-state">No hay zonales registradas.</div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th>Nombre Zonal</th>
              <th>Código</th>
              <th>Estado</th>
              <!-- <th>Acciones</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="zonal in zonales" :key="zonal._id">
              <td><strong>{{ zonal.nombre }}</strong></td>
              <td>{{ zonal.codigo || '-' }}</td>
              <td>
                <span class="badge" :class="zonal.activo ? 'badge-success' : 'badge-secondary'">
                  {{ zonal.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TABLA SEDES -->
    <div v-if="activeTab === 'sedes'" class="content-tab">
      <div class="filters card">
        <label>Filtrar por Zonal:</label>
        <select v-model="filtroZonal" @change="filtrarSedes">
          <option value="">Todas las Zonales</option>
          <option v-for="z in zonales" :key="z._id" :value="z._id">{{ z.nombre }}</option>
        </select>
      </div>

      <div class="card">
        <div v-if="loading" class="loading">Cargando Sedes...</div>
        <div v-else-if="sedes.length === 0" class="empty-state">No hay sedes registradas.</div>
        
        <table v-else class="table">
          <thead>
            <tr>
              <th>Nombre Sede</th>
              <th>Zonal</th>
              <th>Dirección</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sede in sedesFiltradas" :key="sede._id">
              <td><strong>{{ sede.nombre }}</strong></td>
              <td>{{ sede.zonal?.nombre || 'Sin Asignar' }}</td>
              <td>{{ sede.direccion || '-' }}</td>
              <td><span class="badge badge-info">{{ sede.tipo }}</span></td>
              <td>
                <span class="badge" :class="sede.activo ? 'badge-success' : 'badge-secondary'">
                  {{ sede.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL NUEVA ZONAL (Simulado por ahora) -->
    <Modal v-model="showModalZonal" titulo="Nueva Dirección Zonal" @guardar="guardarZonal">
      <p>Funcionalidad de creación en desarrollo.</p>
    </Modal>

     <!-- MODAL NUEVA SEDE (Simulado por ahora) -->
    <Modal v-model="showModalSede" titulo="Nueva Sede / CFP" @guardar="guardarSede">
      <p>Funcionalidad de creación en desarrollo.</p>
    </Modal>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../services/api'
import Modal from '../components/Modal.vue'
import { inject } from 'vue'

const toast = inject('toast')

// Estados
const activeTab = ref('zonales') // 'zonales' | 'sedes'
const loading = ref(false)
const zonales = ref([])
const sedes = ref([])
const filtroZonal = ref("")

// Modals
const showModalZonal = ref(false)
const showModalSede = ref(false)

// Init
onMounted(async () => {
  await cargarZonales()
  await cargarSedes() // Carga inicial de todas
})

// === LOGICA ZONALES ===
const cargarZonales = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/ubicaciones/zonales')
    zonales.value = data
  } catch (error) {
    toast.error('Error', 'No se pudieron cargar las zonales')
  } finally {
    loading.value = false
  }
}

const abrirModalZonal = () => {
  toast.info('Info', 'Edición disponible próximamente')
  // showModalZonal.value = true
}

const guardarZonal = () => {
  showModalZonal.value = false
}

// === LOGICA SEDES ===
const cargarSedes = async () => {
  loading.value = true
  try {
    // Si hay filtro, pasarlo como query param
    const url = filtroZonal.value 
      ? `/ubicaciones/sedes?zonal=${filtroZonal.value}`
      : '/ubicaciones/sedes'
      
    const { data } = await api.get(url)
    sedes.value = data
  } catch (error) {
    toast.error('Error', 'No se pudieron cargar las sedes')
  } finally {
    loading.value = false
  }
}

const filtrarSedes = () => {
  cargarSedes()
}

// Computada temporal si quisiéramos filtrar en cliente, 
// pero mejor filtramos en backend como ya implementé.
const sedesFiltradas = computed(() => sedes.value)

const abrirModalSede = () => {
  toast.info('Info', 'Edición disponible próximamente')
  // showModalSede.value = true
}

const guardarSede = () => {
  showModalSede.value = false
}

</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-section h1 {
  width: 100%;
  margin-bottom: 0.5rem;
}

.tabs-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1px;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: var(--gray);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.tab-btn:hover {
  color: var(--primary);
  background: var(--light-gray);
  border-radius: 4px 4px 0 0;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filters select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  min-width: 200px;
}
</style>
