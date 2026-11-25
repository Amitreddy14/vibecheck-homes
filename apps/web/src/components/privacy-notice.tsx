import { PRIVACY_NOTICE } from "@vch/shared";

/** The full privacy notice, rendered from the single source in @vch/shared. */
export function PrivacyNotice({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Version {PRIVACY_NOTICE.version.slice(1)} · updated {PRIVACY_NOTICE.updated}
      </p>
      {PRIVACY_NOTICE.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <Heading className="font-display text-xl font-bold">{section.heading}</Heading>
          {"items" in section && section.items ? (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {"paragraphs" in section && section.paragraphs
            ? section.paragraphs.map((p) => <p key={p}>{p}</p>)
            : null}
        </section>
      ))}
    </div>
  );
}
