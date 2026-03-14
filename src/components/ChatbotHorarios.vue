<template>
  <div class="chatbot-container" :class="{ minimizado }" id="chatbot-sify">
    <!-- Header / Toggle Button -->
    <div class="chatbot-header" @click="toggleChat">
      <div class="header-content">
        <div class="bot-avatar-wrapper">
          <div class="premium-bot-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="url(#bot-grad)"/>
              <path d="M7 11H17M7 14H17M9 17H15" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <circle cx="9" cy="8" r="1.5" fill="white"/>
              <circle cx="15" cy="8" r="1.5" fill="white"/>
              <defs>
                <linearGradient id="bot-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#F26522"/>
                  <stop offset="1" stop-color="#00428B"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="status-indicator-active" v-if="!minimizado"></div>
        </div>
        <div class="header-text-premium" v-if="!minimizado">
          <span class="bot-name">SIFY AI</span>
          <span class="bot-status">Soporte Inteligente</span>
        </div>
      </div>
      <div class="header-actions" v-if="!minimizado">
        <button class="action-circle minimize-btn" @click.stop="toggleChat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M6 12h12" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Chat Body -->
    <div class="chat-body" v-if="!minimizado">
      <div class="messages-scroll" ref="messagesContainer">
        <div v-for="(msg, index) in mensajes" :key="index" :class="['msg-wrapper', msg.tipo]">
          <div class="msg-bubble" v-html="msg.texto"></div>
          <span class="msg-meta">{{ msg.hora }}</span>
        </div>

        <div v-if="escribiendo" class="msg-wrapper bot">
          <div class="msg-bubble typing">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-tools" v-if="mostrarSugerencias">
        <button v-for="sug in sugerencias" :key="sug.texto" @click="enviarSugerencia(sug.comando)" class="tool-btn">
          {{ sug.emoji }} {{ sug.texto }}
        </button>
      </div>

      <!-- Input Bar -->
      <div class="input-area">
        <div class="input-glass">
          <input 
            v-model="mensajeUsuario" 
            placeholder="Pregunta algo..." 
            @keyup.enter="enviarMensaje"
          />
          <button class="send-trigger" @click="enviarMensaje" :disabled="!mensajeUsuario.trim()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="chat-extra-actions">
        <button @click="mostrarSugerencias = !mostrarSugerencias" class="extra-btn">
          {{ mostrarSugerencias ? 'Ocultar sugerencias' : 'Ver sugerencias' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'

const toast = inject('toast')
const mensajes = ref([])
const mensajeUsuario = ref('')
const escribiendo = ref(false)
const minimizado = ref(true)
const mostrarSugerencias = ref(true)
const messagesContainer = ref(null)

const sugerencias = [
  { emoji: '📋', texto: 'Ver Bloques', comando: 'listar bloques' },
  { emoji: '👨‍🏫', texto: 'Docentes', comando: 'listar profesores' },
  { emoji: '🕒', texto: 'Horarios', comando: 'buscar horario' },
]

const toggleChat = () => {
  minimizado.value = !minimizado.value
}

const agregarMensaje = (texto, tipo = 'bot') => {
  const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  mensajes.value.push({ texto, tipo, hora })
  nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const enviarMensaje = async () => {
  if (!mensajeUsuario.value.trim()) return
  const msg = mensajeUsuario.value.trim()
  agregarMensaje(msg, 'usuario')
  mensajeUsuario.value = ''
  
  escribiendo.value = true
  try {
    await new Promise(r => setTimeout(r, 800)) // Simulation
    if (msg.toLowerCase().includes('hola')) {
      agregarMensaje("¡Hola! Soy SIFY. ¿En qué puedo ayudarte con la programación académica hoy?")
    } else {
      agregarMensaje("Entendido. Estoy consultando la base de datos para darte una respuesta precisa...")
    }
  } finally {
    escribiendo.value = false
  }
}

const enviarSugerencia = (cmd) => {
  mensajeUsuario.value = cmd
  enviarMensaje()
}

onMounted(() => {
  agregarMensaje("Bienvenido al soporte de <strong>Smart Schedules</strong>. ¿En qué puedo asistirte?", 'bot')
})
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 2000;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
}

.chatbot-container.minimizado {
  width: 65px;
  height: 65px;
}

.chatbot-container.minimizado .chatbot-header {
  border-radius: 50%;
  width: 65px;
  height: 65px;
  padding: 0;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(242, 101, 34, 0.3);
}

.chatbot-container:not(.minimizado) {
  width: 380px;
  height: 580px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, #00428B, #F26522);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  height: 70px;
}

.bot-avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
}

.premium-bot-icon {
  width: 100%;
  height: 100%;
}

.status-indicator-active {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.header-text-premium {
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
  color: white;
  flex: 1;
}

.bot-name { font-weight: 900; font-size: 1.1rem; letter-spacing: 0.5px; }
.bot-status { font-size: 0.7rem; opacity: 0.8; font-weight: 700; text-transform: uppercase; }

.action-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  gap: 1.25rem;
  overflow: hidden;
}

.messages-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.msg-wrapper {
  max-width: 85%;
  display: flex;
  flex-direction: column;
}

.msg-wrapper.bot { align-self: flex-start; }
.msg-wrapper.usuario { align-self: flex-end; }

.msg-bubble {
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.bot .msg-bubble {
  background: #f1f5f9;
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

.usuario .msg-bubble {
  background: #00428B;
  color: white;
  border-bottom-right-radius: 4px;
}

.msg-meta {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
  margin-top: 0.25rem;
}

.usuario .msg-meta { align-self: flex-end; }

.typing { display: flex; gap: 4px; padding: 0.5rem; }
.typing .dot { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: type-bounce 1s infinite alternate; }
.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.typing .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes type-bounce { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-4px); opacity: 1; } }

.quick-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.input-glass {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.4rem;
  border-radius: 30px;
  display: flex;
  align-items: center;
}

.input-glass input {
  flex: 1;
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  outline: none;
  font-weight: 600;
}

.send-trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F26522;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.extra-btn { background: none; border: none; font-size: 0.7rem; font-weight: 800; color: #94a3b8; cursor: pointer; text-transform: uppercase; width: 100%; margin-top: 0.5rem; }

</style>
