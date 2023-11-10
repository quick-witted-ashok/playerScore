const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convert = (stats) => {
  return {
    stateName: stats.state_name,
  };
};

const convertState = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertDistrict = (movie) => {
  return {
    matchId: movie.match_id,
    match: movie.match,
    year: movie.year,
  };
};

app.get("/players/", async (request, response) => {
  const getStateQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const statesArray = await db.all(getStateQuery);
  response.send(statesArray.map((eachState) => convertState(eachState)));
});
