import Chick from "@/components/Chick";

// Temporary page for areas we haven't built yet.
export default function ComingSoon({ title, kicker, chick, bubble, children }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center">
      <span className="bubble">{bubble}</span>
      <Chick variant={chick} size={130} className="mt-6" />
      <p className="label-small mt-6">{kicker}</p>
      <h1 className="text-4xl">{title}</h1>
      <div className="card mt-6 w-full text-left text-muted">{children}</div>
    </main>
  );
}
