const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const router = express.Router();
const port = process.env.PORT || 1337;
const { dbUri } = process.env;
const routes = require('./routes.json');

const userRouter = require('./src/routes/user');
const { deserializeUser } = require('./src/middleware/deserializeUser');

mongoose.connect(dbUri, { useNewUrlParser: true })
  .then(() => {
    const app = express();
    app.use(cors());
    app.options('*', cors());
    app.use(express.json());
    app.use(deserializeUser);
    app.use(express.urlencoded({ extended: false }));

    app.use('/api', router);
    app.get('/info', async (req, res) => {
      res.send({ name: 'Health tracker website API', version: '0.0.2 BETA' });
    });

    const server = app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });

    router.get('/', async (req, res) => res.send(routes));

    router.use('/user', userRouter);
  });
