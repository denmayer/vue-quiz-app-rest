<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { quizService } from './services/quizService'
import QuizApp from './components/QuizApp.vue'
import QuizCard from './components/QuizCard.vue'
import NavBar from './components/NavBar.vue'
import QuizHistory from './components/QuizHistory.vue'
import QuizManager from './components/QuizManager.vue'
import type { QuizData } from './types/quiz'

const selectedQuiz = ref<QuizData | null>(null)
const currentPage = ref<'quizzes' | 'history' | 'manage'>('quizzes')
const quizzes = ref<QuizData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadQuizzes() {
  try {
    loading.value = true
    error.value = null
    quizzes.value = await quizService.getAllQuizzes()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load quizzes'
  } finally {
    loading.value = false
  }
}

function startQuiz(quiz: QuizData) {
  selectedQuiz.value = quiz
}

function backToQuizzes() {
  selectedQuiz.value = null
  currentPage.value = 'quizzes'
}

function navigateTo(page: 'quizzes' | 'history' | 'manage') {
  currentPage.value = page
  selectedQuiz.value = null
  if (page === 'quizzes') {
    loadQuizzes()
  }
}

onMounted(loadQuizzes)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar 
      :current-page="currentPage"
      @navigate="navigateTo"
    />

    <main class="max-w-4xl mx-auto p-6">
      <template v-if="loading">
        <div class="flex justify-center items-center min-h-[400px]">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p class="text-red-600 mb-4">{{ error }}</p>
          <button
            @click="loadQuizzes"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </template>

      <template v-else-if="!selectedQuiz && currentPage === 'quizzes'">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-emerald-600 mb-2">Quiz App</h1>
          <p class="text-gray-500">Choose a quiz to test your knowledge!</p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <button
            v-for="quiz in quizzes"
            :key="quiz.id"
            @click="startQuiz(quiz)"
            class="text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 rounded-lg"
          >
            <QuizCard :quiz="quiz" />
          </button>
        </div>
      </template>

      <template v-else-if="currentPage === 'history'">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-emerald-600 mb-2">Quiz History</h1>
          <p class="text-gray-500">View your past quiz attempts and performance</p>
        </div>

        <div class="grid gap-6">
          <div v-for="quiz in quizzes" :key="quiz.id">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ quiz.name }}</h2>
            <QuizHistory 
              :attempts="quizService.getAttempts(quiz.id)"
              @clear-history="quizService.clearAttempts()"
            />
          </div>
        </div>
      </template>

      <template v-else-if="currentPage === 'manage'">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-emerald-600 mb-2">Manage Quizzes</h1>
          <p class="text-gray-500">Create, edit, and manage your quiz questions</p>
        </div>

        <QuizManager :quizzes="quizzes" @quiz-updated="loadQuizzes" />
      </template>

      <template v-else>
        <button
          @click="backToQuizzes"
          class="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          <span>←</span> Back to Quizzes
        </button>

        <h1 class="text-4xl font-bold text-center text-emerald-600 mb-2">
          {{ selectedQuiz?.name }}
        </h1>
        <p class="text-center text-gray-500 mb-10">Test your knowledge!</p>
        
        <QuizApp :quiz="selectedQuiz" />
      </template>
    </main>
  </div>
</template>