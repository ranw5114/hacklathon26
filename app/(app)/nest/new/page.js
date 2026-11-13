"use client";

import PageIcon from "@/components/PageIcon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NestForm from "@/components/NestForm";
import PageTour from "@/components/PageTour";
import { useStored } from "@/lib/storage";

// Nest Builder: the form for a new test. Every new nest starts here, and the others are kept.
export default function NewNestPage() {
  const profile = useStored("profile");
  // Every visit to the Nest Builder starts with a blank form (Next.js otherwise keeps the old answers).
  const { bfcacheId } = useRouter();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/nest" className="text-sm font-semibold text-muted hover:underline">
        ← All nests
      </Link>
      <div className="mt-3 mb-6 flex items-end gap-4">
        <PageIcon icon="nest" move="bounce" size={64} label="Poke the nest" />
        <div>
          <span className="bubble text-sm">Let&apos;s build your nest, one twig at a time!</span>
          <h1 className="mt-3 text-4xl">Nest Builder</h1>
        </div>
        <div className="ml-auto self-start">
          <PageTour page="nest" />
        </div>
      </div>
      <NestForm key={bfcacheId} learner={profile} />
    </main>
  );
}
