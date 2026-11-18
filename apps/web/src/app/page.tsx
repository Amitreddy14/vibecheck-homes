import { APP_NAME, LAUNCH_CITY } from "@vch/shared";

const tags = [
  { label: "Early bird", className: "bg-tag-pink" },
  { label: "Super tidy", className: "bg-tag-butter" },
  { label: "Veg", className: "bg-tag-sky" },
  { label: "No smoking", className: "bg-tag-mint" },
];

/** Placeholder home page: shows the design tokens working until real screens exist. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <p className="text-sm text-muted">Coming soon to {LAUNCH_CITY}</p>
      <h1 className="font-display text-4xl font-bold leading-tight">{APP_NAME}</h1>
      <p className="text-lg">Find flatmates you can actually live with.</p>

      <ul className="flex flex-wrap gap-2" aria-label="Example vibe tags">
        {tags.map((tag) => (
          <li
            key={tag.label}
            className={`rounded-full px-3 py-1.5 text-sm font-bold text-on-color ${tag.className}`}
          >
            {tag.label}
          </li>
        ))}
      </ul>

      <div className="rounded-md bg-callout p-4 text-on-color">
        <p className="font-bold">Why you match</p>
        <p>You both sleep before midnight and hate dirty dishes.</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="h-14 rounded-full border-2 border-line bg-surface px-6 font-bold"
        >
          Not for me
        </button>
        <button
          type="button"
          className="h-14 rounded-full border-2 border-on-color bg-primary px-7 font-bold text-on-color"
        >
          Say hi
        </button>
      </div>
    </main>
  );
}
