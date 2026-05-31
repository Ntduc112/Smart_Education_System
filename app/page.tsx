import Link from "next/link";
import { Home, BookOpen, Sparkles } from "lucide-react";
import { Logo } from "./_components/Logo";
import { CoursesSection } from "./_components/CoursesSection";
import { SearchBar } from "./_components/SearchBar";
import { HeaderAuth } from "./_components/HeaderAuth";

const SIDEBAR_ITEMS = [
  { href: "/", label: "Trang chủ", icon: <Home size={22} strokeWidth={1.8} /> },
  { href: "/courses", label: "Khóa học", icon: <BookOpen size={22} strokeWidth={1.8} /> },
  { href: "#features", label: "Tính năng", icon: <Sparkles size={22} strokeWidth={1.8} /> },
];

const FEATURES = [
  {
    icon: "🤖",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    title: "AI Tutor cá nhân",
    desc: "Giải đáp mọi thắc mắc 24/7 với trợ lý AI được đào tạo chuyên sâu theo từng khóa học.",
  },
  {
    icon: "📊",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    title: "Theo dõi tiến độ",
    desc: "Hệ thống phân tích thông minh giúp bạn biết chính xác mình đang ở đâu và cần học gì tiếp theo.",
  },
  {
    icon: "🎯",
    color: "from-orange-400 to-rose-500",
    bg: "bg-orange-50",
    title: "Quiz thích ứng",
    desc: "Bài kiểm tra tự điều chỉnh độ khó theo năng lực, giúp củng cố kiến thức tối ưu.",
  },
  {
    icon: "🎓",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    title: "Giáo viên chất lượng",
    desc: "Đội ngũ giảng viên được kiểm duyệt kỹ, đảm bảo nội dung chuẩn và cập nhật.",
  },
  {
    icon: "📱",
    color: "from-pink-500 to-fuchsia-500",
    bg: "bg-pink-50",
    title: "Học mọi lúc mọi nơi",
    desc: "Giao diện tối ưu trên mọi thiết bị, hỗ trợ tải video offline để học không cần mạng.",
  },
  {
    icon: "🏆",
    color: "from-yellow-400 to-amber-500",
    bg: "bg-yellow-50",
    title: "Chứng chỉ hoàn thành",
    desc: "Nhận chứng chỉ được công nhận khi hoàn thành khóa học, nâng cao hồ sơ nghề nghiệp.",
  },
];

const STATS = [
  { value: "10,000+", label: "Học viên" },
  { value: "200+", label: "Khóa học" },
  { value: "4.9★", label: "Đánh giá" },
  { value: "24/7", label: "AI hỗ trợ" },
];

