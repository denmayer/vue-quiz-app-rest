export interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: number | number[]  // Single number for single answer, array for multiple
  image?: string
  type: 'multiple-choice' | 'true-false' | 'multiple-response'
  explanation?: string  // Optional explanation for the answer
}

export interface QuizData {
  id: string
  name: string
  description: string
  questions: Question[]
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit?: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  date: string
  score: number
  totalQuestions: number
  percentage: number
}