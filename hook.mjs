//@ts-check

import { BASE_SCRIPTS, HOOKS } from "./parsed-hooks.mjs"
import vm from 'vm';
import fetch from 'node-fetch';

export const doHook = async (req, res) => {
    // console.log(req);
    const hookSteps = HOOKS.find(h =>
        h[0].path === req.params.path &&
        h[0].method === req.method.toLowerCase()
    )

    if (!hookSteps) {
        res.status(400).end();
        return;
    }

    const context = vm.createContext({
        fetch
    });

    for (const baseScript of BASE_SCRIPTS) {
        vm.runInContext(baseScript.script, context);
    }

    const runSteps = async (steps) => {
        let conditionResult = false;
        for (const step of steps) {
            if (Array.isArray(step)) {
                if (conditionResult) {
                    conditionResult = false;
                    console.log('true, so running', step[0])
                    runSteps(step[0]);
                    continue;
                }
                console.log('false, so running', step[1])
                runSteps(step[1]);
                continue;
            }

            try {
                switch (step.type) {
                    case 'entrypoint': {
                        const values = Object.entries(
                            req.method === 'GET' ? req.query : req.body
                        );

                        for (const [key, value] of values) {
                            context[key] = value
                        }
                    }
                    case 'script': {
                        await new Promise((res, rej) => {
                            context._asyncResolve = res
                            context._asyncReject = rej

                            vm.runInContext(
                                'new Promise(async (res, rej) => { try { \n' +
                                step.script + '\n' +
                                '_asyncResolve() } catch (err) { _asyncReject(err) } })',
                                context
                            );
                        })
                        break;
                    }
                    case 'condition': {
                        conditionResult = vm.runInContext(step.expression, context);
                        console.log(conditionResult)
                        break;
                    }
                    case 'end': {
                        console.log(step);
                        const response = vm.runInContext(step.response, context);
                        res.status(step.status).json(response)
                        break;
                    }
                }
            } catch (err) {
                await fetch(`https://api.miro.com/v2/boards/o9J_lhnJ-Es%3D/sticky_notes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        "data": { "content": `Something went wrong! \n ${err}` },
                        "style": { "backgroundColor": "red" },
                        "geometry": { "x": step.x, "y": step.y }
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.MIRO_TOKEN}`
                    }
                })

                res.status(500).json('Error in board configuration.')
                return;
            }
        }
    }

    runSteps(hookSteps)
}