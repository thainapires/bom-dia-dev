import { GitMerge, GitPullRequest, History, LayoutDashboard, Settings } from "lucide-react";

const inertIcons = [
  { Icon: GitMerge, label: "Merge" },
  { Icon: GitPullRequest, label: "Pull request" },
  { Icon: History, label: "Histórico" },
  { Icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-14 flex-none flex-col items-center gap-2 self-start border-r border-white/5 bg-card py-4">
      <button
        type="button"
        title="Dashboard"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white"
      >
        <LayoutDashboard size={20} strokeWidth={1.75} />
      </button>
      {inertIcons.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          title={`${label} (em breve)`}
          disabled
          className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-white/40"
        >
          <Icon size={20} strokeWidth={1.75} />
        </button>
      ))}
    </aside>
  );
}
