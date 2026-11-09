import Chick from "@/components/Chick";

// Shows an AI-written lesson: intro, teaching sections, worked example, key points, video link.
export default function Lesson({ lesson, avatar, videoSources }) {
  // Search YouTube for the topic, preferring the student's favorite channel if they named one.
  const favoriteChannel = videoSources?.split(",")[0]?.trim();
  const videoQuery = [lesson.videoSearch, favoriteChannel].filter(Boolean).join(" ");
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQuery)}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <Chick variant={avatar} size={70} className="shrink-0" />
        <span className="bubble text-sm">{lesson.hook}</span>
      </div>

      {lesson.sections.map((section) => (
        <section key={section.heading} className="card">
          <h2 className="text-xl">{section.heading}</h2>
          <p className="mt-2 leading-relaxed whitespace-pre-line">{section.body}</p>
        </section>
      ))}

      <section className="card bg-chick/40">
        <p className="label-small">Worked example</p>
        <p className="mt-1 font-display text-lg font-semibold">{lesson.example.problem}</p>
        <ol className="mt-3 flex flex-col gap-2">
          {lesson.example.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white text-sm font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-semibold">Answer: {lesson.example.answer}</p>
      </section>

      <section className="card">
        <h2 className="text-xl">Remember</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          {lesson.keyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary self-start">
        ▶ Find a video on this
      </a>
    </div>
  );
}
