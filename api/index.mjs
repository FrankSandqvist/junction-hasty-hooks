//@ts-check

import express from 'express';
import dotenv from 'dotenv';
import { doHook } from './hook.mjs';
import { startParsing } from './parsed-hooks.mjs';

dotenv.config()

startParsing();

const app = express();

app.use(express.static('public'))

app.use(express.json())

app.get('/api/:path', doHook)

app.post('/api/:path', doHook)

app.listen(1337);

console.log('Listening to port 1337.')
