<template>
  <div id="app">
    <!-- Modern Glassmorphism Navbar -->
    <header class="navbar" :class="{ 'scrolled': isScrolled }">
      <div class="navbar-content">
        <!-- Logo/Brand -->
        <div class="brand" @click="$router.push('/')">
          <div class="logo-wrapper">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="10" fill="url(#senati-gradient)"/>
              <path d="M16 7L24 15H19V25H13V15H8L16 7Z" fill="white"/>
              <defs>
                <linearGradient id="senati-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stop-color="#F26522"/>
                  <stop offset="100%" stop-color="#00428B"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="logo-glow"></div>
          </div>
          <div class="brand-text">
            <span class="brand-title">SENATI</span>
            <span class="brand-subtitle">Smart Schedules</span>
          </div>
        </div>

        <!-- Navigation Tabs (Scrollable on mobile) -->
        <nav class="nav-tabs">
          <router-link v-for="link in navLinks" :key="link.path" :to="link.path" class="nav-tab">
            <div class="tab-icon" v-html="link.icon"></div>
            <span>{{ link.label }}</span>
          </router-link>
        </nav>

        <!-- Right Side Actions -->
        <div class="navbar-actions">
          <button class="theme-toggle" @click="toggleTheme" title="Cambiar tema">
            <span v-if="isDark">🌙</span>
            <span v-else>☀️</span>
          </button>
          <div class="user-profile">
            <div class="avatar">AM</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenido Principal Centrado -->
    <main class="main-container">
      <div class="content-wrapper">
        <RouterView />
      </div>
    </main>

    <!-- Notificaciones Globales -->
    <ToastNotification ref="toastRef" />

    <!-- Chatbot de Horarios -->
    <ChatbotHorarios />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { onMounted, ref, provide } from 'vue'
import { useAppStore } from './stores/app'
import ToastNotification from './components/ToastNotification.vue'
import ChatbotHorarios from './components/ChatbotHorarios.vue'

const store = useAppStore()
const toastRef = ref(null)
const isDark = ref(true) // Default to premium dark
const isScrolled = ref(false)

const navLinks = [
  { path: '/', label: 'Inicio', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>' },
  { path: '/periodos', label: 'Períodos', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>' },
  { path: '/carreras', label: 'Carreras', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/></svg>' },
  { path: '/cursos', label: 'Cursos', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>' },
  { path: '/bloques', label: 'Bloques', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clip-rule="evenodd"/></svg>' },
  { path: '/horarios/gestionar', label: 'Asignar', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>' },
  { path: '/horarios/visuales', label: 'Visuales', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>' },
  { path: '/reportes', label: 'Reportes', icon: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 4a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm-3 5a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>' },
]

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark-mode', isDark.value)
}

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
  document.documentElement.classList.toggle('dark-mode', isDark.value)
})
</script>

<style>
:root {
  /* Light Theme Variables */
  --primary: #00428B;
  --secondary: #2968B8;
  --accent: #F26522;
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.3);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.25rem;
}

.dark-mode {
  /* Dark Theme Variables */
  --bg-main: #0f172a;
  --bg-card: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: #334155;
  --glass-bg: rgba(15, 23, 42, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: var(--bg-main);
  color: var(--text-main);
  transition: background-color 0.3s, color 0.3s;
  overflow-x: hidden;
}

/* Glassmorphism Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.5rem 0;
}

.navbar.scrolled {
  padding: 0.25rem 0;
  box-shadow: var(--shadow-md);
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

/* Brand Styling */
.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.brand:hover {
  background: rgba(255,255,255,0.05);
}

.logo-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--accent);
  filter: blur(15px);
  opacity: 0.3;
  z-index: -1;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #F26522, #F8FAFC);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
}

/* Nav Tabs Overhaul */
.nav-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(0,0,0,0.05);
  padding: 0.4rem;
  border-radius: 1rem;
  border: 1px solid var(--glass-border);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.875rem;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.nav-tab:hover {
  color: var(--text-main);
  background: rgba(255,255,255,0.05);
}

.nav-tab.router-link-active {
  background: var(--bg-card);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.nav-tab.router-link-active .tab-icon {
  color: var(--accent);
  filter: drop-shadow(0 0 5px rgba(242, 101, 34, 0.4));
}

/* Navbar Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  background: var(--bg-card);
  border: 1px solid var(--border);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.theme-toggle:hover {
  transform: rotate(15deg) scale(1.1);
}

.user-profile .avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  border: 2px solid var(--bg-main);
  box-shadow: 0 0 0 2px var(--accent);
}

/* Main Layout */
.main-container {
  padding: 2rem;
  min-height: calc(100vh - 80px);
  background: radial-gradient(circle at top right, rgba(0, 66, 139, 0.05), transparent),
              radial-gradient(circle at bottom left, rgba(242, 101, 34, 0.05), transparent);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* Reusable Components Styling */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #F26522, #FF8E53);
  color: white;
  box-shadow: 0 4px 15px rgba(242, 101, 34, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(242, 101, 34, 0.4);
}

/* Responsive Fixes */
@media (max-width: 1200px) {
  .nav-tabs {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 0;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    justify-content: space-around;
    padding: 0.5rem;
    z-index: 1000;
    border-top: 1px solid var(--glass-border);
  }
  
  .nav-tab {
    flex-direction: column;
    padding: 0.5rem;
    font-size: 0.7rem;
    gap: 0.25rem;
  }
  
  .nav-tab span {
    display: block !important;
  }
  
  .main-container {
    padding-bottom: 5rem;
  }
}

@media (max-width: 640px) {
  .brand-text {
    display: none;
  }
  .navbar-content {
    padding: 0 1rem;
  }
}
</style>
