/**
 * Privacy notice shown before we collect anything (DPDP Act 2023, s.5).
 * The version is stored with every consent. Any change to what we collect or why
 * means a NEW version (v2, ...) and asking everyone again, so never edit v1 in place
 * except for typos.
 */

export type NoticeSection = {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export const PRIVACY_NOTICE = {
  version: "v1",
  updated: "2026-11-25",
  summary:
    "We use your details to build your profile and match you with flatmates. Other people never see your email, phone number or exact date of birth. You can delete everything at any time.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "Vibecheck Homes is a flatmate-matching app, starting in Chennai. It is in a private test, so features may change. We decide what data is collected and why, so we are responsible for it.",
      ],
    },
    {
      heading: "What we collect",
      items: [
        "From Google when you sign in: your name, email address and profile picture link.",
        "From you: first name, date of birth, gender, whether you study or work, your college or company, what home and flatmate you're looking for, your answers to the vibe quiz, your photos and a short bio.",
        "Basic technical logs (like sign-in times) that our hosting providers keep to run the service securely.",
      ],
    },
    {
      heading: "Why we use it",
      items: [
        "To create your profile and suggest flatmates you're likely to get along with.",
        "To keep Vibecheck Homes for adults (18+) and to keep people safe.",
        "To fix problems and protect the service from misuse.",
      ],
      paragraphs: ["We don't sell your data or use it for ads."],
    },
    {
      heading: "Who can see what",
      items: [
        "Other members can see your first name, age, gender, college or company, photos, bio and quiz results.",
        "Nobody else sees your email, phone number or exact date of birth.",
        "Our service providers store and process data for us: Supabase (database and files, in Mumbai, India), Vercel (website hosting) and Google (sign-in).",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Until you delete your account. Deleting removes your data from the app straight away; encrypted backup copies are gone within 30 days.",
      ],
    },
    {
      heading: "Your rights",
      items: [
        "See, correct and download your data.",
        "Withdraw consent by deleting your account. You can't use the app without this consent, because matching needs these details.",
        "Raise a complaint with us, and if you're not satisfied, with the Data Protection Board of India.",
      ],
      paragraphs: [
        "During the private test, contact the founder directly for any of these. A contact email and in-app settings will be added before the public launch.",
      ],
    },
    {
      heading: "Under 18?",
      paragraphs: [
        "Vibecheck Homes is only for people 18 and over. If we learn that someone under 18 has signed up, we delete their account.",
      ],
    },
  ] satisfies readonly NoticeSection[],
} as const;

export type NoticeVersion = typeof PRIVACY_NOTICE.version;
