import type { QuizData, Question, QuizAttempt } from '../types/quiz'

const API_URL = 'http://localhost:3000'
const API_TIMEOUT = 5000 // 5 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export const quizService = {
  async getAllQuizzes(): Promise<QuizData[]> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/quizzes`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.')
      }
      throw new Error('Failed to load quizzes. Please try again later.')
    }
  },

  async getQuizById(id: string): Promise<QuizData> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/quizzes/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      throw new Error('Failed to load quiz. Please try again later.')
    }
  },

  async saveQuiz(quiz: QuizData): Promise<QuizData> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      throw new Error('Failed to save quiz. Please try again later.')
    }
  },

  async addQuestion(quizId: string, question: Question): Promise<boolean> {
    try {
      const quiz = await this.getQuizById(quizId)
      const maxId = Math.max(...quiz.questions.map(q => q.id), 0)
      question.id = maxId + 1
      quiz.questions.push(question)
      await this.saveQuiz(quiz)
      return true
    } catch (error) {
      throw new Error('Failed to add question. Please try again later.')
    }
  },

  async updateQuestion(quizId: string, question: Question): Promise<boolean> {
    try {
      const quiz = await this.getQuizById(quizId)
      const index = quiz.questions.findIndex(q => q.id === question.id)
      if (index === -1) {
        throw new Error('Question not found')
      }
      quiz.questions[index] = question
      await this.saveQuiz(quiz)
      return true
    } catch (error) {
      throw new Error('Failed to update question. Please try again later.')
    }
  },

  async deleteQuestion(quizId: string, questionId: number): Promise<boolean> {
    try {
      const quiz = await this.getQuizById(quizId)
      quiz.questions = quiz.questions.filter(q => q.id !== questionId)
      await this.saveQuiz(quiz)
      return true
    } catch (error) {
      throw new Error('Failed to delete question. Please try again later.')
    }
  },

  async saveAttempt(quizId: string, score: number, totalQuestions: number): Promise<QuizAttempt> {
    try {
      const attempt = {
        quizId,
        date: new Date().toISOString(),
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100)
      }

      const response = await fetchWithTimeout(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attempt),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      throw new Error('Failed to save attempt. Please try again later.')
    }
  },

  async getAttempts(quizId?: string): Promise<QuizAttempt[]> {
    try {
      const url = quizId 
        ? `${API_URL}/attempts?quizId=${quizId}`
        : `${API_URL}/attempts`
      const response = await fetchWithTimeout(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.')
      }
      throw new Error('Failed to load attempts. Please try again later.')
    }
  },

  async clearAttempts(): Promise<boolean> {
    try {
      const attempts = await this.getAttempts()
      await Promise.all(
        attempts.map(attempt =>
          fetchWithTimeout(`${API_URL}/attempts/${attempt.id}`, { method: 'DELETE' })
        )
      )
      return true
    } catch (error) {
      throw new Error('Failed to clear attempts. Please try again later.')
    }
  }
}