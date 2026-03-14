<template>
  <div id="app" :class="{ 'dark-mode': isDark }">
    <!-- Modern Glassmorphism Navbar -->
    <header class="navbar" :class="{ 'scrolled': isScrolled }">
      <div class="navbar-content">
        <!-- Logo/Brand -->
        <div class="brand" @click="$router.push('/')">
          <div class="logo-wrapper">
            <div class="logo-cube">
              <div class="side front"></div>
              <div class="side top"></div>
              <div class="side right"></div>
            </div>
            <div class="logo-glow"></div>
          </div>
          <div class="brand-text">
            <span class="brand-title">SENATI</span>
            <span class="brand-subtitle">Smart Schedules</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="nav-tabs">
          <router-link v-for="link in navLinks" :key="link.path" :to="link.path" class="nav-tab">
            <div class="tab-icon" v-html="link.icon"></div>
            <span class="tab-label">{{ link.label }}</span>
          </router-link>
        </nav>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Modo Claro' : 'Modo Oscuro'">
            <div class="toggle-track">
              <div class="toggle-thumb">
                <span v-if="isDark">🌙</span>
                <span v-else>☀️</span>
              </div>
            </div>
          </button>
          <div class="user-profile">
            <div class="status-indicator"></div>
            <div class="avatar">JM</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Background Elements -->
    <div class="mesh-background">
      <div class="mesh-blob blob-1"></div>
      <div class="mesh-blob blob-2"></div>
      <div class="mesh-blob blob-3"></div>
    </div>

    <!-- Contenido Principal -->
    <main class="main-container">
      <RouterView v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <ToastNotification ref="toastRef" />
    <ChatbotHorarios />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { onMounted, ref, provide, watch } from 'vue'
import { useAppStore } from './stores/app'
import ToastNotification from './components/ToastNotification.vue'
import ChatbotHorarios from './components/ChatbotHorarios.vue'

const store = useAppStore()
const toastRef = ref(null)
const isDark = ref(localStorage.getItem('theme') !== 'light')
const isScrolled = ref(false)

const navLinks = [
  { path: '/', label: 'Inicio', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { path: '/periodos', label: 'Períodos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { path: '/carreras', label: 'Carreras', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
  { path: '/cursos', label: 'Cursos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { path: '/bloques', label: 'Bloques', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { path: '/horarios/gestionar', label: 'Asignar', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  { path: '/horarios/visuales', label: 'Visuales', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { path: '/reportes', label: 'Reportes', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
]

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

watch(isDark, (val) => {
  document.documentElement.classList.toggle('dark-mode', val)
}, { immediate: true })

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

provide('toast', {
  success: (title, message) => toastRef.value?.add({ type: 'success', title, message }),
  error: (title, message) => toastRef.value?.add({ type: 'error', title, message }),
  warning: (title, message) => toastRef.value?.add({ type: 'warning', title, message }),
  info: (title, message) => toastRef.value?.add({ type: 'info', title, message })
})

onMounted(() => {
  store.fetchPeriodos()
  store.fetchCarreras()
  window.addEventListener('scroll', handleScroll)
})
</script>

<style>
:root {
  --primary: #00428B;
  --primary-glow: rgba(0, 66, 139, 0.5);
  --secondary: #2968B8;
  --accent: #F26522;
  --accent-glow: rgba(242, 101, 34, 0.4);
  
  /* Light Theme */
  --bg-main: #f0f4f8;
  --bg-card: rgba(255, 255, 255, 0.9);
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border: rgba(0,0,0,0.08);
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.4);
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 30px;
  
  --shadow-premium: 0 20px 40px rgba(0,0,0,0.05);
}

.dark-mode {
  --bg-main: #020617;
  --bg-card: rgba(30, 41, 59, 0.8);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: rgba(255,255,255,0.08);
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --shadow-premium: 0 25px 50px rgba(0,0,0,0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Outfit', 'Inter', sans-serif;
  background: var(--bg-main);
  color: var(--text-main);
  overflow-x: hidden;
  transition: background 0.5s ease;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* Mesh Background */
.mesh-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.mesh-blob {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}

.blob-1 { background: var(--primary); top: -200px; right: -100px; animation: float 20s infinite alternate; }
.blob-2 { background: var(--accent); bottom: -200px; left: -100px; animation: float 25s infinite alternate-reverse; }
.blob-3 { background: var(--secondary); top: 40%; left: 30%; width: 400px; opacity: 0.1; }

@keyframes float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(100px, 50px) scale(1.1); }
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 1rem 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--shadow-premium);
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.logo-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
}

.logo-cube {
  position: relative;
  width: 30px;
  height: 30px;
  transform: rotateX(-30deg) rotateY(45deg);
  transform-style: preserve-3d;
  animation: rotate 10s infinite linear;
}

.side {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--accent);
  opacity: 0.9;
  border: 2px solid white;
}

.front { transform: translateZ(15px); }
.right { transform: rotateY(90deg) translateZ(15px); background: var(--primary); }
.top   { transform: rotateX(90deg) translateZ(15px); background: #fff; }

@keyframes rotate {
  from { transform: rotateX(-30deg) rotateY(0deg); }
  to { transform: rotateX(-30deg) rotateY(360deg); }
}

.logo-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--accent);
  filter: blur(15px);
  opacity: 0.4;
  z-index: -1;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 700;
  display: block;
}

/* Nav Tabs */
.nav-tabs {
  display: flex;
  background: rgba(0,0,0,0.03);
  padding: 0.4rem;
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
}

.dark-mode .nav-tabs { background: rgba(255,255,255,0.03); }

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.nav-tab:hover {
  color: var(--text-main);
  background: rgba(255,255,255,0.05);
}

.nav-tab.router-link-active {
  background: var(--bg-card);
  color: var(--accent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Theme Toggle */
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.toggle-track {
  width: 50px;
  height: 26px;
  background: var(--border);
  border-radius: 20px;
  position: relative;
  transition: all 0.3s;
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dark-mode .toggle-thumb {
  left: 27px;
  background: var(--primary);
}

/* User Profile */
.user-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #10b981;
  border: 2px solid var(--bg-main);
  border-radius: 50%;
  z-index: 1;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 0.75rem;
  box-shadow: 0 0 15px var(--accent-glow);
}

/* Main Container */
.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 100px);
}

/* Transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from { opacity: 0; transform: translateY(10px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* Global Utilities */
.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-premium);
  border-radius: var(--radius-lg);
  transition: all 0.4s ease;
}

@media (max-width: 1024px) {
  .nav-tabs {
    display: none; /* Add a mobile menu later if needed */
  }
}
</style>

