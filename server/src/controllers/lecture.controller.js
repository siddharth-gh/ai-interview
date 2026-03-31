import Lecture from "../models/lecture.model.js";
import Module from "../models/module.model.js";


export const createLecture = async (req, res) => {
    try {
        const { moduleId, title, order, contents } = req.body;

        if (!moduleId || !title || order === undefined) {
            return res.status(400).json({
                message: "moduleId, title and order are required",
            });
        }

        const module = await Module.findById(moduleId);
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        const lecture = await Lecture.create({
            moduleId,
            title,
            order,
            contents,
        });

        module.lectureIds.push(lecture._id);
        await module.save();

        res.status(201).json(lecture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getLecturesByModule = async (req, res) => {
    try {
        const lectures = await Lecture.find({
            moduleId: req.params.moduleId,
        }).sort({ order: 1 });

        res.json(lectures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const updateLecture = async (req, res) => {
    try {
        const { title, order, contents } = req.body;

        const lecture = await Lecture.findById(req.params.id);

        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        if (title) lecture.title = title;
        if (order !== undefined) lecture.order = order;
        if (contents) lecture.contents = contents;

        await lecture.save();

        res.json(lecture);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteLecture = async (req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id);

        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }

        const module = await Module.findById(lecture.moduleId);

        if (module) {
            module.lectureIds = module.lectureIds.filter(
                (id) => id.toString() !== lecture._id.toString()
            );
            await module.save();
        }

        await lecture.deleteOne();

        res.json({ message: "Lecture deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};