const FOOTER_COLS = [
  { heading: "Sản phẩm", links: ["Khóa học", "AI Tutor", "Chứng chỉ"] },
  { heading: "Công ty", links: ["Về chúng tôi", "Blog", "Tuyển dụng"] },
  { heading: "Hỗ trợ", links: ["Trợ giúp", "Liên hệ", "Điều khoản"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-screen w-[72px] bg-white border-r border-[#e0e2e6] z-30 flex flex-col items-center pt-[76px] gap-1">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="group relative w-full flex flex-col items-center gap-1 py-3 text-[rgba(4,14,32,0.45)] hover:text-[#1b61c9] transition-colors"
          >
            <span className="group-hover:scale-110 transition-transform duration-200 inline-flex">
              {item.icon}
            </span>
            <span className="text-[10px] font-medium tracking-tight leading-tight text-center">
              {item.label}
            </span>
            <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#181d26] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </span>
          </Link>
        ))}
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 ml-[72px] flex flex-col min-w-0">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#e0e2e6] shadow-sm h-[60px] flex items-center px-6">
          <div className="flex-1 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <Logo size={32} />
              <span className="text-[22px] font-bold text-[#1b61c9] tracking-tight leading-none">SmartEdu</span>
            </Link>
          </div>
          <div style={{ width: 520, flexShrink: 0, transform: "translateX(-10px)" }}>
            <SearchBar />
          </div>
          <div className="flex-1 min-w-0 flex justify-end">
            <HeaderAuth />
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative px-8 pt-20 pb-16 text-center overflow-hidden">
          {/* Gradient background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(27,97,201,0.08) 0%, rgba(255,255,255,0) 70%)",
            }}
          />
          {/* Decorative blobs */}
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-16 w-48 h-48 rounded-full bg-violet-100/40 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto">
            {/* AI badge */}
            <div className="inline-flex items-center gap-2 bg-[#1b61c9]/10 text-[#1b61c9] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-[#1b61c9]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b61c9] animate-pulse" />
              Được hỗ trợ bởi AI · Cá nhân hóa 100%
            </div>

            <h1 className="text-5xl md:text-6xl font-light text-[#181d26] leading-tight mb-6">
              Học tập thông minh hơn với
              <span className="font-black bg-gradient-to-r from-[#1b61c9] to-[#5b9ef8] bg-clip-text text-transparent block mt-1">
                AI cá nhân hóa
              </span>
            </h1>

            <p className="text-lg text-[rgba(4,14,32,0.65)] leading-relaxed tracking-[0.18px] mb-10 max-w-2xl mx-auto">
              Hệ thống giáo dục thông minh giúp học viên tiếp cận kiến thức theo cách phù hợp nhất
              với bản thân, được hỗ trợ bởi AI Tutor 24/7.
            </p>

            {/* CTA buttons */}
            <div className="flex items-center justify-center gap-4 mb-14">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#1b61c9] text-white font-semibold text-sm px-7 py-3 rounded-xl shadow-lg shadow-[#1b61c9]/25 hover:bg-[#1753b3] hover:-translate-y-0.5 transition-all duration-200"
              >
                Bắt đầu miễn phí
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-white text-[#1b61c9] font-semibold text-sm px-7 py-3 rounded-xl border border-[#1b61c9]/30 hover:border-[#1b61c9] hover:-translate-y-0.5 transition-all duration-200"
              >
                Khám phá khóa học
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {STATS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#181d26]">{s.value}</div>
                    <div className="text-xs text-[rgba(4,14,32,0.5)] mt-0.5">{s.label}</div>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="w-px h-8 bg-[#e0e2e6]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Courses (client component) ── */}
        <CoursesSection />

        {/* ── Features ── */}
        <section id="features" className="bg-[#f8fafc] py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block text-xs font-semibold text-[#1b61c9] uppercase tracking-widest mb-3">Tính năng nổi bật</span>
              <h2 className="text-3xl font-semibold text-[#181d26] mb-3">Tại sao chọn SmartEdu?</h2>
              <p className="text-[rgba(4,14,32,0.65)] tracking-[0.18px]">Tất cả những gì bạn cần để học tập hiệu quả</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="group bg-white rounded-2xl p-6 border border-[#e0e2e6] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1b61c9]/08 transition-all duration-200 cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-semibold text-[#181d26] mb-2">{feat.title}</h3>
                  <p className="text-sm text-[rgba(4,14,32,0.65)] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative py-20 px-8 text-center overflow-hidden" style={{ background: "linear-gradient(135deg, #1b61c9 0%, #254fad 60%, #1a3a7a 100%)" }}>
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
              🚀 Hơn 10,000 học viên đã tin tưởng
            </div>
            <h2 className="text-3xl font-semibold text-white mb-3">Sẵn sàng bắt đầu hành trình?</h2>
            <p className="text-white/70 mb-8 tracking-[0.18px]">Tham gia cùng hàng nghìn học viên đang học tập trên SmartEdu</p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-block bg-white text-[#1b61c9] font-semibold text-sm px-8 py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                Đăng ký miễn phí
              </Link>
              <Link
                href="/courses"
                className="inline-block bg-white/15 text-white font-semibold text-sm px-8 py-3 rounded-xl border border-white/30 hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200"
              >
                Xem khóa học
              </Link>
            </div>
          </div>
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
