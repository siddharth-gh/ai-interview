import "dotenv/config";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

// Connect to MongoDB
connectDB();

const app = createApp();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
