import { CoursesSection } from "./_components/CoursesSection";
import { PostsFeedSection } from "./_components/PostsFeedSection";
import { HeroSection } from "./_components/HeroSection";
import { FeaturesSection } from "./_components/FeaturesSection";
import { CTASection } from "./_components/CTASection";
import { DarkNavbar } from "./_components/DarkNavbar";
import { Logo } from "./_components/Logo";
import Link from "next/link";

const FOOTER_COLS = [
  { heading: "Sản phẩm", links: ["Khóa học", "AI Tutor", "Chứng chỉ"] },
  { heading: "Công ty", links: ["Về chúng tôi", "Blog", "Tuyển dụng"] },
  { heading: "Hỗ trợ", links: ["Trợ giúp", "Liên hệ", "Điều khoản"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "linear-gradient(160deg, #eef4ff 0%, #f4f7ff 40%, #f0f5ff 100%)" }}>

      {/* Ambient background orbs */}
      <div
        className="fixed top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "rgba(59,130,246,0.08)",
          filter: "blur(140px)",
          animation: "breathe1 18s ease-in-out infinite",
        }}
      />
      <div
        className="fixed top-[50%] left-[60%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "rgba(99,102,241,0.07)",
          filter: "blur(120px)",
          animation: "breathe2 22s ease-in-out infinite",
        }}
      />
      <div
        className="fixed top-[30%] left-[35%] w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{
          background: "rgba(14,165,233,0.05)",
          filter: "blur(100px)",
          animation: "breathe1 15s ease-in-out infinite 2s",
        }}
      />

      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,132,246,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navbar */}
      <DarkNavbar />

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
      <footer className="border-t border-[#e4eaf5] py-12 px-8 bg-white/60">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 pb-8 border-b border-[#e8edf5]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Logo size={26} />
                <span className="font-semibold text-[#181d26] text-sm">SmartEdu</span>
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
          <div className="pt-8 text-xs text-[rgba(4,14,32,0.3)]">© 2026 SmartEdu. All rights reserved.</div>
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
