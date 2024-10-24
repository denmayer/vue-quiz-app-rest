<script setup lang="ts">
import { ref, computed } from 'vue'
import { quizService } from '../services/quizService'
import type { QuizAttempt, QuizData } from '../types/quiz'
import QuizQuestion from './QuizQuestion.vue'
import QuizResults from './QuizResults.vue'
import QuizNavigation from './QuizNavigation.vue'

const props = defineProps<{
  quiz: QuizData
}>()

const questions = props.quiz.questions
const currentQuestionIndex = ref(0)
const userAnswers = ref<(number | number[] | null)[]>(new Array(questions.length).fill(null))
const quizCompleted = ref(false)

const currentQuestion = computed(() => questions[currentQuestionIndex.value])

const isLastQuestion = computed(() => currentQuestionIndex.value === questions.length - 1)
const isFirstQuestion = computed(() => currentQuestionIndex.value === 0)

const hasUnansweredQuestions = computed(() => userAnswers.value.some(answer => answer === null))

function isAnswerCorrect(userAnswer: number | number[] | null, correctAnswer: number | number[]): boolean {
  if (userAnswer === null) return false
  
  if (Array.isArray(correctAnswer)) {
    return Array.isArray(userAnswer) && 
           userAnswer.length === correctAnswer.length && 
           userAnswer.every(a => correctAnswer.includes(a))
  }
  
  return userAnswer === correctAnswer
}

const score = computed(() => {
  return userAnswers.value.reduce((acc, answer, index) => {
    return acc + (isAnswerCorrect(answer, questions[index].correctAnswer) ? 1 : 0)
  }, 0)
})

const scorePercentage = computed(() => {
  return Math.round((score.value / questions.length) * 100)
})

function selectAnswer(answer: number | number[]) {
  userAnswers.value[currentQuestionIndex.value] = answer
}

function goToNextQuestion() {
  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++
  }
}

function goToPreviousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function finishQuiz() {
  userAnswers.value = userAnswers.value.map(answer => answer === null ? -1 : answer)
  quizCompleted.value = true
  quizService.saveAttempt(props.quiz.id, score.value, questions.length)
}

function restartQuiz() {
  currentQuestionIndex.value = 0
  userAnswers.value = new Array(questions.length).fill(null)
  quizCompleted.value = false
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <QuizQuestion
      v-if="!quizCompleted"
      :question="currentQuestion"
      :current-number="currentQuestionIndex + 1"
      :total-questions="questions.length"
      :selected-answer="userAnswers[currentQuestionIndex]"
      @select="selectAnswer"
    />

    <QuizNavigation
      v-if="!quizCompleted"
      :is-first-question="isFirstQuestion"
      :is-last-question="isLastQuestion"
      :has-unanswered-questions="hasUnansweredQuestions"
      @previous="goToPreviousQuestion"
      @next="goToNextQuestion"
      @finish="finishQuiz"
    />

    <QuizResults
      v-if="quizCompleted"
      :score="score"
      :total-questions="questions.length"
      :percentage="scorePercentage"
      :questions="questions"
      :user-answers="userAnswers"
      @restart="restartQuiz"
    />
  </div>
</template>