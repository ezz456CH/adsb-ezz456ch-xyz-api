const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const favicon = require('serve-favicon');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

app.set('trust proxy', true);

app.get('/', async (_req, res) => {
    try {
        res.json('Hello, World!');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const routers = require('./routers/routers');
app.use('/api', routers);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
