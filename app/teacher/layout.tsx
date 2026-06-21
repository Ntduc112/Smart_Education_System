// Toàn bộ trang teacher dùng MainNavbar top-nav (mỗi page tự render) — không còn sidebar.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
