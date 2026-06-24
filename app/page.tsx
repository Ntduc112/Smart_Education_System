import { CoursesSection } from "./_components/home/CoursesSection";
import { PostsFeedSection } from "./_components/home/PostsFeedSection";
import { HeroSection } from "./_components/home/HeroSection";
import { FeaturesSection } from "./_components/home/FeaturesSection";
import { CTASection } from "./_components/home/CTASection";
import { MainNavbar } from "./_components/MainNavbar";
import { Logo } from "./_components/Logo";
import Link from "next/link";

const FOOTER_COLS = [
  { heading: "Sản phẩm", links: ["Khóa học", "AI Tutor", "Chứng chỉ"] },
  { heading: "Công ty", links: ["Về chúng tôi", "Blog", "Tuyển dụng"] },
  { heading: "Hỗ trợ", links: ["Trợ giúp", "Liên hệ", "Điều khoản"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(170deg,#EFF5FE 0%,#F3F8FE 45%,#EAF2FD 100%)" }}>

      {/* Soft floating blobs — same cozy-blue atmosphere as /student/home */}
      <div
        className="fixed top-[-12%] left-[-8%] w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "#BCD7FF", opacity: 0.5, filter: "blur(110px)", animation: "breathe1 20s ease-in-out infinite" }}
      />
      <div
        className="fixed top-[18%] right-[-10%] w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: "#A7C8FF", opacity: 0.45, filter: "blur(110px)", animation: "breathe2 24s ease-in-out infinite" }}
      />
      <div
        className="fixed bottom-[2%] left-[22%] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: "#CFE0FA", opacity: 0.5, filter: "blur(110px)", animation: "breathe1 17s ease-in-out infinite 2s" }}
      />

      {/* Subtle grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Navbar */}
      <MainNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Courses */}
      <CoursesSection />

      {/* Community posts feed (chỉ hiện cho user đã đăng nhập) */}
      <PostsFeedSection />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <footer className="relative border-t border-[#DCE6F4] py-12 px-8 bg-white/70 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 pb-8 border-b border-[#e8edf5]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo size={28} />
                <span className="font-display font-bold text-[#181d26] text-lg tracking-tight">Learnust</span>
              </div>
              <p className="text-sm text-[rgba(4,14,32,0.45)] max-w-xs leading-relaxed">
                Nền tảng học tập thông minh, cá nhân hóa trải nghiệm học của bạn.
              </p>
            </div>
            <div className="flex gap-12">
              {FOOTER_COLS.map((col) => (
                <div key={col.heading}>
                  <h4 className="text-xs font-semibold text-[rgba(4,14,32,0.45)] uppercase tracking-wider mb-3">{col.heading}</h4>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <Link href="#" className="text-sm text-[rgba(4,14,32,0.4)] hover:text-[#1b61c9] transition-colors">{link}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-8 text-xs text-[rgba(4,14,32,0.3)]">© 2026 Learnust. All rights reserved.</div>
        </div>
      </footer>

      {/* CSS keyframes for orb breathe animation */}
      <style>{`
        @keyframes breathe1 {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes breathe2 {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
