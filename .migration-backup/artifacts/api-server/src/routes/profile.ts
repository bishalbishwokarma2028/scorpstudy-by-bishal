import { Router, type IRouter } from "express";
import { db, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profile/:userId", async (req, res): Promise<void> => {
  const { userId } = req.params;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  try {
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
    if (!profile) { res.status(404).json({ error: "Not found" }); return; }
    res.json(profile);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/profile", async (req, res): Promise<void> => {
  const { userId, firstName, nickname, studyLevel, learningGoal, preferredLanguage, interactionStyle, onboardingCompleted } = req.body;
  if (!userId || !firstName) { res.status(400).json({ error: "userId and firstName required" }); return; }

  const profileData = {
    userId: String(userId),
    firstName: String(firstName),
    nickname: nickname ? String(nickname) : null,
    studyLevel: studyLevel ? String(studyLevel) : "Bachelor",
    learningGoal: learningGoal ? String(learningGoal) : "General Learning",
    preferredLanguage: preferredLanguage ? String(preferredLanguage) : "English",
    interactionStyle: interactionStyle ? String(interactionStyle) : "Friendly Tutor",
    onboardingCompleted: onboardingCompleted !== false,
  };

  try {
    const existing = await db.select({ id: userProfilesTable.id }).from(userProfilesTable)
      .where(eq(userProfilesTable.userId, profileData.userId)).limit(1);
    if (existing.length > 0) {
      await db.update(userProfilesTable).set(profileData).where(eq(userProfilesTable.userId, profileData.userId));
    } else {
      await db.insert(userProfilesTable).values(profileData);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

export default router;
