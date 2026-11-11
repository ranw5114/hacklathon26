// Common tests and classes for the Nest Builder's subject menu, each with a short built-in study
// guide (format, scoring, topics). The guide is given to the AI so plans, lessons, quizzes, and mock
// exams match the real thing, e.g. AMC 10 lessons use AMC-style problems.
// Facts are kept to what's stable year to year; the AI fills in details from what it knows.

export const SUBJECTS = [
  // --- Standardized tests ---
  {
    id: "sat",
    label: "SAT",
    group: "Standardized tests",
    kind: "test",
    defaultTopic: "The whole SAT (Reading and Writing + Math)",
    guide: `Digital SAT (College Board), taken in the Bluebook app. Two sections, each split into two adaptive modules (the second module's difficulty depends on the first): Reading and Writing (54 questions, 64 minutes) and Math (44 questions, 70 minutes). Scored 400-1600 (200-800 per section). A calculator (including the built-in Desmos) is allowed for all of Math. Reading and Writing uses short passages with one question each, in four areas: Craft and Structure, Information and Ideas, Standard English Conventions, Expression of Ideas. Math covers Algebra, Advanced Math, Problem-Solving and Data Analysis, and Geometry and Trigonometry; most questions are multiple choice and some are student-produced responses. No penalty for wrong answers, so never leave one blank.`,
  },
  {
    id: "psat",
    label: "PSAT/NMSQT",
    group: "Standardized tests",
    kind: "test",
    defaultTopic: "The whole PSAT (Reading and Writing + Math)",
    guide: `Digital PSAT/NMSQT (College Board), same structure and question types as the digital SAT, slightly easier: Reading and Writing (54 questions, 64 minutes) and Math (44 questions, 70 minutes), each in two adaptive modules. Scored 320-1520. Juniors' scores can qualify for National Merit through the Selection Index. Calculator (including Desmos) allowed for all of Math. Reading and Writing areas: Craft and Structure, Information and Ideas, Standard English Conventions, Expression of Ideas. Math: Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry. No penalty for guessing.`,
  },
  {
    id: "act",
    label: "ACT",
    group: "Standardized tests",
    kind: "test",
    defaultTopic: "The whole ACT",
    guide: `ACT college admissions test. Core sections: English (grammar, punctuation, sentence structure, rhetorical skills in passages), Math (pre-algebra through basic trigonometry; calculator allowed), and Reading (comprehension of passages); Science (reading graphs, tables, and experiments, not memorized facts) and the essay are optional on the current version. Scores are 1-36 per section and a composite. Questions are multiple choice and fast-paced, so timing strategy matters. No penalty for guessing.`,
  },
  {
    id: "amc8",
    label: "AMC 8",
    group: "Math competitions",
    kind: "test",
    defaultTopic: "The whole AMC 8",
    guide: `AMC 8 (Mathematical Association of America), for students in grade 8 and below. 25 multiple-choice questions (5 choices each) in 40 minutes, no calculator. Score = number correct (no penalty for wrong answers). Problems get harder as they go. Topics: arithmetic and number sense, fractions/percents/ratios, basic algebra, counting and simple probability, number theory (primes, divisibility), and geometry (area, perimeter, angles, the Pythagorean theorem). Rewards clever problem solving over long computation.`,
  },
  {
    id: "amc10",
    label: "AMC 10",
    group: "Math competitions",
    kind: "test",
    defaultTopic: "The whole AMC 10",
    guide: `AMC 10 (Mathematical Association of America), for students in grade 10 and below. 25 multiple-choice questions (5 choices each, A-E) in 75 minutes, no calculator. Scoring: 6 points per correct answer, 1.5 points per blank, 0 for a wrong answer (maximum 150), so guessing blindly hurts; skip questions you can't narrow down. Problems roughly increase in difficulty; the last 10 are much harder. Topics (no calculus): algebra (equations, functions, sequences and series, inequalities), geometry (triangles, circles, polygons, similar figures, coordinate geometry, areas, the Pythagorean theorem), number theory (divisibility, primes, remainders/modular arithmetic, digits), and counting and probability (permutations, combinations, complementary counting, casework, expected value). High scorers qualify for the AIME. Good preparation: timed practice with past AMC 10 problems, learning standard tricks, and accuracy on the first 15 questions.`,
  },
  {
    id: "amc12",
    label: "AMC 12",
    group: "Math competitions",
    kind: "test",
    defaultTopic: "The whole AMC 12",
    guide: `AMC 12 (Mathematical Association of America), for students in grade 12 and below. Same format as the AMC 10: 25 multiple-choice questions (A-E) in 75 minutes, no calculator; 6 points correct, 1.5 blank, 0 wrong (max 150). Covers everything on the AMC 10 (algebra, geometry, number theory, counting and probability) plus precalculus: trigonometry, logarithms and exponentials, complex numbers, polynomials and their roots, and more advanced functions. No calculus. High scorers qualify for the AIME.`,
  },
  {
    id: "aime",
    label: "AIME",
    group: "Math competitions",
    kind: "test",
    defaultTopic: "The whole AIME",
    guide: `AIME (American Invitational Mathematics Examination), by invitation from high AMC 10/12 scores. 15 questions in 3 hours, no calculator. Every answer is an integer from 000 to 999 (no multiple choice). Score = number correct (0-15). Much harder than the AMC: multi-step problems in algebra, geometry, number theory, and combinatorics/probability that need clever insights and careful computation. Used with AMC scores to qualify for the USA(J)MO.`,
  },
  {
    id: "mathcounts",
    label: "MATHCOUNTS",
    group: "Math competitions",
    kind: "test",
    defaultTopic: "MATHCOUNTS competition prep",
    guide: `MATHCOUNTS, a middle school math competition. Rounds include Sprint (30 problems in 40 minutes, no calculator), Target (8 problems in pairs, calculator allowed), Team, and the Countdown round (fast head-to-head). Topics: arithmetic, algebra, geometry, counting and probability, number theory, and statistics, at a middle school level but with tricky problem solving. Speed and accuracy both matter.`,
  },
  // --- AP exams ---
  {
    id: "apchem",
    label: "AP Chemistry",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Chemistry (College Board). Exam: multiple-choice section and a free-response section (long and short questions involving calculations, explanations, and lab/experimental design), scored 1-5. A periodic table and equation sheet are provided. Units: 1 Atomic Structure and Properties; 2 Compound Structure and Properties (bonding, Lewis structures, VSEPR); 3 Properties of Substances and Mixtures (IMFs, gases, solutions, spectroscopy); 4 Chemical Reactions (stoichiometry, types of reactions); 5 Kinetics; 6 Thermochemistry; 7 Equilibrium; 8 Acids and Bases; 9 Thermodynamics and Electrochemistry. Questions often ask students to justify answers with particle-level reasoning, not just compute.`,
  },
  {
    id: "apbio",
    label: "AP Biology",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Biology (College Board). Exam: multiple-choice and free-response (including experimental design and data analysis questions), scored 1-5. Units: Chemistry of Life; Cell Structure and Function; Cellular Energetics (enzymes, photosynthesis, respiration); Cell Communication and Cell Cycle; Heredity; Gene Expression and Regulation; Natural Selection; Ecology. Heavy emphasis on interpreting graphs and experiments and explaining biological reasoning.`,
  },
  {
    id: "apcalcab",
    label: "AP Calculus AB",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Calculus AB (College Board). Exam: multiple-choice and free-response, each with a calculator and a no-calculator part, scored 1-5. Topics: limits and continuity; derivatives (definition, rules, chain rule, implicit differentiation); applications of derivatives (related rates, optimization, motion, curve sketching, MVT); integrals and the Fundamental Theorem of Calculus; differential equations (slope fields, separation of variables); applications of integration (area, volume, average value). Free-response questions require showing work and justifying conclusions.`,
  },
  {
    id: "apcalcbc",
    label: "AP Calculus BC",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Calculus BC (College Board). Everything in Calculus AB (limits, derivatives and their applications, integrals, the Fundamental Theorem, differential equations, applications of integration) plus: integration by parts and partial fractions, improper integrals, Euler's method, logistic growth, parametric, polar, and vector-valued functions, and infinite sequences and series (convergence tests, Taylor and Maclaurin series, error bounds). Exam has calculator and no-calculator parts, scored 1-5.`,
  },
  {
    id: "apphys1",
    label: "AP Physics 1",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Physics 1 (College Board), algebra-based. Topics: kinematics; forces and Newton's laws; circular motion and gravitation; energy; momentum; simple harmonic motion; torque and rotational motion; fluids. Exam has multiple-choice and free-response (including experimental design and qualitative/quantitative translation), scored 1-5. Emphasizes explaining physical reasoning, not just plugging into formulas.`,
  },
  {
    id: "apstats",
    label: "AP Statistics",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Statistics (College Board). Units: exploring one-variable data; exploring two-variable data (scatterplots, regression); collecting data (sampling, experiments, bias); probability, random variables, and probability distributions (binomial, geometric); sampling distributions; inference for proportions; inference for means; chi-square tests; inference for regression slopes. Exam has multiple-choice and free-response (including an investigative task), scored 1-5; answers must be written in context.`,
  },
  {
    id: "apush",
    label: "AP US History",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP U.S. History (College Board), Periods 1-9 from 1491 to the present. Exam: multiple-choice (stimulus-based, with sources), short-answer, a document-based question (DBQ), and a long essay, scored 1-5. Historical thinking skills: causation, comparison, continuity and change over time, contextualization, and sourcing/argumentation. Students must use specific evidence to support claims.`,
  },
  {
    id: "apworld",
    label: "AP World History",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP World History: Modern (College Board), c. 1200 to the present, in 9 units (e.g. the Global Tapestry, Networks of Exchange, Land-Based Empires, Transoceanic Interconnections, Revolutions, Industrialization, Global Conflict, Cold War and Decolonization, Globalization). Exam: stimulus-based multiple choice, short-answer, a DBQ, and a long essay, scored 1-5. Focus on causation, comparison, continuity and change, and using evidence.`,
  },
  {
    id: "aplang",
    label: "AP English Language",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP English Language and Composition (College Board). Exam: multiple-choice (reading nonfiction passages for rhetoric, and writing/revision questions) and three essays: synthesis (argue using provided sources), rhetorical analysis (explain how an author's choices achieve a purpose), and argument. Scored 1-5. Skills: identifying claims, evidence, and reasoning; rhetorical situation (speaker, audience, purpose, exigence); line of reasoning; style choices.`,
  },
  {
    id: "appsych",
    label: "AP Psychology",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Psychology (College Board). Topics: biological bases of behavior (neurons, brain, sensation and perception); cognition (memory, thinking, intelligence); development and learning (developmental psychology, classical and operant conditioning); social psychology and personality; mental and physical health (disorders, treatment). Also research methods and statistics. Exam: multiple-choice and free-response that apply concepts to scenarios and evaluate research.`,
  },
  {
    id: "apcsa",
    label: "AP Computer Science A",
    group: "AP classes and exams",
    kind: "class",
    guide: `AP Computer Science A (College Board), in Java. Topics: primitive types and expressions, using objects and String methods, Boolean logic and if statements, loops, writing classes, arrays, ArrayList, 2D arrays, inheritance, and recursion. Exam: multiple-choice (tracing and analyzing code) and free-response (writing Java methods and classes by hand), scored 1-5.`,
  },
  // --- High school classes ---
  { id: "alg1", label: "Algebra I", group: "Math classes", kind: "class", guide: `Algebra I: variables and expressions, solving linear equations and inequalities, graphing lines (slope, intercepts, slope-intercept and point-slope form), systems of equations, functions and function notation, exponents and exponential growth/decay, polynomials (adding, multiplying, factoring), and an introduction to quadratics.` },
  { id: "geom", label: "Geometry", group: "Math classes", kind: "class", guide: `High school Geometry: logic and proofs (two-column proofs), angles and parallel lines, triangle congruence (SSS, SAS, ASA, AAS, HL) and similarity, right triangles and the Pythagorean theorem, special right triangles and basic trigonometry (SOH-CAH-TOA), quadrilaterals and polygons, circles (arcs, chords, tangents, inscribed angles), area, surface area and volume, coordinate geometry, and transformations.` },
  { id: "alg2", label: "Algebra II", group: "Math classes", kind: "class", guide: `Algebra II: functions and transformations, quadratics (factoring, vertex form, completing the square, the quadratic formula, complex numbers), polynomials and their graphs, rational expressions and equations, radicals and rational exponents, exponential and logarithmic functions, sequences and series, and an introduction to trigonometric functions and probability.` },
  { id: "precalc", label: "Precalculus", group: "Math classes", kind: "class", guide: `Precalculus: functions and their inverses, polynomial and rational functions, exponential and logarithmic functions, trigonometry (unit circle, graphs, identities, solving equations, laws of sines and cosines), vectors, polar coordinates and complex numbers, sequences and series, conic sections, and an introduction to limits.` },
  { id: "calc", label: "Calculus", group: "Math classes", kind: "class", guide: `High school Calculus: limits and continuity, the derivative and differentiation rules, applications of derivatives (rates of change, optimization, related rates, curve sketching), antiderivatives and definite integrals, the Fundamental Theorem of Calculus, and applications of integrals (area, volume).` },
  { id: "stats", label: "Statistics", group: "Math classes", kind: "class", guide: `High school Statistics: describing data (center, spread, shape, graphs), normal distributions and z-scores, correlation and regression, sampling and experimental design, probability rules, random variables, and an introduction to confidence intervals and hypothesis tests.` },
  { id: "bio", label: "Biology", group: "Science classes", kind: "class", guide: `High school Biology: the scientific method, biochemistry (macromolecules, enzymes), cell structure and transport, cellular respiration and photosynthesis, the cell cycle and mitosis/meiosis, DNA, RNA and protein synthesis, genetics (Punnett squares, inheritance patterns), evolution and natural selection, classification, and ecology (food webs, cycles, populations).` },
  { id: "biohon", label: "Biology Honors", group: "Science classes", kind: "class", guide: `Honors Biology: the regular Biology topics (biochemistry, cells and transport, respiration and photosynthesis, cell division, DNA and protein synthesis, genetics, evolution, ecology) in more depth, with more experimental design, data analysis, and detailed molecular mechanisms (enzyme kinetics, gene regulation, biotechnology).` },
  { id: "chem", label: "Chemistry", group: "Science classes", kind: "class", guide: `High school Chemistry: matter and measurement (significant figures, unit conversions), atomic structure and electron configurations, the periodic table and periodic trends, chemical bonding and naming compounds, the mole and stoichiometry, chemical reactions and balancing equations, gases and gas laws, solutions and concentration, acids and bases, and an introduction to reaction rates and equilibrium.` },
  { id: "chemhon", label: "Chemistry Honors", group: "Science classes", kind: "class", guide: `Honors Chemistry: the regular Chemistry topics with more math and depth: dimensional analysis and significant figures, atomic structure, quantum numbers and electron configurations, periodic trends, bonding, Lewis structures, VSEPR and polarity, intermolecular forces, stoichiometry (limiting reagent, percent yield), gas laws (ideal gas law, partial pressures), solutions (molarity, colligative properties), thermochemistry (enthalpy, Hess's law), kinetics, equilibrium (Le Chatelier), and acids/bases (pH calculations).` },
  { id: "phys", label: "Physics", group: "Science classes", kind: "class", guide: `High school Physics: kinematics (motion graphs, equations of motion, projectiles), forces and Newton's laws, momentum and collisions, work, energy and power, circular motion and gravity, waves and sound, light, electricity and circuits (Ohm's law), and magnetism.` },
  { id: "earthsci", label: "Earth Science", group: "Science classes", kind: "class", guide: `Earth Science: minerals and rocks, plate tectonics, earthquakes and volcanoes, weathering, erosion and landforms, Earth's history and fossils, the water cycle, weather and climate, oceans, and astronomy (the solar system, Earth-Moon-Sun relationships, stars).` },
  { id: "eng", label: "English", group: "English and history", kind: "class", guide: `High school English: reading comprehension and literary analysis (theme, characterization, figurative language, point of view, tone), analyzing nonfiction and arguments, grammar and mechanics, vocabulary in context, and writing (thesis statements, supporting evidence, essay structure).` },
  { id: "ushist", label: "US History", group: "English and history", kind: "class", guide: `U.S. History: colonization, the American Revolution and Constitution, the early republic, westward expansion, sectionalism and the Civil War, Reconstruction, industrialization and immigration, the Progressive Era, World War I, the 1920s and Great Depression, World War II, the Cold War, the civil rights movement, and recent history. Emphasizes causes and effects, key people and documents, and using evidence.` },
  { id: "worldhist", label: "World History", group: "English and history", kind: "class", guide: `World History: early civilizations, classical empires, world religions, the medieval world, the Renaissance and Reformation, exploration and colonization, revolutions (political and industrial), imperialism, the World Wars, the Cold War, decolonization, and globalization. Emphasizes comparison, causation, and continuity and change.` },
  { id: "gov", label: "Government / Civics", group: "English and history", kind: "class", guide: `Government and Civics: foundations of democracy, the Constitution and Bill of Rights, federalism, the three branches and checks and balances, Congress, the presidency, the courts and landmark Supreme Court cases, civil rights and liberties, political parties, elections, and public policy.` },
  { id: "spanish", label: "Spanish", group: "World languages", kind: "class", guide: `Spanish class: vocabulary by theme, verb conjugation (present, preterite, imperfect, future, conditional, subjunctive at higher levels), ser vs. estar, gender and agreement, direct and indirect object pronouns, reading and listening comprehension, and writing and speaking in Spanish.` },
  { id: "french", label: "French", group: "World languages", kind: "class", guide: `French class: vocabulary by theme, verb conjugation (present, passé composé with avoir/être, imparfait, futur, conditionnel, subjonctif at higher levels), gender and agreement, articles, pronouns, reading and listening comprehension, and writing and speaking in French.` },
  { id: "cs", label: "Computer Science", group: "Other classes", kind: "class", guide: `High school Computer Science: variables and data types, conditionals, loops, functions, lists/arrays, basic algorithms (searching, sorting), debugging and tracing code, and problem decomposition, usually in Python, Java, or JavaScript.` },
];

export const SUBJECT_GROUPS = [...new Set(SUBJECTS.map((s) => s.group))];

export function findSubject(idOrLabel) {
  if (!idOrLabel) return null;
  const key = String(idOrLabel).trim().toLowerCase();
  return SUBJECTS.find((s) => s.id === key || s.label.toLowerCase() === key) ?? null;
}
