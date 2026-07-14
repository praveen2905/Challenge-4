import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import venuesRouter from "./venues.js";
import crowdRouter from "./crowd.js";
import navigationRouter from "./navigation.js";
import chatRouter from "./chat.js";
import dashboardRouter from "./dashboard.js";
import decisionsRouter from "./decisions.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/venues", venuesRouter);
router.use("/crowd", crowdRouter);
router.use("/navigation", navigationRouter);
router.use("/chat", chatRouter);
router.use("/dashboard", dashboardRouter);
router.use("/decisions", decisionsRouter);
router.use("/admin", adminRouter);

export default router;
