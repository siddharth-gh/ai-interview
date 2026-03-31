import Module from "../models/module.model.js";
import Course from "../models/course.model.js";


export const createModule = async (req, res) => {
    try {
        const { courseId, title, order } = req.body;

        if (!courseId || !title || order === undefined) {
            return res.status(400).json({
                message: "courseId, title and order are required",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const module = await Module.create({
            courseId,
            title,
            order,
        });

        course.moduleIds.push(module._id);
        await course.save();

        res.status(201).json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getModulesByCourse = async (req, res) => {
    try {
        const modules = await Module.find({
            courseId: req.params.courseId,
        }).sort({ order: 1 });

        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateModule = async (req, res) => {
    try {
        const { title, order } = req.body;

        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        if (title) module.title = title;
        if (order !== undefined) module.order = order;

        await module.save();

        res.json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        const course = await Course.findById(module.courseId);
        if (course) {
            course.moduleIds = course.moduleIds.filter(
                (id) => id.toString() !== module._id.toString()
            );
            await course.save();
        }

        await module.deleteOne();

        res.json({ message: "Module deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};