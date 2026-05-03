import { Router } from "express";
import { login, signup } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/signup", signup);
authRouter.get("/me", authMiddleware, (_req, res) => {
  res.status(200).json({
    message: "Authenticated route ready.",
  });
});

export default authRouter;
