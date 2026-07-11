export default function ClassroomLoading() {
  return (
    <div className="min-h-screen bg-[#EFF5FE]">
      <div className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-6">
        <div className="h-24 rounded-3xl border border-[#DCE6F4] bg-white" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-[560px] rounded-3xl border border-[#DCE6F4] bg-white" />
          <div className="h-[680px] rounded-3xl border border-[#DCE6F4] bg-white" />
        </div>
      </div>
    </div>
  );
}
