<script setup lang="ts">
import { defineProps, onMounted } from 'vue'
import type { QuizAttempt } from '../types/quiz'

const props = defineProps<{
  attempts: QuizAttempt[]
}>()

onMounted(() => {
  const canvas = document.getElementById('scoreGraph') as HTMLCanvasElement
  if (!canvas || props.attempts.length < 2) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const padding = 40

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Sort attempts by date
  const sortedAttempts = [...props.attempts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate scales
  const xScale = (width - padding * 2) / (sortedAttempts.length - 1)
  const yScale = (height - padding * 2) / 100 // percentage scale 0-100

  // Draw axes
  ctx.beginPath()
  ctx.strokeStyle = '#94a3b8' // slate-400
  ctx.lineWidth = 1
  
  // Y-axis
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  
  // X-axis
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.stroke()

  // Draw grid lines and labels
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.font = '12px sans-serif'
  ctx.fillStyle = '#64748b' // slate-500

  // Y-axis grid and labels
  for (let i = 0; i <= 100; i += 20) {
    const y = height - padding - (i * yScale)
    ctx.fillText(`${i}%`, padding - 10, y)
    
    ctx.beginPath()
    ctx.strokeStyle = '#e2e8f0' // slate-200
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // Draw line graph
  ctx.beginPath()
  ctx.strokeStyle = '#059669' // emerald-600
  ctx.lineWidth = 2
  
  sortedAttempts.forEach((attempt, index) => {
    const x = padding + (index * xScale)
    const y = height - padding - (attempt.percentage * yScale)
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()

  // Draw points
  sortedAttempts.forEach((attempt, index) => {
    const x = padding + (index * xScale)
    const y = height - padding - (attempt.percentage * yScale)
    
    ctx.beginPath()
    ctx.fillStyle = '#fff'
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.stroke()
    
    // Add date label
    const date = new Date(attempt.date).toLocaleDateString()
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(date, x, height - padding + 10)
  })
})
</script>

<template>
  <div class="w-full h-64 bg-white rounded-lg p-4">
    <canvas
      id="scoreGraph"
      width="600"
      height="240"
      class="w-full h-full"
    ></canvas>
  </div>
</template>