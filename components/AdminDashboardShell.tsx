import {
  adminShellClass,
  adminHeadingClass,
  adminPlaceholderClass,
} from "./AdminDashboardShellStyles";

export function AdminDashboardShell() {
  return (
    <main className={adminShellClass}>
      <h1 className={adminHeadingClass}>Insights</h1>
      <p className={adminPlaceholderClass}>
        Reports coming soon (7.4b).
      </p>
    </main>
  );
}
