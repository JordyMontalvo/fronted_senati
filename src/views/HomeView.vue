<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">Sistema de Gestión de Horarios</h1>
      <p class="hero-subtitle">SENATI - Instituto de Educación Superior</p>
    </div>

    <div class="actions-grid main-actions">
      <!-- Card 1: Asignación de Horarios -->
      <router-link to="/horarios/gestionar" class="action-card primary-action">
        <div class="action-icon">
          <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h3>Asignar Horarios</h3>
        <p>Gestiona y asigna horarios a bloques, aulas y profesores.</p>
        <span class="action-arrow">→</span>
      </router-link>

      <!-- Card 2: Importar Bloques (IA) -->
      <router-link to="/importar-excel" class="action-card ai-action">
        <div class="action-icon ai-icon">
          <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="badge-new">Nuevo ✨</div>
        <h3>Importar Bloques (IA)</h3>
        <p>Sube tu Excel y deja que la IA organice los horarios automáticamente.</p>
        <span class="action-arrow">→</span>
      </router-link>

      <!-- Card 3: Reportes (Nuevos próximamente) -->
      <div class="action-card disabled-action">
        <div class="action-icon">
          <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
          </svg>
        </div>
        <h3>Reportes</h3>
        <p>Próximamente: Estadísticas detalladas y exportación de datos.</p>
        <span class="badge-soon">Pronto</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const carreras = computed(() => store.carreras)
const cursos = computed(() => store.cursos)
const bloques = computed(() => store.bloques)
const profesores = computed(() => store.profesores)

onMounted(async () => {
  await Promise.all([
    store.fetchCarreras(),
    store.fetchCursos(),
    store.fetchBloques(),
    store.fetchProfesores()
  ])
})
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 2rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--gray);
}

.main-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.action-card {
  position: relative;
  background: var(--white);
  border-radius: 1.5rem;
  padding: 2.5rem;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100%;
}

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.primary-action {
  background: linear-gradient(145deg, #ffffff, #f3f4f6);
}

.ai-action {
  background: linear-gradient(145deg, #f0fdf4, #ffffff);
  border: 1px solid #bbf7d0;
}

.ai-action:hover {
  border-color: #22c55e;
  box-shadow: 0 10px 25px -5px rgba(34, 197, 94, 0.2);
}

.disabled-action {
  opacity: 0.7;
  cursor: not-allowed;
  background: #f9fafb;
}

.disabled-action:hover {
  transform: none;
  box-shadow: var(--shadow);
  border-color: var(--border);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.ai-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.action-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--dark);
}

.action-card p {
  color: var(--gray);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  flex: 1;
}

.action-arrow {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: auto;
  transition: transform 0.2s;
}

.action-card:hover .action-arrow {
  transform: translateX(6px);
}

.badge-new {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: #dcfce7;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.badge-soon {
  display: inline-block;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  margin-top: auto;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.875rem;
  }

  .main-actions {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
}
</style>
