"use client";

import { useState } from "react";
import { BookOpen, ClipboardList, Eye, EyeOff, Lock, Mail, Trash2, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/_components/ConfirmModal";
import { getApiError } from "@/lib/api/error";
import {
  type CourseCollaborator,
  useCourseCollaborators,
  useCreateCourseAssistant,
  useRevokeCourseCollaborator,
  useUpdateCourseCollaborator,
} from "./collaborators.hook";

export function CollaboratorModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lessons, setLessons] = useState(true);
  const [quizzes, setQuizzes] = useState(true);
  const [revoking, setRevoking] = useState<CourseCollaborator | null>(null);
  const { data: collaborators = [], isLoading } = useCourseCollaborators(courseId);
  const create = useCreateCourseAssistant(courseId);
  const update = useUpdateCourseCollaborator(courseId);
  const revoke = useRevokeCourseCollaborator(courseId);

  // name/password bỏ trống = thêm tài khoản trợ giảng có sẵn theo email.
  const handleCreate = () => create.mutate({
    email: email.trim(),
    name: name.trim() || undefined,
    password: password || undefined,
    can_manage_lessons: lessons,
    can_manage_quizzes: quizzes,
  }, {
    onSuccess: (result) => {
      setName("");
      setEmail("");
      setPassword("");
      if (!result.created) toast.success("Đã thêm trợ giảng có sẵn vào khóa học");
      else if (result.emailSent) toast.success("Đã tạo tài khoản và gửi thông tin đăng nhập qua email");
      else toast.warning("Đã tạo tài khoản nhưng gửi email thất bại. Hãy gửi mật khẩu cho trợ giảng theo cách khác.");
    },
    onError: (error) => toast.error(getApiError(error, "Không thể thêm trợ giảng")),
  });

  const togglePermission = (collaborator: CourseCollaborator, field: "lessons" | "quizzes") => update.mutate({
    id: collaborator.id,
    permissions: {
      can_manage_lessons: field === "lessons" ? !collaborator.can_manage_lessons : collaborator.can_manage_lessons,
      can_manage_quizzes: field === "quizzes" ? !collaborator.can_manage_quizzes : collaborator.can_manage_quizzes,
    },
  }, { onError: () => toast.error("Không thể cập nhật quyền") });

  const handleRevoke = () => revoking && revoke.mutate(revoking.id, {
    onSuccess: () => {
      setRevoking(null);
      toast.success("Đã thu hồi quyền trợ giảng");
    },
    onError: () => toast.error("Không thể thu hồi quyền"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#DCE6F4] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#181d26]">Trợ giảng khóa học</h2>
            <p className="mt-1 text-sm text-[rgba(4,14,32,0.5)]">Tạo tài khoản trợ giảng, thông tin đăng nhập sẽ được gửi qua email.</p>
          </div>
          <button aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 text-[rgba(4,14,32,0.45)] hover:bg-[#F4F8FE]"><X size={18} /></button>
        </div>

        <div className="space-y-4 border-b border-[#DCE6F4] px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#181d26]">Tên trợ giảng</label>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-[#DCE6F4] px-3 py-2.5 text-sm outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#181d26]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" size={16} />
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="trogiang@example.com"
                  className="w-full rounded-xl border border-[#DCE6F4] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10" />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#181d26]">Mật khẩu tạm</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)]" size={16} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border border-[#DCE6F4] py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#1b61c9] focus:ring-2 focus:ring-[#1b61c9]/10" />
              <button type="button" aria-label="Hiện mật khẩu" onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(4,14,32,0.35)] hover:text-[#181d26]">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[rgba(4,14,32,0.45)]">Trợ giảng sẽ được nhắc đổi mật khẩu ở lần đăng nhập đầu tiên. Nếu email đã là tài khoản trợ giảng, tên và mật khẩu được bỏ qua.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle icon={<BookOpen size={16} />} label="Quản lý bài giảng" description="Tạo, sửa, sắp xếp chương và bài học" checked={lessons} onChange={setLessons} />
            <PermissionToggle icon={<ClipboardList size={16} />} label="Quản lý quiz" description="Tạo, sửa câu hỏi và cấu hình quiz" checked={quizzes} onChange={setQuizzes} />
          </div>
          <button onClick={handleCreate} disabled={!email.trim() || (!lessons && !quizzes) || create.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b61c9] py-2.5 text-sm font-semibold text-white hover:bg-[#254fad] disabled:opacity-50">
            <UserRoundPlus size={16} /> {create.isPending ? "Đang tạo..." : "Thêm trợ giảng"}
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <h3 className="text-sm font-semibold text-[#181d26]">Danh sách trợ giảng</h3>
          {isLoading ? <p className="py-5 text-sm text-[rgba(4,14,32,0.45)]">Đang tải...</p> : collaborators.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#C2D4EE] bg-[#F4F8FE] px-4 py-7 text-center text-sm text-[rgba(4,14,32,0.5)]">Khóa học chưa có trợ giảng.</p>
          ) : collaborators.map((collaborator) => (
            <div key={collaborator.id} className="rounded-2xl border border-[#DCE6F4] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF1FC] text-sm font-semibold text-[#1b61c9]">{collaborator.user.name.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#181d26]">{collaborator.user.name}</p>
                  <p className="truncate text-xs text-[rgba(4,14,32,0.48)]">{collaborator.user.email}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Đang hoạt động</span>
                <button aria-label="Thu hồi quyền" onClick={() => setRevoking(collaborator)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-13">
                <SmallPermission label="Bài giảng" checked={collaborator.can_manage_lessons} onClick={() => togglePermission(collaborator, "lessons")} />
                <SmallPermission label="Quiz" checked={collaborator.can_manage_quizzes} onClick={() => togglePermission(collaborator, "quizzes")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal open={revoking !== null} title="Thu hồi quyền trợ giảng?"
        message={revoking ? `${revoking.user.name} sẽ không thể tiếp tục chỉnh sửa khóa học này.` : undefined}
        confirmLabel="Thu hồi quyền" onCancel={() => setRevoking(null)}
        onConfirm={handleRevoke} isLoading={revoke.isPending} />
    </div>
  );
}

function PermissionToggle({ icon, label, description, checked, onChange }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${checked ? "border-[#1b61c9]/35 bg-[#EAF1FC]" : "border-[#DCE6F4]"}`}>
    <span className="text-[#1b61c9]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#181d26]">{label}</span><span className="block text-[11px] text-[rgba(4,14,32,0.45)]">{description}</span></span>
    <span className={`relative h-5 w-9 rounded-full ${checked ? "bg-[#1b61c9]" : "bg-[#C5D4EA]"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} /></span>
  </button>;
}

function SmallPermission({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${checked ? "border-[#1b61c9]/25 bg-[#EAF1FC] text-[#1b61c9]" : "border-[#DCE6F4] text-[rgba(4,14,32,0.4)]"}`}>{checked ? "✓ " : ""}{label}</button>;
}
