//@ts-check

import cron from 'node-cron';
import fetch from 'node-fetch';

// Cache the hooks here
export let PARSED_HOOKS = [];

const extractText = (html) => {
    const trimmed = html.slice(3, html.length - 4);;

    const lines =
        trimmed
            .split(/\<\/p><p>|<br \/>/g)
            .map(t => t
                .replace(/<!--(.*?)-->/g, '')
                .replace(/&(nbsp|amp|quot|lt|gt);/g,
                    (match, entity) =>
                    ({
                        "nbsp": " ",
                        "amp": "&",
                        "quot": "\"",
                        "lt": "<",
                        "gt": ">"
                    }[entity])
                )
                .replace(/&#([0-9]{1,3});/gi, (match, numStr) => {
                    var num = parseInt(numStr, 10); // read num as normal number
                    return String.fromCharCode(num);
                }));

    return lines.join('\n');
}

const parseEntrypoint = (widget) => {
    if (widget.type !== 'shape' || widget.style.shapeType !== 'circle') return [];

    // This'll do the trick for now... Just got to make sure to not hold shift while we return!
    const text = extractText(widget.text)

    if (!text) return;

    const [method, path] = text.split(' ');

    if ((method !== 'get' && method !== 'post') || !path) {
        return [];
    }

    return {
        type: 'entrypoint',
        id: widget.id,
        path,
        method,
    }
}

const parseScripts = (widget) => {
    if (widget.type !== 'shape' || widget.style.shapeType !== 'rectangle') return [];

    const script = extractText(widget.text)

    if (!script) return;

    return {
        type: 'script',
        id: widget.id,
        script,
    }
}

const parseConditions = (widget) => {
    if (widget.type !== 'shape' || widget.style.shapeType !== 'rhombus') return [];
    if (!widget.text.startsWith('<p>')) return [];

    const expression = extractText(widget.text)
    if (!expression) return;

    return {
        type: 'condition',
        id: widget.id,
        expression,
    }
}

const parseLines = (widget) => {
    if (widget.type !== 'line') return [];

    return {
        type: 'line',
        id: widget.id,
        startId: widget.startWidget.id,
        endId: widget.endWidget.id,
    }
}

const parseEnds = (widget) => {
    if (widget.type !== 'shape' || widget.style.shapeType !== 'circle') return [];

    // This'll do the trick for now... Just got to make sure to not hold shift while we return!
    const text = extractText(widget.text)

    if (!text) return;

    const [status, response] = text.split(' ');

    if (isNaN(status)) {
        return [];
    }

    return {
        type: 'end',
        id: widget.id,
        status,
        response,
    }
}

export const startParsing = () => {
    // Let's just do a cron job for now...
    cron.schedule("*/10 * * * * *", parse)
}

const parse = async () => {
    console.log('Updating endpoints');

    // Endpoint is limited to 1000 widgets. Should be good enough for now!
    const res = await fetch("https://api.miro.com/v1/boards/o9J_lhnJ-Es%3D/widgets/", {
        headers: {
            Authorization: `Bearer ${process.env.MIRO_TOKEN}`
        }
    }).then(r => r.json());

    //@ts-ignore
    const entrypoints = res.data.flatMap(parseEntrypoint);

    //@ts-ignore
    const lines = res.data.flatMap(parseLines)


    const shapes = [
        //@ts-ignore
        ...res.data.flatMap(parseScripts),
        //@ts-ignore
        ...res.data.flatMap(parseConditions),
        //@ts-ignore
        ...res.data.flatMap(parseEnds),
    ];

    const hooks = [];

    for (const entrypoint of entrypoints) {
        console.log(entrypoint);

        const firstLine = lines.find(l => l.startId === entrypoint.id)

        if (!firstLine) continue;
        
        let nextShape = shapes.find(s => s.id === firstLine.endId)
        while (nextShape) {

            console.log(nextShape);

            const line = lines.find(l => l.startId === nextShape.id)
            if (!line) break;

            nextShape = shapes.find(s => s.id === line.endId)
        }
    }

    PARSED_HOOKS = hooks;
    // const conditions = res.data.flatMap(parseConditions);

    //  console.log(conditions)

};