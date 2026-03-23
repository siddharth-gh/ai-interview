const express = require('express');
const app = express();

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.use('/', (req, res) => {
    res.send("<h1>Welcome to Backend</h1>");
})

module.exports = app;