import { MainNavbar } from "@/app/_components/MainNavbar";
import { PostsFeedFull } from "@/app/_components/home/PostsFeedSection";

export const metadata = {
  title: "Cộng đồng — SmartEdu",
  description: "Bài viết, hỏi đáp và chia sẻ từ cộng đồng học tập SmartEdu.",
};

export default function PostsPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(170deg,#EFF5FE 0%,#F3F8FE 45%,#EAF2FD 100%)" }}>
      {/* Cozy-blue atmosphere */}
      <div className="fixed top-[-12%] left-[-8%] w-[520px] h-[520px] rounded-full pointer-events-none" style={{ background: "#BCD7FF", opacity: 0.45, filter: "blur(110px)" }} />
      <div className="fixed top-[20%] right-[-10%] w-[460px] h-[460px] rounded-full pointer-events-none" style={{ background: "#A7C8FF", opacity: 0.4, filter: "blur(110px)" }} />
      <div className="fixed bottom-[0%] left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "#CFE0FA", opacity: 0.45, filter: "blur(110px)" }} />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <MainNavbar />
      <div className="relative">
        <PostsFeedFull />
      </div>
    </div>
  );
}
