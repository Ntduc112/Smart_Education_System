"use client";

import { X, Route, Loader2, Check, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

interface RoadmapOption {
  id:              string;
  title:           string;
  description:     string;
  thumbnail:       string | null;
  proposal_status: ProposalStatus;
}

function StatusTag({ status }: { status: Exclude<ProposalStatus, null> }) {
  const map = {
    PENDING:  { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700",   icon: <Clock size={12} /> },
    APPROVED: { label: "Đã trong lộ trình", cls: "bg-emerald-50 text-emerald-700", icon: <Check size={12} /> },
    REJECTED: { label: "Bị từ chối", cls: "bg-red-50 text-red-600",      icon: <X size={12} /> },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${map.cls}`}>
      {map.icon} {map.label}
    </span>
  );
}

export function RoadmapModal({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const queryKey = ["teacher", "roadmap-proposals", courseId];

  const { data: roadmaps = [], isLoading } = useQuery<RoadmapOption[]>({
    queryKey,
    queryFn: async () => (await api.get<{ roadmaps: RoadmapOption[] }>(`/teacher/courses/${courseId}/roadmap-proposals`)).data.roadmaps,
  });

  const propose = useMutation({
    mutationFn: async (roadmapId: string) =>
      api.post(`/teacher/courses/${courseId}/roadmap-proposals`, { roadmap_id: roadmapId }),
    onSuccess: () => {
      toast.success("Đã gửi đề xuất, chờ admin duyệt");
      qc.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("Gửi đề xuất thất bại, vui lòng thử lại"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-[500px] max-w-[92vw] max-h-[80vh] flex flex-col mx-4"
        style={{ boxShadow: "rgba(0,0,0,0.32) 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 32px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#DCE6F4]">
          <div className="w-10 h-10 rounded-xl bg-[#1b61c9]/[0.09] flex items-center justify-center text-[#1b61c9] shrink-0">
            <Route size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[17px] font-semibold text-[#181d26]">Đề xuất vào lộ trình</h3>
            <p className="text-xs text-[rgba(4,14,32,0.45)] mt-0.5">Admin sẽ duyệt và sắp xếp vị trí khóa học trong lộ trình</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f0f2f5] text-[rgba(4,14,32,0.5)]"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-[rgba(4,14,32,0.4)]"><Loader2 size={20} className="animate-spin" /></div>
          ) : roadmaps.length === 0 ? (
            <p className="text-sm text-center text-[rgba(4,14,32,0.45)] py-10">Chưa có lộ trình nào được công bố.</p>
          ) : (
            roadmaps.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#DCE6F4]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#181d26] line-clamp-1">{r.title}</p>
                  <p className="text-xs text-[rgba(4,14,32,0.45)] line-clamp-1 mt-0.5">{r.description}</p>
                </div>
                {r.proposal_status ? (
                  <StatusTag status={r.proposal_status} />
                ) : (
                  <button
                    onClick={() => propose.mutate(r.id)}
                    disabled={propose.isPending}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1b61c9] text-white hover:bg-[#254fad] transition-colors disabled:opacity-50"
                  >
                    Đề xuất
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
