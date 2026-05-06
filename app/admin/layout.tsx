import { AdminSidebar } from "./_components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <AdminSidebar />
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
