// The tutorial cards for each area of the app. Each card has a picture (emoji for now,
// to be replaced with custom graphics), a title (shown in the chick's speech bubble), and a short text.
// Edit the wording here; the cards update everywhere.

export const TUTORIALS = {
  barn: [
    {
      picture: "chick",
      chick: "sunny",
      title: "Welcome to the Barn!",
      text: "This is your home base. Your study buddy lives here, along with four places that help you study.",
    },
    {
      picture: "nest",
      chick: "mint",
      title: "Nest Builder",
      text: "Tell us about your next test and your goal grade. We'll build a day-by-day plan, taught the way you learn best.",
    },
    {
      picture: "hen",
      chick: "scholar",
      title: "The Chicken Coop",
      text: "Stuck on a problem? Ask Scholar, your AI tutor, or snap a photo of your homework.",
    },
    {
      picture: "egg",
      chick: "eggy",
      title: "Egg Timer",
      text: "Focus in short sessions. The timer keeps running even when you switch pages or tabs.",
    },
    {
      picture: "calendar",
      chick: "peach",
      title: "The Roost",
      text: "Your calendar: your study plan, your classes, and the best free times to study.",
    },
    {
      picture: "chick",
      chick: "sunny",
      title: "Grow your flock!",
      text: "Studying hatches chicks for your flock: finish a focus session or ace a quiz. You also earn corn, which you spend dressing up your chicks in the Henhouse. Tap your corn count at the top, or visit the Henhouse, to see how to earn it. Keep your chicks safe by studying on your plan days!",
    },
  ],

  nest: [
    {
      picture: "nest",
      chick: "mint",
      title: "One nest per test",
      text: "Got more than one test coming up? Build a nest for each one on the Nests page. Your chick dresses up for the subject, and every plan shows up on the Roost calendar.",
    },
    {
      picture: "egg",
      chick: "mint",
      title: "Your nest",
      text: "Each egg on the path is a short lesson, taught your way, plus a 5-question quiz. Tap the wiggling egg to crack it open!",
    },
    {
      picture: "chick",
      chick: "mint",
      title: "Hatch it, don't fry it!",
      text: "Get 100% and the egg hatches into a chick for your coop. Reach your goal grade for a golden egg. Every concept you understand earns 10 corn. Score below your goal and the egg gets fried, so retry it!",
    },
    {
      picture: "chest",
      chick: "mint",
      title: "Corn chests",
      text: "Every few levels there's a chest. Finish the level before it, then tap it for 15–30 corn to spend in the Henhouse.",
    },
    {
      picture: "flag",
      chick: "scholar",
      title: "Spot a wrong answer?",
      text: "Quizzes are written by AI, which can make mistakes. Tap \"This answer looks wrong\" and that question won't count against you.",
    },
    {
      picture: "trophy",
      chick: "mint",
      title: "The mock exam",
      text: "Finish every level to unlock a practice test. You'll get a predicted grade for the real thing.",
    },
    {
      picture: "pencil",
      chick: "mint",
      title: "Grades changed?",
      text: "Tap Edit next to your grades anytime, like after you get a test back. Your progress stays.",
    },
  ],

  coop: [
    {
      picture: "hen",
      chick: "scholar",
      title: "Meet Scholar",
      text: "Ask anything about your schoolwork. Scholar knows what you're studying and explains things your way.",
    },
    {
      picture: "camera",
      chick: "scholar",
      title: "Photos and files",
      text: "Tap the camera to add a photo of a problem, or attach files: PDFs, Word, PowerPoint, Excel, notes, code, audio, or video, even big ones. Scholar reads them and walks you through it.",
    },
    {
      picture: "chat",
      chick: "scholar",
      title: "Keep asking",
      text: "Try follow-ups like \"Can you explain step 2 again?\" or \"Quiz me on this.\" Scholar remembers the conversation.",
    },
    {
      picture: "nest",
      chick: "scholar",
      title: "All your chats, saved",
      text: "Every visit starts a fresh chat, and your old ones stay in the chat list. Make folders, name them, pick a color, and drag chats in (or use a chat's ⋯ menu).",
    },
  ],

  timer: [
    {
      picture: "egg",
      chick: "eggy",
      title: "The Egg Timer",
      text: "Pick a preset, like 25 minutes of focus and a 5-minute break, then press Start. Your chick keeps an egg warm while you focus. Finish and it hatches, plus you earn 5 corn!",
    },
    {
      picture: "repeat",
      chick: "eggy",
      title: "It keeps going",
      text: "Switch pages or tabs and the timer keeps running. You'll see it in the corner and in your browser tab.",
    },
    {
      picture: "fried",
      chick: "eggy",
      title: "Don't let it fry!",
      text: "Stop early, or stay paused more than 5 minutes, and your egg gets fried. Skip a study-plan day and one of your chicks becomes a drumstick!",
    },
  ],

  todo: [
    {
      picture: "todo",
      chick: "sunny",
      title: "Your To-Do List",
      text: "Every day's lessons from all your nests show up here on their own. Passing a lesson's quiz checks it off for you.",
    },
    {
      picture: "homework",
      chick: "sunny",
      title: "Add homework",
      text: "Tap + Homework to add an assignment, its class, and when it's due. Tap the box to check it off when you're done.",
    },
    {
      picture: "repeat",
      chick: "sunny",
      title: "Sync Schoology or Classroom",
      text: "Tap Sync and paste your Schoology calendar link or a Google Classroom class calendar link. Assignments and due dates come in automatically, and stay up to date.",
    },
    {
      picture: "bell",
      chick: "sunny",
      title: "Reminders",
      text: "Turn on reminders to get a cluck when homework is due within a day or overdue, plus an evening nudge if today's lessons aren't done.",
    },
  ],

  roost: [
    {
      picture: "calendar",
      chick: "peach",
      title: "The Roost",
      text: "Switch between Month, Week, and Day. Tap any day to see it hour by hour.",
    },
    {
      picture: "repeat",
      chick: "peach",
      title: "Sync your calendar",
      text: "Tap \"Sync calendar\" to add your classes and activities, or try the sample schedule.",
    },
    {
      picture: "idea",
      chick: "peach",
      title: "Study-time suggestions",
      text: "We find free time for your study plan around your schedule. Tap a suggestion to open the Egg Timer.",
    },
    {
      picture: "chick",
      chick: "peach",
      title: "Study eggs",
      text: "Days you hatched an egg with the Egg Timer get a little chick on the calendar.",
    },
  ],
};
