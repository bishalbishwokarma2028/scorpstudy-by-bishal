import { Router, type IRouter } from "express";
import healthRouter from "./health";
import configRouter from "./config";
import notesRouter from "./notes";
import chatsRouter from "./chats";
import quizzesRouter from "./quizzes";
import flashcardsRouter from "./flashcards";
import summariesRouter from "./summaries";
import imagesRouter from "./images";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(notesRouter);
router.use(chatsRouter);
router.use(quizzesRouter);
router.use(flashcardsRouter);
router.use(summariesRouter);
router.use(imagesRouter);
router.use(aiRouter);
router.use(dashboardRouter);
router.use(profileRouter);

export default router;
