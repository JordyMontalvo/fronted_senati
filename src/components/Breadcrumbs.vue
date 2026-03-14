<template>
  <nav class="breadcrumbs fadeIn" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item">
        <router-link to="/" class="breadcrumb-link home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </router-link>
      </li>
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb-item">
        <span class="separator">/</span>
        <router-link 
          v-if="index < crumbs.length - 1" 
          :to="crumb.path" 
          class="breadcrumb-link"
        >
          {{ crumb.label }}
        </router-link>
        <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const crumbs = computed(() => {
  const pathArray = route.path.split('/').filter(p => p)
  const breadcrumbs = pathArray.map((path, index) => {
    const fullPath = '/' + pathArray.slice(0, index + 1).join('/')
    // Map paths to friendly labels
    const labels = {
      'periodos': 'Períodos',
      'carreras': 'Carreras',
      'cursos': 'Cursos',
      'bloques': 'Bloques',
      'horarios': 'Horarios',
      'gestionar': 'Asignación',
      'visuales': 'Vista Visual',
      'reportes': 'Reportes',
      'profesores': 'Docentes',
      'aulas': 'Infraestructura',
      'ubicaciones': 'Zonales y Sedes'
    }
    return {
      label: labels[path] || path.charAt(0).toUpperCase() + path.slice(1),
      path: fullPath
    }
  })
  return breadcrumbs
})
</script>

<style scoped>
.breadcrumbs {
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 0.75rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breadcrumb-link {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.breadcrumb-link:hover {
  color: var(--accent);
  transform: translateY(-1px);
}

.breadcrumb-link.home {
  color: var(--primary);
  background: var(--bg-card);
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
}

.separator {
  color: var(--border);
  font-weight: 300;
  font-size: 0.9rem;
}

.breadcrumb-current {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-main);
  background: var(--accent-glow);
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>
