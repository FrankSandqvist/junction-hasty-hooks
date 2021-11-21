import cron from 'node-cron';
import fetch from 'node-fetch';

// Cache the hooks here
export let BASE_SCRIPTS = [];
export let HOOKS = [];

const extractText = html => {
  const trimmed = html.slice(3, html.length - 4);

  const lines = trimmed
    .replace(/<a.*?>|<\/a>/g, '')
    .split(/\<\/p><p>|<br \/>/g)
    .map(t =>
      t
        .replace(/<!--(.*?)-->/g, '')
        .replace(
          /&(nbsp|amp|quot|lt|gt);/g,
          (_, entity) =>
            ({
              nbsp: ' ',
              amp: '&',
              quot: '"',
              lt: '<',
              gt: '>'
            }[entity])
        )
        .replace(/&#([0-9]{1,3});/gi, (_, numStr) => {
          var num = parseInt(numStr, 10); // read num as normal number
          return String.fromCharCode(num);
        })
    );

  return lines.join('\n');
};

const parseEntrypoint = widget => {
  if (widget.type !== 'shape' || widget.style.shapeType !== 'circle') return [];

  // This'll do the trick for now... Just got to make sure to not hold shift while we return!
  const text = extractText(widget.text);

  if (!text) return;

  const [method, path] = text.split(' ');

  if ((method !== 'get' && method !== 'post') || !path) {
    return [];
  }

  return {
    type: 'entrypoint',
    id: widget.id,
    path,
    method
  };
};

const parseScripts = widget => {
  if (widget.type !== 'shape' || widget.style.shapeType !== 'rectangle') return [];

  const script = extractText(widget.text);

  if (!script) return;

  return {
    type: 'script',
    id: widget.id,
    script,
    x: widget.x,
    y: widget.y
  };
};

const parseConditions = widget => {
  if (widget.type !== 'shape' || widget.style.shapeType !== 'rhombus') return [];
  if (!widget.text.startsWith('<p>')) return [];

  const expression = extractText(widget.text);
  if (!expression) return;

  return {
    type: 'condition',
    id: widget.id,
    expression,
    x: widget.x,
    y: widget.y
  };
};

const parseLines = widget => {
  if (widget.type !== 'line') return [];

  return {
    type: 'line',
    id: widget.id,
    startId: widget.startWidget.id,
    endId: widget.endWidget.id
  };
};

const parseEnds = widget => {
  if (widget.type !== 'shape' || widget.style.shapeType !== 'circle') return [];

  // This'll do the trick for now... Just got to make sure to not hold shift while we return!
  const text = extractText(widget.text);

  if (!text) return;

  const [status, ...responseParts] = text.split(' ');
  const response = responseParts.join(' ');

  if (isNaN(status)) {
    return [];
  }

  return {
    type: 'end',
    id: widget.id,
    status,
    response,
    x: widget.x,
    y: widget.y
  };
};

export const startParsing = () => {
  //Let's just do a cron job for now...
  cron.schedule('*/5 * * * * *', parse);

  parse();
};

const parse = async () => {
  console.log('Updating endpoints');

  // Endpoint is limited to 1000 widgets. Should be good enough for now!
  const res = await fetch(
    `https://api.miro.com/v1/boards/${process.env.MIRO_BOARD}/widgets/`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MIRO_TOKEN}`
      }
    }
  ).then(r => r.json());

  // Get the relevant shapes

  const entrypoints = res.data.flatMap(parseEntrypoint);

  const lines = res.data.flatMap(parseLines);

  const scripts = res.data.flatMap(parseScripts);

  const shapes = [
    ...scripts,
    ...res.data.flatMap(parseConditions),
    ...res.data.flatMap(parseEnds)
  ];

  // Iterate over a length of shapes, either the entrypoint or the first shape after a condition

  const iterate = startShape => {
    if (startShape.type === 'condition') {
      const [line1, line2] = lines.filter(l => l.startId === startShape.id);
      if (!line1 || !line2) return [[], []];

      const booleanShapes = [
        shapes.find(s => s.id === line1.endId),
        shapes.find(s => s.id === line2.endId)
      ];

      const [trueShape, falseShape] = booleanShapes.sort((a, b) => (a.x < b.x ? -1 : 1));

      return [startShape, [iterate(trueShape), iterate(falseShape)]];
    }

    const line = lines.find(l => l.startId === startShape.id);

    if (line) {
      const nextShape = shapes.find(s => s.id === line.endId);
      if (nextShape) {
        return [startShape, ...iterate(nextShape)];
      }
    }

    return [startShape];
  };

  const hooks = entrypoints.map(iterate);

  // Cache the hooks and the "base scripts" for use when executing

  HOOKS = hooks;
  BASE_SCRIPTS = scripts.filter(s => !hooks.flat(10).some(hs => hs.id === s.id));
};
