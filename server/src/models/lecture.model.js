import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["text", "image"],
            required: true,
        },

        data: {
            type: String, // for text content
        },

        url: {
            type: String, // for image URL
        },

        order: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const lectureSchema = new mongoose.Schema(
    {
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        order: {
            type: Number,
            required: true,
        },

        contents: [contentSchema],
    },
    {
        timestamps: true,
    }
);

const Lecture = mongoose.model("Lecture", lectureSchema);

export default Lecture;