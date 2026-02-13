// Funciones complementarias para PreviewHorariosView.vue
// Copiar y pegar en el archivo dentro del <script setup>

// ==================== CONFIRMAR IMPORTACIÓN ====================
const confirmarImportacion = async () => {
  if (!confirm(`¿Confirmar importación de ${datosPrev.value.bloques} bloques y ${datosPrev.value.horarios} horarios?`)) {
    return
  }
  
  guardando.value = true
  conflictosDetectados.value = []
  
  try {
    toast.info('Guardando', 'Validando y guardando en la base de datos...')
    
    // Preparar datos para enviar
    const payload = {
      bloques: bloquesGenerados.value,
      horarios: horariosGenerados.value.map(h => ({
        ...h,
        bloqueId: bloquesGenerados.value.find(b => b.codigo === h.bloque)?.id
      }))
    }
    
    // Llamar al endpoint real
    const response = await api.post('/upload/bloques/confirmar-preview', payload)
    
    if (response.data.success) {
      // Verificar si hay conflictos
      if (response.data.conflictos && response.data.conflictos.length > 0) {
        conflictosDetectados.value = response.data.conflictos
        toast.warning('⚠️ Conflictos Detectados', `${response.data.conflictos.length} horarios con conflictos no se guardaron`)
        
        // Scroll a la alerta
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.success('¡Éxito! 🎉', response.data.message)
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('horariosPreview')
        
        // Esperar un momento y redirigir
        setTimeout(() => {
          router.push('/horarios/visuales')
        }, 2000)
      }
    } else {
      toast.error('Error', response.data.message)
    }
  } catch (error) {
    console.error('Error al confirmar:', error)
    toast.error('Error', error.response?.data?.message || 'No se pudieron guardar los horarios')
  } finally {
    guardando.value = false
  }
}

// ==================== EXPORTAR PDF ====================
const exportarPDF = () => {
  try {
    const doc = new jsPDF()
    
    // Configurar fuente
    doc.setFont('helvetica')
    
    // Título principal
    doc.setFontSize(20)
    doc.setTextColor(0, 66, 139) // Color primary
    doc.text('Horarios Generados - Vista Previa', 14, 20)
    
    // Línea separadora
    doc.setDrawColor(0, 66, 139)
    doc.setLineWidth(0.5)
    doc.line(14, 25, 196, 25)
    
    // Estadísticas
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`📦 Bloques: ${datosPrev.value.bloques}`, 14, 35)
    doc.text(`📚 Asignaciones: ${datosPrev.value.asignaciones}`, 70, 35)
    doc.text(`📅 Horarios: ${datosPrev.value.horarios}`, 130, 35)
    
    if (modificaciones.value > 0) {
      doc.setTextColor(242, 101, 34) // Color warning
      doc.text(`✏️ Modificaciones: ${modificaciones.value}`, 14, 42)
      doc.setTextColor(0, 0, 0)
    }
    
    // Fecha de generación
    const fecha = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado: ${fecha}`, 14, 50)
    
    // Tabla de horarios
    const tableData = horariosGenerados.value.map(h => [
      h.bloque,
      h.curso,
      h.profesor,
      h.aula,
      h.dia,
      `${h.horaInicio}-${h.horaFin}`,
      h.tipo
    ])
    
    doc.autoTable({
      head: [['Bloque', 'Curso', 'Profesor', 'Aula', 'Día', 'Horario', 'Tipo']],
      body: tableData,
      startY: 58,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [0, 66, 139],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
        6: { cellWidth: 25 }
      }
    })
    
    // Nota al pie
    const finalY = doc.lastAutoTable.finalY
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('SENATI - Sistema de Gestión de Horarios', 14, finalY + 10)
    doc.text('Este es un documento de vista previa. Los datos aún no han sido guardados.', 14, finalY + 15)
    
    // Si hay conflictos, agregar nota
    if (conflictosDetectados.value.length > 0) {
      doc.setTextColor(242, 101, 34)
      doc.text(`⚠️ ${conflictosDetectados.value.length} conflictos detectados. Revisar antes de confirmar.`, 14, finalY + 20)
    }
    
    // Guardar PDF
    const fechaArchivo = new Date().toISOString().split('T')[0]
    const nombreArchivo = `horarios-preview-${fechaArchivo}.pdf`
    doc.save(nombreArchivo)
    
    toast.success('PDF Generado', `Archivo ${nombreArchivo} descargado`)
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toast.error('Error', 'No se pudo generar el PDF')
  }
}
