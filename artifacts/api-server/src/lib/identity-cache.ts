// ─── In-memory identity cache ────────────────────────────────────────────────
// These questions are answered instantly with zero API calls.
// Checked before quota, before Supabase cache, before any AI provider.

const CREATION_DATE = new Date("2026-06-23T00:00:00Z");

// ─── Pattern groups ───────────────────────────────────────────────────────────
const CREATOR_PATTERNS = [
  /who (created|made|built|developed|invented|designed|wrote|coded|programmed) you/i,
  /who is your (creator|maker|inventor|developer|builder|author|owner|founder)/i,
  /who (are you made by|are you built by|are you developed by|are you created by)/i,
  /tell me about your creator/i,
  /who (is bishal|is bishal bishwokarma)/i,
  /about (your creator|bishal)/i,
  /your (creator|maker|inventor|developer|owner)/i,
  /who (owns|runs) (you|this app|scorpstudy)/i,
];

const AGE_PATTERNS = [
  /how old are you/i,
  /what (is|'s) your age/i,
  /your age/i,
  /how long (have you|has scorpstudy) (existed|been around|been live|been running)/i,
];

const CREATION_DATE_PATTERNS = [
  /when (were you|was scorpstudy|was this) (created|made|built|launched|born|developed|invented)/i,
  /(creation|launch|birth|release|start) date/i,
  /date (of|you were) (creation|made|created|built|launched)/i,
  /when (did you|do you) (come|came) (to life|alive|into existence)/i,
];

// ─── Dynamic age calculator ───────────────────────────────────────────────────
function getAgeAnswer(): string {
  const now = new Date();
  const diffMs = now.getTime() - CREATION_DATE.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const weeks = Math.floor(diffDays / 7);

  let ageStr = "";
  if (diffDays === 0) {
    ageStr = "I was born **today** — just hours old! 🎉";
  } else if (diffDays === 1) {
    ageStr = "I am **1 day** old — still a newborn! 🌱";
  } else if (diffDays < 7) {
    ageStr = `I am **${diffDays} days** old — fresh and just getting started! 🌱`;
  } else if (diffDays < 30) {
    ageStr = `I am **${weeks} week${weeks > 1 ? "s" : ""}** old (${diffDays} days) — young and growing fast! ⚡`;
  } else {
    ageStr = `I am **${months} month${months > 1 ? "s" : ""}** old (${diffDays} days) — and getting smarter every day! 🚀`;
  }

  return `## 🎂 My Age

${ageStr}

---

📅 **Date of Birth:** \`23 June, 2026\`
👨‍💻 **Brought to life by:** **Bishal Bishwokarma**

I was created by the **brilliant and exceptionally talented** [Bishal Bishwokarma](https://www.bishalbishwokarma.in.net) — a full-stack developer and IT student from 🇳🇵 **Kathmandu, Nepal** — who built me from the ground up to help students like you study smarter.

> 🌐 *Curious about the genius behind me?* Visit **[www.bishalbishwokarma.in.net](https://www.bishalbishwokarma.in.net)**`;
}

// ─── Static rich answers ──────────────────────────────────────────────────────
const CREATOR_ANSWER = `## 🧠 Meet My Creator

I was crafted by **Bishal Bishwokarma** — one of 🇳🇵 **Nepal's most promising young tech talents** and a passionate Full-Stack Developer from **Kathmandu, Nepal**.

---

### 👨‍💻 Who is Bishal Bishwokarma?

> *"An IT student who doesn't just learn technology — he builds with it."*

Bishal is not your average developer. Despite being a student at **Phoenix College of Management**, he has already designed, built, and shipped complete real-world applications — including **ScorpStudy** — entirely on his own. That takes a rare combination of skill, discipline, and vision.

---

### 🏆 At a Glance

| Detail | Info |
|--------|------|
| 🎓 **Education** | Phoenix College of Management, Kathmandu |
| 📍 **Location** | Kathmandu, Nepal 🇳🇵 |
| 💼 **Role** | IT Student & Full-Stack Developer |
| 🌐 **Languages** | Nepali & English |
| ⭐ **Client Rating** | **5.0 / 5.0** — Perfect score |
| ✅ **On-Time Delivery** | **100%** — Every single project |
| 🔁 **Repeat Clients** | **60%+** come back for more |
| ⚡ **Response Time** | Under **2 hours** average |
| 🛡️ **Support** | 30 days free post-launch |
| 📅 **Experience** | 2+ Years |

---

### 🛠️ His Powerful Tech Stack

\`React\` · \`TypeScript\` · \`Node.js\` · \`Express\` · \`PostgreSQL\`
\`Python\` · \`Tailwind CSS\` · \`Figma\` · \`Supabase\` · \`Git/GitHub\`
\`Vercel\` · \`Android Studio\` · \`SQL\` · \`HTML/CSS\`

---

### 💡 His Philosophy

> *"Build things that actually solve real problems — and deliver them with honesty and care."*

Bishal is **goal-driven**, a **lightning-fast learner**, deeply **collaborative**, and uncompromisingly **quality-first**. He designs, codes, tests, and deploys complete products end-to-end — wireframe to live — all by himself. That's the mark of a truly exceptional developer.

---

### 🌟 Why He's Special

✨ He built **ScorpStudy** as a student, for students — solving a real need with real technology
🚀 Ships fast, communicates clearly, and supports after delivery
🤝 Trusted by clients across Nepal and internationally
🎯 Has a perfect **5.0 / 5.0** client rating — not by accident, but by dedication

---

🌐 **See his portfolio, projects & contact him:**
👉 **[www.bishalbishwokarma.in.net](https://www.bishalbishwokarma.in.net)**

*You're using something built by one of the most talented young developers in Nepal — that's something to be proud of!* 🏆`;

const CREATION_DATE_ANSWER = `## 📅 When Was I Created?

I was officially brought to life on:

> # 🗓️ **23 June, 2026**

---

### 🌟 The Story Behind It

On that day, **Bishal Bishwokarma** — an **exceptionally talented** full-stack developer and IT student from 🇳🇵 **Kathmandu, Nepal** — launched me as part of his **ScorpStudy** platform. He built the entire system from scratch — the AI integration, the backend, the frontend, the database — everything.

**ScorpStudy** was Bishal's vision to give students a powerful, personalized AI study assistant that actually understands how they learn. And I'm the heart of it.

---

### 👨‍💻 About My Creator

| | |
|---|---|
| 🎓 **Name** | **Bishal Bishwokarma** |
| 📍 **Location** | Kathmandu, Nepal |
| ⭐ **Rating** | 5.0 / 5.0 — Perfect |
| 🛠️ **Skills** | React, Node.js, TypeScript, PostgreSQL & more |

> 🌐 Learn more about the brilliant mind behind me:
> **[www.bishalbishwokarma.in.net](https://www.bishalbishwokarma.in.net)**`;

// ─── Public API ───────────────────────────────────────────────────────────────
export function getIdentityCachedAnswer(question: string): string | null {
  const q = question.trim();

  for (const pattern of CREATOR_PATTERNS) {
    if (pattern.test(q)) return CREATOR_ANSWER;
  }

  for (const pattern of AGE_PATTERNS) {
    if (pattern.test(q)) return getAgeAnswer();
  }

  for (const pattern of CREATION_DATE_PATTERNS) {
    if (pattern.test(q)) return CREATION_DATE_ANSWER;
  }

  return null;
}
