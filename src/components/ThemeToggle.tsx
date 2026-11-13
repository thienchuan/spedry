import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";

const OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

/** Compact icon button that flips between dark and light. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex size-9 items-center justify-center rounded-xl transition-colors hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
      style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Two-option segmented control for picking a theme explicitly. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-xl p-0.5"
      style={{ background: "var(--surface-strong)", border: "1px solid var(--border)" }}
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = id === theme;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className="flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            style={{
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--on-accent)" : "var(--muted)",
            }}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
