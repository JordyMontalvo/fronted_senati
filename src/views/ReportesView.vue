<template>
  <div class="reportes-view">
    <div class="header-actions">
      <h1>📊 Centro de Reportes Académicos</h1>
      <div class="actions">
        <!-- <button class="btn btn-secondary" @click="exportarExcel">
          📥 Excel
        </button> -->
        <button class="btn btn-primary" @click="exportarPDF" :disabled="loading || horariosFiltrados.length === 0">
          📄 Exportar PDF
        </button>
      </div>
    </div>

    <!-- Filtros Globales -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="filter-group">
          <label>☀️ Turno</label>
          <select v-model="filtros.turno">
            <option value="">Todos los Turnos</option>
            <option v-for="t in turnos" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>🎓 Carrera</label>
          <select v-model="filtros.carrera">
            <option value="">Todas las Carreras</option>
            <option v-for="carrera in carreras" :key="carrera._id" :value="carrera._id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>📅 Semestre</label>
          <select v-model="filtros.semestre">
            <option value="">Todos</option>
            <option v-for="sem in [1, 2, 3, 4, 5, 6]" :key="sem" :value="sem">
              Semestre {{ sem }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>👨‍🏫 Profesor</label>
          <select v-model="filtros.profesor">
            <option value="">Todos los Profesores</option>
            <option v-for="prof in profesores" :key="prof._id" :value="prof._id">
              {{ prof.apellidos }}, {{ prof.nombres }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="active-filters" v-if="filtrosActivosCount > 0">
        <span class="filter-badge">
          Filtros activos: {{ filtrosActivosCount }}
          <button @click="limpiarFiltros" class="btn-clear">✕</button>
        </span>
      </div>
    </div>

    <!-- Tarjetas de Resumen (KPIs) -->
    <div class="stats-grid">
      <div class="stat-card blue">
        <div class="stat-icon">🕒</div>
        <div class="stat-content">
          <h3>{{ stats.totalHoras }}</h3>
          <p>Horas Asignadas</p>
        </div>
      </div>
      
      <div class="stat-card orange">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <h3>{{ stats.totalCursos }}</h3>
          <p>Cursos Distintos</p>
        </div>
      </div>
      
      <div class="stat-card green">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <h3>{{ stats.totalProfesores }}</h3>
          <p>Profesores Activos</p>
        </div>
      </div>
      
      <div class="stat-card purple">
        <div class="stat-icon">🚪</div>
        <div class="stat-content">
          <h3>{{ stats.totalAulas }}</h3>
          <p>Aulas Ocupadas</p>
        </div>
      </div>
    </div>

    <!-- Tabla Detallada -->
    <div class="card result-card">
      <div class="card-header">
        <h3>📋 Detalle de Asignaciones ({{ horariosFiltrados.length }} registros)</h3>
      </div>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
      </div>
      
      <div v-else-if="horariosFiltrados.length === 0" class="empty-state">
        <p>No se encontraron horarios con los filtros seleccionados.</p>
      </div>
      
      <div v-else class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Día/Hora</th>
              <th>Curso</th>
              <th>Profesor</th>
              <th>Aula</th>
              <th>Bloque</th>
              <th>Carrera</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in horariosPaginados" :key="h._id">
              <td>
                <div class="dia-badge">{{ h.diaSemana }}</div>
                <div class="hora-text">{{ h.horaInicio }} - {{ h.horaFin }}</div>
              </td>
              <td>
                <div class="curso-nombre">{{ h.asignacion?.curso?.nombre || 'Sin curso' }}</div>
                <div class="semestre-tag">Sem {{ h.asignacion?.bloque?.semestre }}</div>
              </td>
              <td>
                <div class="profesor-nombre">{{ h.asignacion?.profesor?.apellidos }} {{ h.asignacion?.profesor?.nombres }}</div>
              </td>
              <td>
                <div class="aula-tag" :class="h.aula?.tipo === 'Laboratorio' ? 'lab' : 'teo'">
                  {{ h.aula?.codigo || 'Virtual' }}
                </div>
                <!-- <div class="sede-text">{{ h.aula?.sede?.nombre }}</div> -->
              </td>
              <td>{{ h.asignacion?.bloque?.codigo }}</td>
              <td>{{ h.asignacion?.bloque?.carrera?.nombre || 'General' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Paginación Simple -->
      <div class="pagination" v-if="horariosFiltrados.length > itemsPerPage">
        <button :disabled="currentPage === 1" @click="currentPage--">Anterior</button>
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">Siguiente</button>
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
// const sedes = ref([]) // Eliminado por error 500
const carreras = ref([])
const profesores = ref([])

const turnos = ['Mañana', 'Tarde', 'Noche']

const filtros = reactive({
  turno: '', // Reemplaza a sede
  carrera: '',
  semestre: '',
  profesor: ''
})

// Paginación
const currentPage = ref(1)
const itemsPerPage = 20

// Carga Inicial
onMounted(async () => {
  try {
    loading.value = true
    // Cargar catálogos (Quitamos sedes que fallaba)
    const [resHorarios, resCarreras, resProfesores] = await Promise.all([
      api.get('/horarios'),
      api.get('/carreras'),
      api.get('/profesores')
    ])
    
    // Normalizar respuestas (algunas pueden venir en .data o .data.data)
    horarios.value = resHorarios.data.data || resHorarios.data || []
    carreras.value = resCarreras.data.data || resCarreras.data || []
    profesores.value = resProfesores.data.data || resProfesores.data || []
    
  } catch (error) {
    console.error('Error cargando datos:', error)
  } finally {
    loading.value = false
  }
})

// Filtrado
const horariosFiltrados = computed(() => {
  return horarios.value.filter(h => {
    // Filtro Turno (Nuevo)
    if (filtros.turno) {
       // El turno suele estar en el bloque (subPeriodo o turno) o inferirse de la hora
       // Usaremos la hora de inicio para inferir si no está explícito
       const hora = parseInt(h.horaInicio.split(':')[0]);
       let turnoDetectado = 'Mañana';
       if (hora >= 13 && hora < 18) turnoDetectado = 'Tarde';
       if (hora >= 18) turnoDetectado = 'Noche';
       
       // También verificamos si el bloque tiene la propiedad explícita
       const turnoBloque = h.asignacion?.bloque?.subPeriodo || h.asignacion?.bloque?.turno;
       
       // Coincidencia laxa (compara lo detectado o lo del bloque)
       const coincide = (turnoBloque && turnoBloque.toLowerCase().includes(filtros.turno.toLowerCase())) ||
                        (turnoDetectado.toLowerCase() === filtros.turno.toLowerCase());
                        
       if (!coincide) return false;
    }
    
    // Filtro Carrera (A través del Bloque -> Carrera)
    if (filtros.carrera) {
      // Si no tenemos bloque o carrera, no podemos filtrar, retornar falso si hay filtro activo      
      if (!h.asignacion?.bloque?.carrera) return false
      
      const carreraObj = h.asignacion.bloque.carrera
      const carreraId = carreraObj._id || carreraObj
      
      if (carreraId?.toString() !== filtros.carrera) return false
    }
    
    // Filtro Semestre (A través del Bloque)
    if (filtros.semestre) {
      if (!h.asignacion?.bloque?.semestre) return false
      if (parseInt(h.asignacion.bloque.semestre) !== parseInt(filtros.semestre)) return false
    }
    
    // Filtro Profesor
    if (filtros.profesor) {
      // Si no hay profesor asignado, excluimos si se filtra por uno específico
      if (!h.asignacion?.profesor) return false
      
      const profId = h.asignacion.profesor._id || h.asignacion.profesor
      if (profId?.toString() !== filtros.profesor) return false
    }
    
    return true
  })
})

const filtrosActivosCount = computed(() => {
  return Object.values(filtros).filter(v => v).length
})

const limpiarFiltros = () => {
  filtros.turno = ''
  filtros.carrera = ''
  filtros.semestre = ''
  filtros.profesor = ''
}

// Estadísticas Computadas
const stats = computed(() => {
  const data = horariosFiltrados.value
  
  // Total Horas (estimado por duración de slots)
  // Simplificación: Diferencia de horas
  let totalMinutos = 0
  const cursosUnicos = new Set()
  const profesoresUnicos = new Set()
  const aulasUnicas = new Set()
  
  data.forEach(h => {
    // Calcular duración
    const [hInicio, mInicio] = h.horaInicio.split(':').map(Number)
    const [hFin, mFin] = h.horaFin.split(':').map(Number)
    const duracion = (hFin * 60 + mFin) - (hInicio * 60 + mInicio)
    totalMinutos += duracion
    
    // Sets únicos
    if (h.asignacion?.curso?._id) cursosUnicos.add(h.asignacion.curso._id)
    if (h.asignacion?.profesor?._id) profesoresUnicos.add(h.asignacion.profesor._id)
    if (h.aula?._id) aulasUnicas.add(h.aula._id)
  })
  
  // Convertir a horas (aprox)
  const totalHoras = Math.round(totalMinutos / 45) // Horas académicas (45 min) o 60 para cronológicas
  
  return {
    totalHoras: totalHoras, // Horas académicas aprox
    totalCursos: cursosUnicos.size,
    totalProfesores: profesoresUnicos.size,
    totalAulas: aulasUnicas.size
  }
})

// Paginación
const totalPages = computed(() => Math.ceil(horariosFiltrados.value.length / itemsPerPage))
const horariosPaginados = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return horariosFiltrados.value.slice(start, start + itemsPerPage)
})

// Exportar PDF
const exportarPDF = () => {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(18)
  doc.setTextColor(0, 66, 139)
  doc.text('Reporte de Horarios y Carga Académica', 14, 20)
  
  // Metadatos
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 28)
  
  // Resumen
  doc.setFillColor(240, 240, 240)
  doc.rect(14, 32, 180, 20, 'F')
  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text(`Horas Totales: ${stats.value.totalHoras}`, 20, 45)
  doc.text(`Cursos: ${stats.value.totalCursos}`, 70, 45)
  doc.text(`Profesores: ${stats.value.totalProfesores}`, 110, 45)
  doc.text(`Aulas: ${stats.value.totalAulas}`, 150, 45)
  
  // Tabla
  const tableData = horariosFiltrados.value.map(h => [
    `${h.diaSemana}\n${h.horaInicio}-${h.horaFin}`,
    h.asignacion?.curso?.nombre || '-',
    `${h.asignacion?.profesor?.apellidos || ''} ${h.asignacion?.profesor?.nombres?.charAt(0) || ''}.`,
    h.aula?.codigo || '-',
    h.asignacion?.bloque?.codigo || '-',
    h.asignacion?.bloque?.carrera?.nombre?.substring(0, 20) + '...' || '-'
  ])
  
  doc.autoTable({
    head: [['Día/Hora', 'Curso', 'Profesor', 'Aula', 'Bloque', 'Carrera']],
    body: tableData,
    startY: 60,
    theme: 'grid',
    headStyles: { fillColor: [0, 66, 139] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      5: { cellWidth: 35 }
    }
  })
  
  doc.save('reporte-senati.pdf')
}
</script>

<style scoped>
.reportes-view {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dark);
}

.filter-group select {
  padding: 0.6rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background-color: #f8fafc;
}

.active-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #e0f2fe;
  color: #0284c7;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-weight: bold;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 4px solid transparent;
}

.stat-card.blue { border-color: #3b82f6; }
.stat-card.orange { border-color: #f97316; }
.stat-card.green { border-color: #10b981; }
.stat-card.purple { border-color: #8b5cf6; }

.stat-icon {
  font-size: 2rem;
  background: #f1f5f9;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.stat-content h3 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--dark);
}

.stat-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Table */
.result-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 1rem 1.5rem;
  text-align: left;
}

.table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.table tr:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.dia-badge {
  font-weight: 600;
  color: var(--primary);
}

.hora-text {
  font-size: 0.85rem;
  color: #64748b;
}

.curso-nombre {
  font-weight: 500;
}

.semestre-tag {
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.25rem;
}

.aula-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.aula-tag.lab {
  background: #dbeafe;
  color: #1e40af;
}

.aula-tag.teo {
  background: #f3f4f6;
  color: #374151;
}

.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  border-top: 1px solid var(--border);
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
</style>
