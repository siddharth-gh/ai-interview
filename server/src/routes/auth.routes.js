import express from "express";
import { signup, login } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/me", protect, (req, res) => {
    res.json(req.user);
});
router.post("/signup", signup);
router.post("/login", login);

export default router;