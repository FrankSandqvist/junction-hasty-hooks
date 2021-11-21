![Hasty Hooks](/logo.png?raw=true)

## Hasty Hooks for Miro - Junction 2021 submission

This was my submission for this year's Junction Miro challenge. Didn't win anything, but it was fun nonetheless!

Don't look to closely at the code, keep in mind it was made from start to end in 36 hours. 😬

### Live demo
https://junction-hasty-hooks-rl7m2.ondigitalocean.app/
(I'm not sure how long I'll keep it up)

### Video
https://www.youtube.com/watch?v=CgcuSX5dQr0

### ⚠️ Word of caution

Do not use this code as it is in a production environment where any important user credentials are saved. This does not sufficiently protect against arbitrary code execution as uses Node's VM module to execute the code in the Miro board.

### What is it? 

Hasty Hooks is a way to define real API endpoints using a Miro board. Changes in the boards are reflectived instantaneously on the available endpoints. 

It's a way to create API's in a quick'n'dirty way using nothing but Miro.

*Circles* define the start and end of the endpoints. The start takes the syntax of `[method] [path]`, e.g. `get user-info`. If the method is GET the query strings are added as variables as they are named. (only camelCase works) If it's POST, the endpoint can parse a JSON payload.

*Rectangles* define scripts. Just plain JS. Whenever defining new variables, the var/let/const keyword has to be omitted due to how Node's VM works. Fetch is available, and top-level await works.

*Diamonds/Rhombus* define conditions. If the expression written inside is truthy, the path continues downward, otherwise it goes to the right.

### Things to improve

Pretty much everything! This would require a full-rewrite to be a viable product. But a few things in no particular order;

- UI to connect Miro boards
- Monitoring
- Better solution than a CRON job to get board updates
- Proper sandboxing
- Cleaner code
- Things I am forgetting

### Like it?

Let me know! Shoot me a mail at kankki@gmail.com or DM me at @kankki. If someone would be interesting in working further on this, I'm happy to take part.