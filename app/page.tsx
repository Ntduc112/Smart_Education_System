import Link from "next/link";
import { Home, BookOpen, Sparkles } from "lucide-react";
import { Logo } from "./_components/Logo";
import { CoursesSection } from "./_components/CoursesSection";
import { SearchBar } from "./_components/SearchBar";
import { HeaderAuth } from "./_components/HeaderAuth";

// ── Sidebar nav items ──────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { href: "/", label: "Trang chủ", icon: <Home size={22} strokeWidth={1.8} /> },
  { href: "/courses", label: "Khóa học", icon: <BookOpen size={22} strokeWidth={1.8} /> },
  { href: "#features", label: "Tính năng", icon: <Sparkles size={22} strokeWidth={1.8} /> },
];

const FEATURES = [
  { icon: "🤖", title: "AI Tutor cá nhân", desc: "Giải đáp mọi thắc mắc 24/7 với trợ lý AI được đào tạo chuyên sâu theo từng khóa học." },
  { icon: "📊", title: "Theo dõi tiến độ", desc: "Hệ thống phân tích thông minh giúp bạn biết chính xác mình đang ở đâu và cần học gì tiếp theo." },
  { icon: "🎯", title: "Quiz thích ứng", desc: "Bài kiểm tra tự điều chỉnh độ khó theo năng lực, giúp củng cố kiến thức tối ưu." },
  { icon: "🎓", title: "Giáo viên chất lượng", desc: "Đội ngũ giảng viên được kiểm duyệt kỹ, đảm bảo nội dung chuẩn và cập nhật." },
  { icon: "📱", title: "Học mọi lúc mọi nơi", desc: "Giao diện tối ưu trên mọi thiết bị, hỗ trợ tải video offline để học không cần mạng." },
  { icon: "🏆", title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ được công nhận khi hoàn thành khóa học, nâng cao hồ sơ nghề nghiệp." },
];

const FOOTER_COLS = [
  { heading: "Sản phẩm", links: ["Khóa học", "AI Tutor", "Chứng chỉ"] },
  { heading: "Công ty", links: ["Về chúng tôi", "Blog", "Tuyển dụng"] },
  { heading: "Hỗ trợ", links: ["Trợ giúp", "Liên hệ", "Điều khoản"] },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-screen w-[72px] bg-white border-r border-[#e0e2e6] z-30 flex flex-col items-center pt-[76px] gap-1">
        {/* Nav items */}
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="group relative w-full flex flex-col items-center gap-1 py-3 text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors"
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-tight leading-tight text-center">
              {item.label}
            </span>
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#181d26] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </span>
          </Link>
        ))}
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 ml-[72px] flex flex-col min-w-0">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e0e2e6] h-[60px] flex items-center px-6">
          {/* Brand — flex-1 để bằng với Auth */}
          <div className="flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <Logo size={32} />
              <span className="text-[22px] font-bold text-[#1b61c9] tracking-tight leading-none">SmartEdu</span>
            </Link>
          </div>

          {/* Search — cùng chiều rộng với dòng hero text */}
          <div style={{ width: 520, flexShrink: 0, transform: "translateX(-10px)" }}>
            <SearchBar />
          </div>

          {/* Auth — flex-1 để bằng với Brand, căn phải */}
          <div className="flex-1 min-w-0 flex justify-end">
            <HeaderAuth />
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="px-8 pt-20 pb-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-light text-[#181d26] leading-tight mb-6">
              Học tập thông minh hơn với
              <span className="font-black text-[#1b61c9] block">AI cá nhân hóa</span>
            </h1>

            <p className="text-lg text-[rgba(4,14,32,0.69)] leading-relaxed tracking-[0.18px] mb-10 max-w-2xl mx-auto text-center">
              Hệ thống giáo dục thông minh giúp học viên tiếp cận kiến thức theo cách phù hợp nhất
              với bản thân, được hỗ trợ bởi AI Tutor 24/7.
            </p>

          </div>
        </section>

        {/* ── Courses (client component) ── */}
        <CoursesSection />

        {/* ── Features ── */}
        <section id="features" className="bg-[#f8fafc] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-semibold text-[#181d26] mb-3">Tại sao chọn SmartEdu?</h2>
              <p className="text-[rgba(4,14,32,0.69)] tracking-[0.18px]">Tất cả những gì bạn cần để học tập hiệu quả</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="bg-white rounded-2xl p-6 border border-[#e0e2e6]"
                  style={{ boxShadow: "rgba(15,48,106,0.05) 0px 0px 20px" }}
                >
                  <div className="text-3xl mb-4">{feat.icon}</div>
                  <h3 className="text-base font-semibold text-[#181d26] mb-2">{feat.title}</h3>
                  <p className="text-sm text-[rgba(4,14,32,0.69)] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#1b61c9] py-20 px-8 text-center">
          <h2 className="text-3xl font-light text-white mb-3">Sẵn sàng bắt đầu hành trình?</h2>
          <p className="text-white/75 mb-8 tracking-[0.18px]">Tham gia cùng hàng nghìn học viên đang học tập trên SmartEdu</p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#1b61c9] font-semibold text-sm px-8 py-3 rounded-xl hover:bg-[rgba(249,252,255,0.97)] transition-colors"
          >
            Đăng ký miễn phí
          </Link>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#181d26] py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between gap-10 pb-8 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Logo size={28} />
                  <span className="font-semibold text-white">SmartEdu</span>
                </div>
                <p className="text-sm text-white/45 max-w-xs leading-relaxed">
                  Nền tảng học tập thông minh, cá nhân hóa trải nghiệm học của bạn.
                </p>
              </div>

              <div className="flex gap-12">
                {FOOTER_COLS.map((col) => (
                  <div key={col.heading}>
                    <h4 className="text-sm font-medium text-white mb-3">{col.heading}</h4>
                    <ul className="space-y-2">
                      {col.links.map((link) => (
                        <li key={link}>
                          <a href="#" className="text-sm text-white/45 hover:text-white/75 transition-colors">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8 text-xs text-white/25">© 2026 SmartEdu. All rights reserved.</div>
          </div>
        </footer>

      </div>
    </div>
  );
}
