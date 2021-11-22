import { useState, useMemo, useEffect, useCallback } from "react";

const Button = (props) => {
  return (
    <div
      onMouseDown={props.onClick}
      className={`text-center select-none cursor-pointer p-2 border-2 rounded-lg transform transition-all duration-200 ${
        props.marginBottom ? `mb-4` : ``
      } ${
        props.invert
          ? `border-black bg-white text-black`
          : `border-white bg-black text-white`
      } ${
        props.active
          ? `border-b-2 translate-y-0.5`
          : `border-b-4 hover:border-b-8 hover:-translate-y-0.5`
      }`}
    >
      {props.children}
    </div>
  );
};

function App() {
  const [demo, setDemo] = useState(0);

  const [demoParam1, setDemoParam1] = useState("joe@evilbigcorp.com");
  const [demoParam2, setDemoParam2] = useState("badpassword123");

  const demoParam1Info = useMemo(
    () =>
      [
        ["Email", "email", "joe@evilbigcorp.com", "email"],
        ["Width", "width", "200", "number"],
        ["Message", "message", "Say something to Junction", "text"],
        ["Under 100, please", "number", "150", "number"],
        null,
      ][demo],
    [demo]
  );

  const demoParam2Info = useMemo(
    () =>
      [
        ["Password", "password", "badpassword123", "password"],
        ["Height", "height", "400", "number"],
        null,
        null,
        null,
      ][demo],
    [demo]
  );

  const miroViewport = useMemo(
    () =>
      [
        "-1227,-610,1766,1837",
        "912,-494,1474,2434",
        "2644,-522,1675,1437",
        "4604,-597,1549,1539",
        "6246,-557,1496,1588",
      ][demo],
    [demo]
  );

  const method = useMemo(
    () => ["GET", "GET", "POST", "GET", "POST"][demo],
    [demo]
  );

  const description = useMemo(
    () =>
      [
        "Sometimes, as the lazy developers we are, we want to fetch information from a backend to have basic functionality from it available on a website. In this example, we let our customers check if their subscription is active.",
        "What if we just want to make a super-simple pricing function on our website? We don't want to do it on the frontend (our pricing formula is secret!), but deploying a proper backend seems overkill. Let's just do quick 'n dirty using Hasty Hooks!",
        "We can also make use of data fetching in our hook. So let's get really meta and use it to post a note to this very Miro board.",
        "What if we have a bug? No problem. Try it out, and take a look at what happens on the board!",
        "We can also use Hasty Hooks to quicky make a webhook that can be integrated with other services, such as Stripe and Hubspot! Unfortunately, this one can't be tested here.. but it will work. 👍",
      ][demo],
    [demo]
  );

  const [quoteDemoOptions, setQuoteDemoOptions] = useState(null);
  const [quoteDemoOption, setQuoteDemoOption] = useState(null);

  const endpoint = useMemo(
    () =>
      process.env.REACT_APP_API_ENDPOINT +
      [
        `/my-subscription?email=${demoParam1}&password=${demoParam2}`,
        `/material-quote?materialId=${quoteDemoOption}&width=${demoParam1}&height=${demoParam2}`,
        `/mironote`,
        `/buggy?number=${demoParam1}`,
        `/invoice-created`,
      ][demo],
    [demo, demoParam1, demoParam2, quoteDemoOption]
  );

  useEffect(() => {
    setMessage(null);

    if (demo === 1) {
      fetch(process.env.REACT_APP_API_ENDPOINT + "/materials", {
        method: "GET",
      })
        .then((res) => res.json())
        .then((options) => {
          setQuoteDemoOptions(options);
          setQuoteDemoOption(options[0].id);
        });
    }
  }, [demo]);

  useEffect(() => {
    demoParam1Info && setDemoParam1(demoParam1Info[2]);
    demoParam2Info && setDemoParam2(demoParam2Info[2]);
  }, [demoParam1Info, demoParam2Info]);

  const [message, setMessage] = useState(null);

  const request = useCallback(async () => {
    const res = await fetch(endpoint, {
      method,
      body:
        method === "POST"
          ? JSON.stringify({
              [demoParam1Info[1]]: demoParam1,
              ...(demoParam2Info ? { [demoParam2Info[1]]: demoParam2 } : {}),
            })
          : undefined,
      ...(method === "POST"
        ? {
            headers: { "Content-Type": "application/json" },
          }
        : {}),
    });

    if (res.status === 429) {
      setMessage(
        "You're doing that too often. Please wait a minute and try again!"
      );
      return;
    }

    const body = await res.json();

    console.log(res.status);

    if (res.ok) {
      switch (demo) {
        case 0: {
          setMessage(
            body
              ? "Your subscription is active, yay!"
              : "Our system tells us your subscription is not active."
          );
          break;
        }
        case 1: {
          setMessage(
            `That will be ${body.toFixed(
              2
            )} €. You can't buy it though, since this is... not a real shop.`
          );
          break;
        }
        case 2: {
          setMessage(`Take a look at the Miro board!`);
          break;
        }
        case 3: {
          setMessage(
            `It would be a shame if someone submitted a number over 100...`
          );
          break;
        }
        default: {
        }
      }
      return;
    }

    setMessage(body);
  }, [
    demoParam1,
    demoParam2,
    demoParam1Info,
    demoParam2Info,
    endpoint,
    method,
    demo,
  ]);

  return (
    <div className="absolute w-full h-full">
      <div className="h-4/6 lg:absolute lg:w-1/2 lg:left-1/2 lg:top-0 lg:bottom-0 lg:h-full">
        <iframe
          title="Miro"
          width="100%"
          height="100%"
          key={miroViewport}
          src={`https://miro.com/app/live-embed/o9J_lhnGlIk=/?moveToViewport=${miroViewport}`}
          frameBorder="0"
          scrolling="no"
          allowFullScreen
        ></iframe>
      </div>
      <div
        className="flex flex-col p-8 text-black overflow-auto lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:w-1/2 2xl:p-16"
        style={{ backgroundColor: "#fe8f02" }}
      >
        <div className="flex flex-col items-center md:flex-row mb-8">
          <img
            alt="Logo"
            src="logo.png"
            className="max-w-sm px-6 mb-4 lg:w-60 2xl:max-w-sm 2xl:w-auto md:p-0 md:mb-0 md:mr-12"
          />
          <div className="flex flex-grow items-start justify-around md:flex-col md:items-stretch md:justify-evenly">
            <a
              className={`text-center border-white bg-black text-white p-2 border-2 rounded-lg border-b-2 mr-4 mb-4 md:mr-0`}
              href="https://github.com/FrankSandqvist/junction-hasty-hooks"
            >
              Source code & Docs
            </a>
            <a
              className={`text-center border-white bg-black text-white p-2 border-2 rounded-lg border-b-2`}
              href="https://www.youtube.com/watch?v=CgcuSX5dQr0"
            >
              Watch the video
            </a>
          </div>
        </div>
        <p className="mb-2">
          Who needs Cloud Functions or Zapier when you have Miro? All API
          examples below are generated live from the Miro board to the right.
          (Click "view board")
        </p>
        <p className="font-bold mb-8">
          Check out a few of these use-case examples, or you can call the API
          directly!
        </p>
        <a
          className={`text-center border-black bg-white text-black p-2 border-2 rounded-lg border-b-2 mb-4`}
          href="https://us18.list-manage.com/contact-form?u=72f10657613a9102054a47fa1&form_id=02d609b30cbdd5a6f7c84835f0c92541"
        >
          I would use this! Keep me updated
        </a>

        <div className="grid gap-2 items-start mb-4 md:grid-flow-col">
          <Button onClick={() => setDemo(0)} active={demo === 0}>
            Lookup
          </Button>
          <Button onClick={() => setDemo(1)} active={demo === 1}>
            Quoting
          </Button>
          <Button onClick={() => setDemo(2)} active={demo === 2}>
            Miro API (Meta)
          </Button>
          <Button onClick={() => setDemo(3)} active={demo === 3}>
            Bug
          </Button>
          <Button onClick={() => setDemo(4)} active={demo === 4}>
            Webhooks
          </Button>
        </div>
        <div className="bg-white rounded-xl flex-grow border-2 border-black relative mb-4">
          {message !== null && (
            <div className="absolute flex flex-col items-center justify-center bg-white top-0 left-0 right-0 bottom-0 z-10 rounded-lg">
              <p className="mb-4">{message}</p>
              <Button
                invert
                onClick={() => {
                  setMessage(null);
                }}
              >
                Ok!
              </Button>
            </div>
          )}
          <div
            className=" bg-black text-white font-mono flex items-center p-4 rounded-t-lg"
            style={{ overflowWrap: "anywhere" }}
          >
            {[method]} {endpoint}
          </div>
          <div className="p-8 flex flex-col items-start">
            <div className="pb-8">{description}</div>
            <div className="flex flex-col mb-4">
              {demo === 1 && (
                <div className="flex mb-4 flex-col md:flex-row">
                  <div className="w-36 h-8">Pick a material</div>
                  {quoteDemoOptions ? (
                    <select
                      className="border-b-2
                  border-gray-300"
                      value={quoteDemoOption}
                      onChange={(e) => setQuoteDemoOption(e.target.value)}
                    >
                      {quoteDemoOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    "Loading materials..."
                  )}
                </div>
              )}
              {demoParam1Info && (
                <div className="flex mb-4 flex-col md:flex-row">
                  <div className="w-36 h-8">{demoParam1Info[0]}</div>
                  <input
                    className="border-b-2 border-gray-300"
                    type={demoParam1Info[3]}
                    value={demoParam1}
                    onChange={(e) => setDemoParam1(e.target.value)}
                  />
                </div>
              )}
              {demoParam2Info && (
                <div className="flex mb-4 flex-col md:flex-row">
                  <div className="w-36 h-8">{demoParam2Info[0]}</div>
                  <input
                    className="border-b-2 border-gray-300"
                    type={demoParam2Info[3]}
                    value={demoParam2}
                    onChange={(e) => setDemoParam2(e.target.value)}
                  />
                </div>
              )}
            </div>
            {demoParam1Info && (
              <Button invert onClick={request}>
                Submit
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm">
          <a href="https://franks.website" className="underline">
            Frank Sandqvist's
          </a>{" "}
          submission for Junction 2021
        </p>
      </div>
    </div>
  );
}

export default App;
