import express from "express";
import {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
} from "../controllers/course.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("teacher", "admin"), createCourse);

router.get("/", getCourses);
router.get("/:id", getCourseById);

router.put(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    updateCourse
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    deleteCourse
);

export default router;