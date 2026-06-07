import { WorkspaceShell } from "@/components/WorkspaceShell";
import { RouteTransition } from "@/components/RouteTransition";

/**
 * Persistent workspace shell shared by /app, /settings, /history.
 *
 * Why this exists:
 * - Before: each route rendered its own <HistorySidebar/>, so the sidebar
 *   remounted on every navigation, flashing skeletons and shifting layout.
 * - After: the sidebar mounts once at this layout boundary and stays put.
 *   Only the inner RouteTransition's children swap on nav, with a smooth
 *   fade/slide that does NOT touch the sidebar or the page chrome.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell>
      <RouteTransition>{children}</RouteTransition>
    </WorkspaceShell>
  );
}
