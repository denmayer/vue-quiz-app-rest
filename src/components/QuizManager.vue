<script setup lang="ts">
import { ref, computed } from 'vue'
import type { QuizData, Question } from '../types/quiz'
import { quizService } from '../services/quizService'

const props = defineProps<{
  quizzes: QuizData[]
}>()

const emit = defineEmits<{
  (e: 'quiz-updated'): void
}>()

const selectedQuizId = ref<string | null>(null)
const editingQuestion = ref<Question | null>(null)
const isCreatingQuestion = ref(false)
const error = ref<string | null>(null)

const selectedQuiz = computed(() => 
  props.quizzes.find(q => q.id === selectedQuizId.value)
)

const newQuestion: Question = {
  id: 0,
  text: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  type: 'multiple-choice'
}

function startEditingQuestion(question: Question) {
  editingQuestion.value = { ...question }
}

function startCreatingQuestion() {
  isCreatingQuestion.value = true
  editingQuestion.value = { ...newQuestion }
}

function cancelEditing() {
  editingQuestion.value = null
  isCreatingQuestion.value = false
  error.value = null
}

async function saveQuestion() {
  if (!editingQuestion.value || !selectedQuizId.value) return

  try {
    error.value = null
    if (isCreatingQuestion.value) {
      await quizService.addQuestion(selectedQuizId.value, editingQuestion.value)
    } else {
      await quizService.updateQuestion(selectedQuizId.value, editingQuestion.value)
    }
    emit('quiz-updated')
    cancelEditing()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save question'
  }
}

async function deleteQuestion(questionId: number) {
  if (!selectedQuizId.value) return
  
  if (confirm('Are you sure you want to delete this question?')) {
    try {
      error.value = null
      await quizService.deleteQuestion(selectedQuizId.value, questionId)
      emit('quiz-updated')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete question'
    }
  }
}

function updateQuestionType(type: 'multiple-choice' | 'true-false') {
  if (!editingQuestion.value) return

  editingQuestion.value = {
    ...editingQuestion.value,
    type,
    options: type === 'true-false' ? ['True', 'False'] : ['', '', '', ''],
    correctAnswer: 0
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
      {{ error }}
    </div>

    <!-- Quiz Selection -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Quiz to Manage
      </label>
      <select
        v-model="selectedQuizId"
        class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        <option value="">Choose a quiz...</option>
        <option v-for="quiz in quizzes" :key="quiz.id" :value="quiz.id">
          {{ quiz.name }}
        </option>
      </select>
    </div>

    <!-- Question List -->
    <div v-if="selectedQuiz" class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">Questions</h2>
        <button
          @click="startCreatingQuestion"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
        >
          Add Question
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="question in selectedQuiz.questions"
          :key="question.id"
          class="border rounded-lg p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="font-medium text-gray-800">{{ question.text }}</div>
              <div class="text-sm text-gray-500 mt-1">
                Type: {{ question.type === 'true-false' ? 'True/False' : 'Multiple Choice' }}
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="startEditingQuestion(question)"
                class="text-emerald-600 hover:text-emerald-700"
              >
                Edit
              </button>
              <button
                @click="deleteQuestion(question.id)"
                class="text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Editor Modal -->
    <div
      v-if="editingQuestion"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
        <h3 class="text-xl font-bold text-gray-800 mb-6">
          {{ isCreatingQuestion ? 'Create Question' : 'Edit Question' }}
        </h3>

        <div class="space-y-4">
          <!-- Question Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <select
              v-model="editingQuestion.type"
              @change="updateQuestionType($event.target.value)"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
            </select>
          </div>

          <!-- Question Text -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <input
              v-model="editingQuestion.text"
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Enter your question"
            />
          </div>

          <!-- Options -->
          <div v-if="editingQuestion.type === 'multiple-choice'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div class="space-y-2">
              <div
                v-for="(option, index) in editingQuestion.options"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="editingQuestion.options[index]"
                  type="text"
                  class="flex-grow rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  :placeholder="`Option ${index + 1}`"
                />
                <input
                  type="radio"
                  :name="'correct-answer'"
                  :value="index"
                  v-model="editingQuestion.correctAnswer"
                  class="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <label class="text-sm text-gray-600">Correct</label>
              </div>
            </div>
          </div>

          <!-- True/False Correct Answer -->
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer
            </label>
            <div class="flex gap-4">
              <label class="inline-flex items-center">
                <input
                  type="radio"
                  v-model="editingQuestion.correctAnswer"
                  :value="0"
                  class="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span class="ml-2">True</span>
              </label>
              <label class="inline-flex items-center">
                <input
                  type="radio"
                  v-model="editingQuestion.correctAnswer"
                  :value="1"
                  class="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span class="ml-2">False</span>
              </label>
            </div>
          </div>

          <!-- Image URL (Optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              v-model="editingQuestion.image"
              type="url"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4 mt-6">
            <button
              @click="cancelEditing"
              class="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              @click="saveQuestion"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              Save Question
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>