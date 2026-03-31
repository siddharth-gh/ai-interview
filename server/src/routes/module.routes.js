import express from "express";
import {
    createModule,
    getModulesByCourse,
    updateModule,
    deleteModule,
} from "../controllers/module.controller.js";
import protect from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("teacher", "admin"), createModule);

router.get("/:courseId", getModulesByCourse);

router.put(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    updateModule
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("teacher", "admin"),
    deleteModule
);

export default router;