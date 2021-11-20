//@ts-check

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { doHook } from './hook.mjs';
import { startParsing } from './parsed-hooks.mjs';

dotenv.config()

startParsing();

const app = express();

app.use(cors())

app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 20
}));

app.use(express.static('public'))

app.use(express.json())

app.get('/api/:path', doHook)

app.post('/api/:path', doHook)

app.listen(1337);

console.log('Listening to port 1337.')
