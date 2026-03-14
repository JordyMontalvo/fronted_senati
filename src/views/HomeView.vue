<template>
  <div class="home-container">
    <!-- Hero Section -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="badge-premium">Inteligencia y Eficiencia</div>
        <h1 class="hero-title">Gestión Inteligente de <span class="text-gradient">Horarios</span></h1>
        <p class="hero-subtitle">Optimizando la carga académica con tecnología de vanguardia para SENATI.</p>
        <div class="hero-stats">
          <div class="mini-stat">
            <span class="num">{{ carreras.length }}</span>
            <span class="label">Carreras</span>
          </div>
          <div class="mini-stat">
            <span class="num">{{ cursos.length }}</span>
            <span class="label">Cursos</span>
          </div>
          <div class="mini-stat">
            <span class="num">{{ profesores.length }}</span>
            <span class="label">Docentes</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="abstract-shape shape-1"></div>
        <div class="abstract-shape shape-2"></div>
      </div>
    </header>

    <!-- Main Actions Grid -->
    <section class="actions-section">
      <h2 class="section-title">Panel de Control</h2>
      <div class="actions-grid">
        <!-- Asignar Horarios -->
        <router-link to="/horarios/gestionar" class="glass-card action-card">
          <div class="card-glow"></div>
          <div class="icon-box primary">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="card-body">
            <h3>Asignar Horarios</h3>
            <p>Configuración manual detallada de bloques, aulas y docentes con validación de conflictos en tiempo real.</p>
          </div>
          <div class="card-footer">
            <span class="btn-text">Gestionar ahora</span>
            <div class="arrow-icon">→</div>
          </div>
        </router-link>

        <!-- Importar IA -->
        <router-link to="/importar-excel" class="glass-card action-card special">
          <div class="card-glow"></div>
          <div class="badge-top">Inteligencia Artificial</div>
          <div class="icon-box ai">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="card-body">
            <h3>Importar con IA</h3>
            <p>Sube tu archivo Excel y nuestro algoritmo inteligente se encargará de organizar toda la malla horaria por ti.</p>
          </div>
          <div class="card-footer">
            <span class="btn-text">Probar IA</span>
            <div class="arrow-icon">→</div>
          </div>
        </router-link>

        <!-- Reportes -->
        <router-link to="/reportes" class="glass-card action-card">
          <div class="card-glow"></div>
          <div class="icon-box secondary">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="card-body">
            <h3>Analítica & Reportes</h3>
            <p>Visualiza KPIs críticos, disponibilidad de aulas y exporta reportes en PDF para auditoría académica.</p>
          </div>
          <div class="card-footer">
            <span class="btn-text">Ver análisis</span>
            <div class="arrow-icon">→</div>
          </div>
        </router-link>
      </div>
    </section>

    <!-- Visualización Rápida (Placeholder for intuitive UX) -->
    <section class="quick-access">
      <div class="glass-card info-card">
        <div class="info-icon">💡</div>
        <div class="info-content">
          <h4>¿Problemas con los cruces?</h4>
          <p>Utiliza el <strong>Chatbot Asistente</strong> en la esquina inferior para resolver dudas o buscar horarios rápidamente.</p>
        </div>
      </div>
    </section>
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
.home-container {
  padding: 1rem 0;
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hero Section */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  padding: 4rem 0;
  margin-bottom: 3rem;
  position: relative;
}

.hero-content {
  flex: 1;
  max-width: 650px;
}

.badge-premium {
  display: inline-block;
  background: rgba(242, 101, 34, 0.1);
  color: var(--accent);
  padding: 0.5rem 1.25rem;
  border-radius: 2rem;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 2rem;
  border: 1px solid rgba(242, 101, 34, 0.2);
}

.hero-title {
  font-size: 4rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin-bottom: 1.5rem;
  color: var(--text-main);
}

.text-gradient {
  background: linear-gradient(135deg, var(--accent), #FF8E53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 3rem;
}

.hero-stats {
  display: flex;
  gap: 3rem;
}

.mini-stat {
  display: flex;
  flex-direction: column;
}

.mini-stat .num {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-main);
}

.mini-stat .label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

/* Hero Visual Animation */
.hero-visual {
  flex: 1;
  position: relative;
  height: 400px;
  display: none; /* Hidden on small screens */
}

@media (min-width: 1024px) {
  .hero-visual { display: block; }
}

.abstract-shape {
  position: absolute;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  filter: blur(40px);
  opacity: 0.3;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: var(--primary);
  top: 0;
  right: 0;
  animation: morph 15s linear infinite alternate;
}

.shape-2 {
  width: 250px;
  height: 250px;
  background: var(--accent);
  bottom: 0;
  left: 0;
  animation: morph 12s linear infinite alternate-reverse;
}

@keyframes morph {
  0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  100% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
}

/* Actions Section */
.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
}

.action-card:hover {
  transform: translateY(-10px);
  border-color: var(--accent);
  box-shadow: var(--shadow-lg);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(242, 101, 34, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.action-card:hover .card-glow {
  opacity: 1;
}

.icon-box {
  width: 60px;
  height: 60px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  color: white;
}

.icon-box.primary { background: linear-gradient(135deg, #00428B, #2968B8); }
.icon-box.ai      { background: linear-gradient(135deg, #F26522, #FF8E53); }
.icon-box.secondary { background: linear-gradient(135deg, #10b981, #059669); }

.card-body h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: var(--text-main);
}

.card-body p {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.btn-text {
  font-weight: 700;
  color: var(--text-main);
  font-size: 0.9rem;
}

.arrow-icon {
  width: 32px;
  height: 32px;
  background: var(--bg-main);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.action-card:hover .arrow-icon {
  background: var(--accent);
  color: white;
  transform: rotate(-45deg);
}

.badge-top {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(242, 101, 34, 0.1);
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  text-transform: uppercase;
}

/* Quick Access */
.quick-access .info-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: linear-gradient(to right, var(--bg-card), var(--glass-bg));
  border: 1px dashed var(--border);
}

.info-icon { font-size: 2rem; }
.info-content h4 { font-weight: 800; margin-bottom: 0.25rem; }
.info-content p { color: var(--text-muted); font-size: 0.9rem; }

@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
  .hero-section { padding: 2rem 0; text-align: center; }
  .hero-stats { justify-content: center; gap: 1.5rem; }
  .actions-grid { grid-template-columns: 1fr; }
}
</style>
