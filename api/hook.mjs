import { BASE_SCRIPTS, HOOKS } from './parsed-hooks.mjs';
import vm from 'vm';
import fetch from 'node-fetch';

/*

Do NOT use this code in any sort of production system with actual user credentials attached.

A real implementation of this should use something safer than Node's VM module.

*/

export const doHook = async (req, res) => {
  const hookSteps = HOOKS.find(
    h => h[0].path === req.params.path && h[0].method === req.method.toLowerCase()
  );

  // No hooks available for this path & method

  if (!hookSteps) {
    res.status(400).end();
    return;
  }

  const context = vm.createContext({
    fetch,
    _miroToken: process.env.MIRO_TOKEN
  });

  // Run all the base scripts

  for (const baseScript of BASE_SCRIPTS) {
    try {
      // Again, not for any production use...
      vm.runInContext(baseScript.script, context);
    } catch (err) {
      await fetch(
        `https://api.miro.com/v2/boards/${process.env.MIRO_BOARD}/sticky_notes`,
        {
          method: 'POST',
          body: JSON.stringify({
            data: { content: `Something went wrong! \n ${err}` },
            style: { backgroundColor: 'red' },
            geometry: {
              x: baseScript.x + Math.random() * 100 - 50,
              y: baseScript.y + Math.random() * 100 - 50
            }
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.MIRO_TOKEN}`
          }
        }
      );

      res.status(500).json('Error in board configuration.');
      return;
    }
  }

  const runSteps = async steps => {
    // This is ugly
    let conditionResult = false;
    for (const step of steps) {
      // If we we came from a condition, we'll be on an array with [trueSteps, falseSteps]
      if (Array.isArray(step)) {
        if (conditionResult) {
          conditionResult = false;
          runSteps(step[0]);
          continue;
        }
        runSteps(step[1]);
        continue;
      }

      try {
        switch (step.type) {
          case 'entrypoint': {
            const values = Object.entries(req.method === 'GET' ? req.query : req.body);

            for (const [key, value] of values) {
              context[key] = value;
            }
          }
          case 'script': {
            // Wrap it in a promise so we can do top-level await
            await new Promise((res, rej) => {
              context._asyncResolve = res;
              context._asyncReject = rej;

              vm.runInContext(
                'new Promise(async (res, rej) => { try { \n' +
                  step.script +
                  '\n' +
                  '_asyncResolve() } catch (err) { _asyncReject(err) } })',
                context
              );
            });
            break;
          }
          case 'condition': {
            conditionResult = vm.runInContext(step.expression, context);
            break;
          }
          case 'end': {
            const response = vm.runInContext(step.response, context);
            res.status(step.status).json(response);
            break;
          }
        }
      } catch (err) {
        await fetch(
          `https://api.miro.com/v2/boards/${process.env.MIRO_BOARD}/sticky_notes`,
          {
            method: 'POST',
            body: JSON.stringify({
              data: { content: `Something went wrong! \n ${err}` },
              style: { backgroundColor: 'red' },
              geometry: {
                x: step.x + Math.random() * 100 - 50,
                y: step.y + Math.random() * 100 - 50
              }
            }),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.MIRO_TOKEN}`
            }
          }
        );

        res.status(500).json('Error in board configuration.');
        return;
      }
    }
  };

  runSteps(hookSteps);
};
