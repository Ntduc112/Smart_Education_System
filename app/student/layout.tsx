export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // Role STUDENT được kiểm tra ở proxy.ts (STUDENT_ROUTES)
  return <>{children}</>
}
