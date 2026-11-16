"use client";

import { useParams } from "next/navigation";
import MissingNest from "@/components/MissingNest";
import SavedProblems from "@/components/SavedProblems";
import { useNest } from "@/lib/nests";

// The problems the student starred in one nest.
export default function NestSavedPage() {
  const { nestId } = useParams();
  const nest = useNest(nestId);
  if (nest === undefined) return null;
  if (!nest) return <MissingNest />;
  return <SavedProblems nestId={nestId} nestName={nest.test.subject} />;
}
