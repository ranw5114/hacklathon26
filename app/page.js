export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">Hello, Hacklathon!</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Your AI study coach is on the way. Check the AI connection at{" "}
        <a href="/api/hello" className="font-medium underline">
          /api/hello
        </a>
        .
      </p>
    </main>
  );
}
