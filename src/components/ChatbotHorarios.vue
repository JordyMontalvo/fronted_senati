<template>
  <div class="chatbot-container">
    <div class="chatbot-header">
      <div class="header-content">
        <div class="bot-avatar">🤖</div>
        <div>
          <h3>Asistente de Horarios</h3>
          <span class="status">● En línea</span>
        </div>
      </div>
      <button class="btn-minimize" @click="minimizar">─</button>
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
      const bloque = bloquesRes.data.find(b => 
        b.codigo.toLowerCase() === codigoBloque.toLowerCase()
      )
      
      if (bloque) {
        // Buscar horarios del bloque
        const horariosRes = await api.get('/horarios', {
          params: { bloque: bloque._id }
        })
        
        if (horariosRes.data.length > 0) {
          let html = `✅ Encontré <strong>${horariosRes.data.length} horarios</strong> para el bloque <strong>${bloque.codigo}</strong>:<br><br>`
          
          horariosRes.data.slice(0, 5).forEach((h, i) => {
            html += `${i + 1}. ${h.diaSemana} ${h.horaInicio}-${h.horaFin}<br>`
          })
          
          if (horariosRes.data.length > 5) {
            html += `<br>...y ${horariosRes.data.length - 5} más.`
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
    const bloques = response.data
    
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
    const profesores = response.data
    
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
  toast.info('Chatbot', 'Minimizado (función pendiente)')
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
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.25rem;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bot-avatar {
  font-size: 2rem;
}

.chatbot-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.status {
  font-size: 0.75rem;
  opacity: 0.9;
}

.btn-minimize {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f7f7f7;
}

.mensaje {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.mensaje.usuario {
  flex-direction: row-reverse;
}

.mensaje-avatar {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.mensaje-content {
  max-width: 75%;
}

.mensaje-text {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-size: 0.9rem;
  line-height: 1.5;
}

.mensaje.usuario .mensaje-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.mensaje-time {
  font-size: 0.7rem;
  color: var(--gray);
  margin-top: 0.25rem;
  padding: 0 0.5rem;
}

.typing-indicator {
  display: flex;
  gap: 0.3rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--gray);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-10px); opacity: 1; }
}

.chat-suggestions {
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border);
}

.suggestions-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--dark);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.suggestion-btn {
  background: var(--light-gray);
  border: 1px solid var(--border);
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.suggestion-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid var(--border);
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 24px;
  font-size: 0.9rem;
}

.btn-send {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-send:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.chat-footer {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f7f7f7;
  border-radius: 0 0 16px 16px;
}

.btn-help,
.btn-suggestions {
  flex: 1;
  background: white;
  border: 1px solid var(--border);
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-help:hover,
.btn-suggestions:hover {
  background: var(--light-gray);
}

/* Scrollbar personalizado */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Estilos para el HTML en mensajes */
.mensaje-text :deep(ul) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.mensaje-text :deep(code) {
  background: rgba(0,0,0,0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.mensaje-text :deep(strong) {
  font-weight: 700;
}

.mensaje-text :deep(em) {
  font-style: italic;
  opacity: 0.8;
}
</style>
