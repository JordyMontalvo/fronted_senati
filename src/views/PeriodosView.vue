<template>
  <div class="periodos-view fadeIn">
    <div class="page-header">
      <div class="header-content">
        <h1 class="text-gradient">📅 Periodos Académicos</h1>
        <p>Configuración de períodos lectivos y ventanas de programación</p>
      </div>
      <button class="btn btn-premium" @click="abrirModalNuevo">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
          <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Nuevo Ciclo</span>
      </button>
    </div>

    <!-- Grid de Períodos Premium -->
    <div v-if="loading" class="state-container">
      <div class="spinner-modern"></div>
      <p>Consultando cronogramas académicos...</p>
    </div>

    <div v-else class="periodos-grid">
      <div 
        v-for="periodo in periodosPaginados" 
        :key="periodo._id" 
        class="periodo-glass-card"
        :class="{ 'is-active': periodo.estado === 'activo' }"
      >
        <div class="card-glow" v-if="periodo.estado === 'activo'"></div>
        
        <div class="periodo-top">
          <div class="p-icon-box">📅</div>
          <span :class="['state-badge', periodo.estado]">
            {{ periodo.estado === 'activo' ? 'Ciclo Actual' : periodo.estado }}
          </span>
        </div>

        <div class="periodo-body">
          <span class="p-code">{{ periodo.codigo }}</span>
          <h3>{{ periodo.nombre }}</h3>

          <div class="timeline-box">
            <div class="time-block">
              <span class="lab">Apertura</span>
              <span class="date">{{ formatearFecha(periodo.fechaInicio) }}</span>
            </div>
            <div class="time-arrow">→</div>
            <div class="time-block end">
              <span class="lab">Cierre</span>
              <span class="date">{{ formatearFecha(periodo.fechaFin) }}</span>
            </div>
          </div>
        </div>

        <div class="periodo-footer">
          <button class="action-btn-p secondary" @click="editarPeriodo(periodo)">Configurar</button>
          <button class="action-btn-p danger" @click="eliminarPeriodo(periodo)">Eliminar</button>
        </div>
      </div>

      <div v-if="periodos.length === 0" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No hay calendarios configurados</h3>
        <p>Los períodos son la base de toda la programación. Crea el primer ciclo académico para comenzar.</p>
        <button class="btn btn-primary" @click="abrirModalNuevo">
          Configurar Primer Ciclo
        </button>
      </div>
    </div>

    <!-- Paginación -->
    <div class="pagination-wrapper">
      <Pagination 
        v-if="periodos.length > 0"
        :current-page="paginaActual"
        :per-page="porPagina"
        :total="periodos.length"
        @update:current-page="paginaActual = $event"
      />
    </div>

    <!-- Modal Moderno -->
    <Modal
      v-model="mostrarModal"
      :titulo="periodoEditando ? 'Actualizar Ciclo' : 'Nuevo Ciclo Académico'"
      :loading="guardando"
      @guardar="guardarPeriodo"
    >
      <form @submit.prevent="guardarPeriodo" class="form-modal">
        <div class="form-group">
          <label>Identificador de Período *</label>
          <input v-model="formulario.codigo" type="text" class="form-input" placeholder="Ej: 202610" required>
        </div>

        <div class="form-group">
          <label>Nombre Descriptivo *</label>
          <input v-model="formulario.nombre" type="text" class="form-input" placeholder="Ej: Período 2026-1" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Inicio de Ciclo *</label>
            <input v-model="formulario.fechaInicio" type="date" class="form-input" required>
          </div>
          <div class="form-group">
            <label>Término de Ciclo *</label>
            <input v-model="formulario.fechaFin" type="date" class="form-input" required>
          </div>
        </div>

        <div class="form-group">
          <label>Estado de la Ventana</label>
          <select v-model="formulario.estado" class="form-input" required>
            <option value="planificado">Planificación (Cerrado)</option>
            <option value="activo">Activo (Abierto)</option>
            <option value="cerrado">Histórico (Archivado)</option>
          </select>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { periodosService } from '../services'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const periodos = ref([])
const loading = ref(false)
const guardando = ref(false)
const mostrarModal = ref(false)
const periodoEditando = ref(null)
const paginaActual = ref(1)
const porPagina = ref(12)

