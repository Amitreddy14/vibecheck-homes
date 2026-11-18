import { APP_NAME, LAUNCH_CITY } from "@vch/shared";

export default function HomePage() {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Coming soon to {LAUNCH_CITY}.</p>
    </main>
  );
}
