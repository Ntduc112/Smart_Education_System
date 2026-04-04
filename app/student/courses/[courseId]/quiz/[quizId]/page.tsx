export default function QuizPage({ params }: { params: { courseId: string; quizId: string } }) {
  return <div>Quiz: {params.quizId}</div>
}
