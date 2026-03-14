<template>
  <div class="chatbot-container" :class="{ minimizado }">
    <div class="chatbot-header" @click="minimizado && minimizar()">
      <div class="header-content">
        <div class="bot-status-container">
          <div class="bot-avatar">🤖</div>
          <div class="status-dot"></div>
        </div>
        <div class="header-text-info">
          <h3>Sify Asistente</h3>
          <span class="status">Cerebro AI Activo</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-action-header" @click.stop="minimizar">
          <svg v-if="!minimizado" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M19 9l-7 7-7-7" /></svg>
          <svg v-else width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(mensaje, index) in mensajes" :key="index" :class="['mensaje', mensaje.tipo]">
        <div v-if="mensaje.tipo === 'bot'" class="mensaje-avatar">🤖</div>
        <div class="mensaje-content">
          <div class="mensaje-text" v-html="mensaje.texto"></div>
          <div class="mensaje-time">{{ mensaje.hora }}</div>
        </div>
        <div v-if="mensaje.tipo === 'usuario'" class="mensaje-avatar">👤</div>
      </div>

      <div v-if="escribiendo" class="mensaje bot">
        <div class="mensaje-avatar">🤖</div>
        <div class="mensaje-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-suggestions" v-if="mostrarSugerencias">
      <div class="suggestions-title">💡 Comandos rápidos:</div>
      <div class="suggestions-grid">
        <button
          v-for="(sugerencia, index) in sugerencias"
          :key="index"
          class="suggestion-btn"
          @click="enviarSugerencia(sugerencia.comando)"
        >
          {{ sugerencia.emoji }} {{ sugerencia.texto }}
        </button>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="mensajeUsuario"
        type="text"
        placeholder="Escribe un comando o pregunta..."
        @keyup.enter="enviarMensaje"
        @focus="mostrarSugerencias = false"
      />
      <button class="btn-send" @click="enviarMensaje" :disabled="!mensajeUsuario.trim()">
        <span v-if="!procesando">📤</span>
        <span v-else class="spinner-small"></span>
      </button>
    </div>

    <div class="chat-footer">
      <button class="btn-help" @click="mostrarAyuda">❓ Ayuda</button>
      <button class="btn-suggestions" @click="mostrarSugerencias = !mostrarSugerencias">
        💡 Sugerencias
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'
import api from '../services/api'

const toast = inject('toast')

// Estados
const mensajes = ref([])
const mensajeUsuario = ref('')
const escribiendo = ref(false)
const procesando = ref(false)
const mostrarSugerencias = ref(true)
const messagesContainer = ref(null)
const minimizado = ref(false)

// Sugerencias de comandos
const sugerencias = ref([
  { emoji: '🔍', texto: 'Buscar horario', comando: 'buscar horario' },
  { emoji: '✏️', texto: 'Cambiar aula', comando: 'cambiar aula' },
  { emoji: '👨‍🏫', texto: 'Cambiar profesor', comando: 'cambiar profesor' },
  { emoji: '⏰', texto: 'Cambiar hora', comando: 'cambiar horario' },
  { emoji: '📋', texto: 'Ver bloques', comando: 'listar bloques' },
  { emoji: '👥', texto: 'Ver profesores', comando: 'listar profesores' }
])

