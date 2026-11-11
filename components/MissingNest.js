import Link from "next/link";
import Chick from "@/components/Chick";

// Shown for an old or mistyped link, or a nest that was deleted.
export default function MissingNest() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bubble">This nest flew away!</span>
      <Chick variant="mint" mood="sad" size={110} />
      <p className="text-muted">It may have been deleted.</p>
      <Link href="/nest" className="btn-primary">
        See all nests
      </Link>
    </main>
  );
}
