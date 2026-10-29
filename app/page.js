import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
        Tell us your goal grade. We&apos;ll plan how to get there.
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">
        Your AI study coach builds a day-by-day plan for your next test, taught the way you learn
        best, and ends with a mock exam that predicts your grade.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/setup" className="btn-primary">
          Get started
        </Link>
        <Link href="/plan" className="btn-secondary">
          My plan
        </Link>
      </div>
    </main>
  );
}
