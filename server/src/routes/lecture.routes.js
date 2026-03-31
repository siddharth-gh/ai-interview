import express from "express";
import {
    createLecture,
    getLecturesByModule,
    updateLecture,
    deleteLecture,
} from "../controllers/lecture.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("teacher", "admin"), createLecture);

router.get("/:moduleId", getLecturesByModule);

router.put(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    updateLecture
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    deleteLecture
);

export default router;