// Métodos
const agregarMensaje = (texto, tipo = 'bot') => {
  const ahora = new Date()
  const hora = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`
  
  mensajes.value.push({
    texto,
    tipo,
    hora
  })
  
  nextTick(() => {
    scrollToBottom()
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const enviarMensaje = async () => {
  if (!mensajeUsuario.value.trim()) return
  
  const mensaje = mensajeUsuario.value.trim()
  agregarMensaje(mensaje, 'usuario')
  mensajeUsuario.value = ''
  
  // Simular que el bot está escribiendo
  escribiendo.value = true
  procesando.value = true
  
  try {
    await procesarComando(mensaje)
  } finally {
    escribiendo.value = false
    procesando.value = false
  }
}

const enviarSugerencia = (comando) => {
  mensajeUsuario.value = comando
  enviarMensaje()
}

const procesarComando = async (comando) => {
  const comandoLower = comando.toLowerCase()
  
  // Esperar un poco para simular procesamiento
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Buscar horario
  if (comandoLower.includes('buscar') || comandoLower.includes('busca')) {
    await buscarHorario(comando)
  }
  // Listar bloques
  else if (comandoLower.includes('listar bloques') || comandoLower.includes('ver bloques')) {
    await listarBloques()
  }
  // Listar profesores
  else if (comandoLower.includes('listar profesores') || comandoLower.includes('ver profesores')) {
    await listarProfesores()
  }
  // Cambiar aula
  else if (comandoLower.includes('cambiar aula')) {
    await iniciarCambioAula(comando)
  }
  // Cambiar profesor
  else if (comandoLower.includes('cambiar profesor')) {
    await iniciarCambioProfesor(comando)
  }
  // Cambiar horario
  else if (comandoLower.includes('cambiar hora') || comandoLower.includes('cambiar horario')) {
    await iniciarCambioHorario(comando)
  }
  // Ayuda
  else if (comandoLower.includes('ayuda') || comandoLower.includes('help')) {
    mostrarAyuda()
  }
  // No entendido
  else {
    agregarMensaje(`
      ❌ No entendí ese comando. 
      <br><br>
      Prueba con:
      <ul>
        <li>🔍 "buscar horario de BLQ-001"</li>
        <li>✏️ "cambiar aula del horario 123"</li>
        <li>👨‍🏫 "cambiar profesor del curso Matemáticas"</li>
        <li>📋 "listar bloques"</li>
        <li>❓ "ayuda"</li>
      </ul>
    `)
  }
}

const buscarHorario = async (comando) => {
  try {
    // Extraer código de bloque si lo mencionan
    const match = comando.match(/BLQ-[A-Z0-9-]+/i)
    
    if (match) {
      const codigoBloque = match[0]
      
      // Buscar el bloque
      const bloquesRes = await api.get('/bloques')
      // Ajuste para estructura { success: true, data: [...] }
      const listaBloques = bloquesRes.data.data || bloquesRes.data
      
      const bloque = listaBloques.find(b => 
        b.codigo.toLowerCase() === codigoBloque.toLowerCase()
      )
      
        if (bloque) {
        // Buscar horarios del bloque
        const horariosRes = await api.get('/horarios', {
          params: { bloque: bloque._id }
        })
        
        const listaHorarios = horariosRes.data.data || horariosRes.data
        
        if (listaHorarios.length > 0) {
          let html = `✅ Encontré <strong>${listaHorarios.length} horarios</strong> para el bloque <strong>${bloque.codigo}</strong>:<br><br>`
          
          listaHorarios.slice(0, 5).forEach((h, i) => {
            html += `${i + 1}. ${h.diaSemana} ${h.horaInicio}-${h.horaFin}<br>`
          })
          
          if (listaHorarios.length > 5) {
            html += `<br>...y ${listaHorarios.length - 5} más.`
          }
          
          agregarMensaje(html)
        } else {
          agregarMensaje(`📭 No encontré horarios para el bloque <strong>${bloque.codigo}</strong>`)
        }
      } else {
        agregarMensaje(`❌ No encontré el bloque <strong>${codigoBloque}</strong>`)
      }
    } else {
      agregarMensaje(`
        Por favor especifica el código del bloque. Ejemplo:
        <br><br>
        <code>"buscar horario de BLQ-ADM-I-M-001"</code>
      `)
    }
  } catch (error) {
    agregarMensaje('❌ Error al buscar horarios: ' + error.message)
  }
}

const listarBloques = async () => {
  try {
    const response = await api.get('/bloques')
    const bloques = response.data.data || response.data
    
    if (bloques.length > 0) {
      let html = `📦 <strong>Bloques disponibles</strong> (${bloques.length} total):<br><br>`
      
      bloques.slice(0, 10).forEach((bloque, i) => {
        html += `${i + 1}. <strong>${bloque.codigo}</strong> - ${bloque.carrera?.nombre || 'Sin carrera'}<br>`
      })
      
      if (bloques.length > 10) {
        html += `<br>...y ${bloques.length - 10} bloques más.`
      }
      
      agregarMensaje(html)
    } else {
      agregarMensaje('📭 No hay bloques registrados aún.')
    }
  } catch (error) {
    agregarMensaje('❌ Error al listar bloques: ' + error.message)
  }
}

const listarProfesores = async () => {
  try {
    const response = await api.get('/profesores')
    const profesores = response.data.data || response.data
    
    if (profesores.length > 0) {
      let html = `👨‍🏫 <strong>Profesores disponibles</strong> (${profesores.length} total):<br><br>`
      
      profesores.slice(0, 10).forEach((prof, i) => {
        html += `${i + 1}. ${prof.nombres} ${prof.apellidos}`
        if (prof.especialidad) {
          html += ` <em>(${prof.especialidad})</em>`
        }
        html += '<br>'
      })
      
      if (profesores.length > 10) {
        html += `<br>...y ${profesores.length - 10} profesores más.`
      }
      
      agregarMensaje(html)
    } else {
      agregarMensaje('📭 No hay profesores registrados aún.')
    }
  } catch (error) {
    agregarMensaje('❌ Error al listar profesores: ' + error.message)
  }
}

const iniciarCambioAula = (comando) => {
  agregarMensaje(`
    Para cambiar el aula de un horario, necesito:
    <br><br>
    1️⃣ El ID del horario que quieres cambiar<br>
    2️⃣ El código de la nueva aula<br>
    <br>
    Ejemplo:<br>
    <code>"cambiar aula del horario 507f1f77bcf86cd799439011 a A-101"</code>
    <br><br>
    💡 Tip: Usa la vista de <strong>Horarios Visuales</strong> para ver los IDs.
  `)
}

const iniciarCambioProfesor = (comando) => {
  agregarMensaje(`
    Para cambiar el profesor de un curso, necesito:
    <br><br>
    1️⃣ El nombre del curso<br>
    2️⃣ El nombre del nuevo profesor<br>
    <br>
    Ejemplo:<br>
    <code>"cambiar profesor de Matemáticas a Juan Pérez"</code>
  `)
}

const iniciarCambioHorario = (comando) => {
  agregarMensaje(`
    Para cambiar el horario de una sesión, necesito:
    <br><br>
    1️⃣ El ID del horario<br>
    2️⃣ El nuevo día (Lunes, Martes, etc.)<br>
    3️⃣ La nueva hora (formato: HH:MM)<br>
    <br>
    Ejemplo:<br>
    <code>"cambiar horario 123 a Miércoles 09:00"</code>
  `)
}

const mostrarAyuda = () => {
  agregarMensaje(`
    <strong>🤖 Comandos disponibles:</strong>
    <br><br>
    <strong>Consultas:</strong><br>
    • <code>buscar horario de [BLQ-XXX]</code><br>
    • <code>listar bloques</code><br>
    • <code>listar profesores</code><br>
    • <code>listar aulas</code><br>
    <br>
    <strong>Modificaciones:</strong><br>
    • <code>cambiar aula del horario [ID] a [AULA]</code><br>
    • <code>cambiar profesor de [CURSO] a [PROFESOR]</code><br>
    • <code>cambiar horario [ID] a [DIA] [HORA]</code><br>
    <br>
    💡 Presiona "Sugerencias" para ver acciones rápidas.
  `)
}

const minimizar = () => {
  minimizado.value = !minimizado.value
  
  if (minimizado.value) {
    toast.info('Chatbot minimizado', 'Click en el header para maximizar')
  }
}

// Inicializar
onMounted(() => {
  agregarMensaje(`
    ¡Hola! 👋 Soy tu asistente de horarios.
    <br><br>
    Puedo ayudarte a:
    <ul>
      <li>🔍 Buscar horarios específicos</li>
      <li>✏️ Modificar aulas, profesores y horarios</li>
      <li>📋 Ver información de bloques y profesores</li>
    </ul>
    <br>
    ¿En qué puedo ayudarte hoy?
  `)
})
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 400px;
  height: 600px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(50px) scale(0.9); opacity: 0; }
  to { transform: translateX(0) scale(1); opacity: 1; }
}

.chatbot-container.minimizado {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(242, 101, 34, 0.4);
}

.chatbot-header {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  cursor: pointer;
}

.bot-status-container {
  position: relative;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.header-text-info h3 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
}

.header-text-info .status {
  font-size: 0.7rem;
  opacity: 0.8;
  font-weight: 600;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: rgba(0,0,0,0.02);
}

.mensaje {
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
}

.mensaje.bot { align-self: flex-start; }
.mensaje.usuario { align-self: flex-end; flex-direction: row-reverse; }

.mensaje-text {
  padding: 0.8rem 1.2rem;
  border-radius: 1.25rem;
  font-size: 0.9rem;
  line-height: 1.5;
  box-shadow: var(--shadow-sm);
}

.mensaje.bot .mensaje-text {
  background: var(--bg-card);
  color: var(--text-main);
  border-bottom-left-radius: 4px;
}

.mensaje.usuario .mensaje-text {
  background: linear-gradient(135deg, var(--accent), #FF8E53);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-input {
  padding: 1.25rem;
  display: flex;
  gap: 0.75rem;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
}

.chat-input input {
  flex: 1;
  background: var(--bg-main);
  border: 1px solid var(--border);
  padding: 0.8rem 1.5rem;
  border-radius: 2rem;
  color: var(--text-main);
  outline: none;
}

.btn-send {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.btn-send:hover { transform: scale(1.1) rotate(-10deg); }

.suggestions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0,0,0,0.02);
}

.suggestion-btn {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

</style>
