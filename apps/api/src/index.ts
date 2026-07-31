import "dotenv/config";

import app from "./app.js";

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1) {
  throw new Error("PORT must be a positive integer.");
}

app.listen(port, () => {
  console.log(`Event API listening on http://localhost:${port}`);
});
