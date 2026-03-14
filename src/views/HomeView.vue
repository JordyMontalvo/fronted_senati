<template>
  <div class="home-view">
    <!-- Hero Section: Immersive Experience -->
    <header class="hero-bento">
      <div class="bento-main glass-card">
        <div class="hero-badge">Plataforma Oficial 2025</div>
        <h1 class="hero-title">Sistema de Programación <span class="text-gradient">Académica</span></h1>
        <p class="hero-desc">La arquitectura inteligente para la gestión de horarios y recursos de SENATI. Diseñado para la precisión y el alto rendimiento académico.</p>
        
        <div class="hero-actions">
          <router-link to="/horarios/gestionar" class="btn btn-primary-premium">
            <span>Comenzar Programación</span>
            <div class="btn-glow"></div>
          </router-link>
          <router-link to="/reportes" class="btn btn-secondary-premium">
            Ver Analítica
          </router-link>
        </div>
      </div>

      <div class="bento-stats glass-card">
        <h3>Estado del Sistema</h3>
        <div class="stat-items">
          <div class="stat-item">
            <div class="stat-value">{{ carreras.length }}</div>
            <div class="stat-label">Carreras</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ cursos.length }}</div>
            <div class="stat-label">Cursos</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ profesores.length }}</div>
            <div class="stat-label">Docentes</div>
          </div>
        </div>
        <div class="pulse-container">
          <span class="pulse-dot"></span>
          <span class="pulse-text">Servidor en línea - Usando MongoDB</span>
        </div>
      </div>
    </header>

    <!-- Features Bento Grid -->
    <section class="features-grid">
      <router-link to="/horarios/gestionar" class="feature-card glass-card span-2 highlight">
        <div class="feature-icon">⚡</div>
        <div class="feature-info">
          <h3>Asignación Inteligente</h3>
          <p>Motor de validación en tiempo real para detección de cruces de aulas y docentes.</p>
        </div>
        <div class="feature-visual">
          <div class="grid-line"></div>
          <div class="grid-line"></div>
          <div class="grid-line"></div>
        </div>
      </router-link>

      <router-link to="/horarios/visuales" class="feature-card glass-card">
        <div class="feature-icon">📅</div>
        <div class="feature-info">
          <h3>Vista Maestra</h3>
          <p>Explora la malla horaria completa por bloques y días.</p>
        </div>
      </router-link>

      <router-link to="/importar-excel" class="feature-card glass-card special-ai">
        <div class="ai-badge">Nuevo</div>
        <div class="feature-icon">🤖</div>
        <div class="feature-info">
          <h3>Importar con IA</h3>
          <p>Procesamiento masivo de datos mediante algoritmos predictivos.</p>
        </div>
      </router-link>

      <router-link to="/reportes" class="feature-card glass-card span-2">
        <div class="feature-icon">📊</div>
        <div class="feature-info">
          <h3>Generador de Reportes</h3>
          <p>Exportación profesional a PDF de cargas académicas y disponibilidad de infraestructura.</p>
        </div>
      </router-link>
    </section>

    <!-- Intelligent Assistant Card -->
    <div class="assistant-promo glass-card">
      <div class="assistant-content">
        <div class="assistant-icon-large">🎙️</div>
        <div class="assistant-text">
          <h3>¿Necesitas ayuda técnica?</h3>
          <p>Nuestro asistente <strong>Sify</strong> está entrenado para ayudarte con cualquier duda sobre la lógica de horarios.</p>
        </div>
      </div>
      <button @click="abrirChat" class="btn btn-assistant">Hablar con Sify</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const carreras = computed(() => store.carreras || [])
const cursos = computed(() => store.cursos || [])
const profesores = computed(() => store.profesores || [])

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchCarreras(),
      store.fetchCursos(),
      store.fetchBloques(),
      store.fetchProfesores()
    ])
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error)
  }
})

function abrirChat() {
  const chatbot = document.querySelector('.chatbot-trigger')
  if (chatbot) chatbot.click()
}
</script>

<style scoped>
.home-view {
  animation: viewSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@keyframes viewSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Bento Hero Section */
.hero-bento {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.bento-main {
  padding: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-badge {
  background: var(--accent);
  color: white;
  width: fit-content;
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 1.5rem;
  letter-spacing: -2px;
}

.hero-desc {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 500px;
  line-height: 1.6;
  margin-bottom: 3rem;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
}

.btn-primary-premium {
  background: var(--primary);
  color: white;
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 800;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.btn-primary-premium:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px var(--primary-glow);
}

.btn-secondary-premium {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 800;
  transition: all 0.3s;
}

.btn-secondary-premium:hover {
  background: rgba(255,255,255,0.05);
  border-color: var(--text-main);
}

/* Stats Bento */
.bento-stats {
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.bento-stats h3 {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 2rem;
}

.stat-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--primary);
}

.dark-mode .stat-value { color: var(--accent); }

.stat-label {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pulse-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.pulse-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #10b981;
  text-transform: uppercase;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.span-2 { grid-column: span 2; }

.feature-card {
  padding: 2.5rem;
  position: relative;
  text-decoration: none;
  color: inherit;
  overflow: hidden;
}

.feature-card:hover {
  transform: scale(1.02);
  border-color: var(--accent);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.feature-info h3 {
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 0.75rem;
}

.feature-info p {
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.95rem;
}

.special-ai {
  background: linear-gradient(135deg, rgba(242, 101, 34, 0.1), transparent);
}

.ai-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--accent);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
}

/* Assistant Promo */
.assistant-promo {
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, var(--primary), var(--secondary));
  color: white;
  border: none;
}

.assistant-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.assistant-icon-large {
  font-size: 3rem;
  background: rgba(255,255,255,0.1);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.assistant-text h3 { font-size: 1.5rem; margin-bottom: 0.25rem; font-weight: 900; }
.assistant-text p { opacity: 0.8; font-weight: 500; }

.btn-assistant {
  background: white;
  color: var(--primary);
  border: none;
  padding: 1rem 2rem;
  border-radius: var(--radius-md);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-assistant:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(255,255,255,0.2);
}

@media (max-width: 1200px) {
  .hero-bento { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr 1fr; }
  .span-2 { grid-column: span 1; }
}

@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
  .assistant-promo { flex-direction: column; text-align: center; gap: 2rem; }
  .hero-title { font-size: 2.5rem; }
}
</style>

