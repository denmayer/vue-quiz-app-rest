<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QuizAttempt } from '../types/quiz'
import { quizService } from '../services/quizService'
import LineGraph from './LineGraph.vue'

const props = defineProps<{
  quizId: string
}>()

const emit = defineEmits<{
  (e: 'clearHistory'): void
}>()

const attempts = ref<QuizAttempt[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    loading.value = true
    const fetchedAttempts = await quizService.getAttempts(props.quizId)
    attempts.value = fetchedAttempts
  } catch (err) {
    error.value = 'Failed to load quiz attempts'
    console.error('Error loading attempts:', err)
  } finally {
    loading.value = false
  }
})

const sortedAttempts = computed(() => {
  return [...attempts.value].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const averageScore = computed(() => {
  if (attempts.value.length === 0) return 0
  const sum = attempts.value.reduce((acc, attempt) => acc + attempt.percentage, 0)
  return Math.round(sum / attempts.value.length)
})

const bestScore = computed(() => {
  if (attempts.value.length === 0) return 0
  return Math.max(...attempts.value.map(a => a.percentage))
})

async function clearHistory() {
  try {
    await quizService.clearAttempts()
    attempts.value = []
    emit('clearHistory')
  } catch (err) {
    error.value = 'Failed to clear history'
    console.error('Error clearing history:', err)
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Quiz History</h2>
      <button
        v-if="attempts.length > 0"
        @click="clearHistory"
        class="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
      >
        Clear History
      </button>
    </div>

    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading attempts...</p>
    </div>

    <div v-else-if="attempts.length > 0" class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-emerald-50 p-4 rounded-lg">
          <div class="text-sm text-emerald-600 mb-1">Average Score</div>
          <div class="text-2xl font-bold text-emerald-700">{{ averageScore }}%</div>
        </div>
        <div class="bg-emerald-50 p-4 rounded-lg">
          <div class="text-sm text-emerald-600 mb-1">Best Score</div>
          <div class="text-2xl font-bold text-emerald-700">{{ bestScore }}%</div>
        </div>
      </div>

      <!-- Progress Graph -->
      <div v-if="attempts.length >= 2" class="border rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Progress Over Time</h3>
        <LineGraph :attempts="attempts" />
      </div>

      <div class="space-y-4">
        <div
          v-for="attempt in sortedAttempts"
          :key="attempt.id"
          class="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
        >
          <div class="flex justify-between items-center">
            <div>
              <div class="text-sm text-gray-500">{{ formatDate(attempt.date) }}</div>
              <div class="font-medium">
                Score: {{ attempt.score }}/{{ attempt.totalQuestions }}
              </div>
            </div>
            <div class="text-lg font-semibold text-emerald-600">
              {{ attempt.percentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500 py-8">
      No quiz attempts yet. Take the quiz to see your history!
    </div>
  </div>
</template>