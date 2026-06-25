import { Router, type IRouter } from "express";
import { db, userProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  try {
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, req.userId))
      .limit(1);
    if (!profile) { res.status(404).json({ error: "Not found" }); return; }
    res.json(profile);
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/profile", requireAuth, async (req, res): Promise<void> => {
  const { firstName, nickname, studyLevel, learningGoal, preferredLanguage, interactionStyle, onboardingCompleted } = req.body;
  if (!firstName) { res.status(400).json({ error: "firstName required" }); return; }

  const profileData = {
    userId: req.userId,
    firstName: String(firstName),
    nickname: nickname ? String(nickname) : null,
    studyLevel: studyLevel ? String(studyLevel) : "Bachelor",
    learningGoal: learningGoal ? String(learningGoal) : "General Learning",
    preferredLanguage: preferredLanguage ? String(preferredLanguage) : "English",
    interactionStyle: interactionStyle ? String(interactionStyle) : "Friendly Tutor",
    onboardingCompleted: onboardingCompleted !== false,
  };

  try {
    const existing = await db
      .select({ id: userProfilesTable.id })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, req.userId))
      .limit(1);
    if (existing.length > 0) {
      await db.update(userProfilesTable).set(profileData).where(eq(userProfilesTable.userId, req.userId));
    } else {
      await db.insert(userProfilesTable).values(profileData);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: "DB error" }); }
});

export default router;
