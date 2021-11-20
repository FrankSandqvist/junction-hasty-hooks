//@ts-check

import { BASE_SCRIPTS, HOOKS } from "./parsed-hooks.mjs"
import vm from 'vm';

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

    const context = vm.createContext();

    for (const baseScript of BASE_SCRIPTS) {
        console.log(baseScript.script)
        vm.runInContext(baseScript.script, context);
    }

    const runSteps = (steps) => {
        console.log('run steps', steps)
        let conditionResult;
        for (const step of steps) {
            console.log('run step', step)
            if (Array.isArray(step)) {
                if (conditionResult) {
                    runSteps(step[0]);
                }
                runSteps(step[1]);
                continue;
            }
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
                    vm.runInContext(step.script, context);
                    break;
                }
                case 'condition': {
                    conditionResult = vm.runInContext(step.expression, context);
                    break;
                }
                case 'end': {
                    const response = vm.runInContext(step.response, context);
                    res.status(step.status).json(response)
                    break;
                }
            }
        }
    }

    runSteps(hookSteps)
}