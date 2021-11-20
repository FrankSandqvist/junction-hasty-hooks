//@ts-check

import { PARSED_HOOKS } from "./parsed-hooks.mjs"

export const doHook = (req, res) => {
    const hook = PARSED_HOOKS.find(h => h.path === req.params.path)
    
    console.log(hook);
    res.json(hook).send();
}