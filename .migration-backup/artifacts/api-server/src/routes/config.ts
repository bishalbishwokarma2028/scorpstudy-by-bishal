import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/config", (_req, res): void => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  });
});

export default router;
