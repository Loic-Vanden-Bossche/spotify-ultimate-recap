import Pyroscope from "@pyroscope/nodejs";

const pyroscopeServerAddress =
  process.env.PYROSCOPE_SERVER_ADDRESS || "http://localhost:4040";

Pyroscope.init({
  serverAddress: pyroscopeServerAddress,
  appName: "spotify-ultimate-recap",
});
Pyroscope.start();

console.log(`Connected to Pyroscope server (${pyroscopeServerAddress})`);

import "./dist/server/server.mjs";
