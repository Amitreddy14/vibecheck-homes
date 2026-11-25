"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PRIVACY_NOTICE } from "@vch/shared";
import { acceptPrivacyNotice, type ConsentFormState } from "./actions";

const initialState: ConsentFormState = { error: null };

export function ConsentForm({
  defaultFirstName,
  today,
}: {
  defaultFirstName: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(acceptPrivacyNotice, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="noticeVersion" value={PRIVACY_NOTICE.version} />

      <label className="flex flex-col gap-2">
        <span className="font-bold">First name</span>
        <input
          name="firstName"
          defaultValue={defaultFirstName}
          maxLength={40}
          autoComplete="given-name"
          required
          className="h-14 rounded-md border-2 border-line bg-surface px-4 text-lg"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-bold">Date of birth</span>
        <input
          type="date"
          name="dateOfBirth"
          min="1900-01-01"
          max={today}
          autoComplete="bday"
          required
          aria-describedby="dob-help"
          className="h-14 rounded-md border-2 border-line bg-surface px-4 text-lg"
        />
        <span id="dob-help" className="text-sm text-muted">
          Others only see your age, never your birthday.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-md bg-tag-butter p-4 text-on-color">
        <input type="checkbox" name="agree" required className="mt-1 size-5 shrink-0" />
        <span>
          I&apos;m 18 or older and I agree to the{" "}
          <Link href="/privacy" target="_blank" className="font-bold underline">
            privacy notice
          </Link>
          .
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="rounded-md bg-tag-pink p-4 font-bold text-on-color">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-full border-2 border-line bg-primary px-6 font-bold text-on-color disabled:opacity-60"
      >
        {pending ? "Saving…" : "Agree and continue"}
      </button>
    </form>
  );
}