const formulario = ref({
  codigo: '', nombre: '', fechaInicio: '', fechaFin: '', estado: 'planificado'
})

// Automatización de 16 semanas para nuevos periodos
watch(() => formulario.value.fechaInicio, (newVal) => {
  if (newVal && !formulario.value.fechaFin) {
    const d = new Date(newVal)
    const endDate = new Date(d.getTime())
    endDate.setDate(endDate.getDate() + (16 * 7) - 1)
    formulario.value.fechaFin = endDate.toISOString().split('T')[0]
  }
})

const periodosPaginados = computed(() => {
  const skip = (paginaActual.value - 1) * porPagina.value
  return periodos.value.slice(skip, skip + porPagina.value)
})

function formatearFecha(fecha) {
  if (!fecha) return '---'
  return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function abrirModalNuevo() {
  periodoEditando.value = null
  formulario.value = { codigo: '', nombre: '', fechaInicio: '', fechaFin: '', estado: 'planificado' }
  mostrarModal.value = true
}

function editarPeriodo(periodo) {
  periodoEditando.value = periodo
  formulario.value = {
    codigo: periodo.codigo,
    nombre: periodo.nombre,
    fechaInicio: periodo.fechaInicio ? periodo.fechaInicio.split('T')[0] : '',
    fechaFin: periodo.fechaFin ? periodo.fechaFin.split('T')[0] : '',
    estado: periodo.estado
  }
  mostrarModal.value = true
}

async function guardarPeriodo() {
  try {
    guardando.value = true
    if (periodoEditando.value) await periodosService.update(periodoEditando.value._id, formulario.value)
    else await periodosService.create(formulario.value)
    await cargarPeriodos()
    mostrarModal.value = false
  } catch (err) { console.error(err) }
  finally { guardando.value = false }
}

async function eliminarPeriodo(periodo) {
  if (!confirm(`¿Eliminar período "${periodo.nombre}"?`)) return
  try {
    await periodosService.delete(periodo._id)
    await cargarPeriodos()
  } catch (err) { console.error(err) }
}

async function cargarPeriodos() {
  try {
    loading.value = true
    const response = await periodosService.getAll()
    periodos.value = (response.data.data || []).sort((a, b) => {
      if (a.estado === 'activo') return -1
      return new Date(b.fechaInicio) - new Date(a.fechaInicio)
    })
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

onMounted(() => cargarPeriodos())
</script>

<style scoped>
.periodos-view { max-width: 1400px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
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

.periodos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem; margin-bottom: 3rem; }

.periodo-glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.periodo-glass-card.is-active { border-color: var(--accent); background: rgba(242, 101, 34, 0.05); }
.card-glow { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 50% 0%, rgba(242, 101, 34, 0.2), transparent 70%); border-radius: 1.5rem; pointer-events: none; }

.periodo-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.p-icon-box { font-size: 1.5rem; background: rgba(255,255,255,0.05); padding: 0.6rem; border-radius: 1rem; }

.state-badge { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
.state-badge.activo { background: #10b981; color: white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
.state-badge.planificado { background: #f59e0b; color: white; }
.state-badge.cerrado { background: #64748b; color: white; }

.p-code { font-size: 1.5rem; font-weight: 900; color: var(--accent); display: block; }
.periodo-body h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 1.5rem; }

.timeline-box { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  background: rgba(0,0,0,0.15); 
  padding: 1rem; 
  border-radius: 1.25rem; 
  margin-bottom: 1.5rem; 
}
.time-block { display: flex; flex-direction: column; }
.time-block .lab { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); }
.time-block .date { font-size: 0.85rem; font-weight: 700; }
.time-arrow { color: var(--accent); font-weight: 900; }

.periodo-footer { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.action-btn-p { padding: 0.75rem; border-radius: 1rem; border: 1px solid var(--border); background: var(--bg-main); font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.action-btn-p.secondary:hover { border-color: var(--accent); color: var(--accent); }
.action-btn-p.danger:hover { background: #ef4444; color: white; border-color: #ef4444; }

@media (max-width: 768px) {
  .periodos-grid { grid-template-columns: 1fr; }
}
</style>
