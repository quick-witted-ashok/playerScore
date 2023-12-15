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

const convertFont = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertMatch = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

const convert = (each) => {
  return {
    playerId: each.playerId,
    playerName: each.playerName,
    totalScore: each.totalScore,
    totalFours: each.totalFours,
    totalSixes: each.totalSixes,
  };
};
app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details`;
  const result = await db.all(query);
  response.send(result.map((eachPlayer) => convertFont(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const players = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const result = await db.get(players);
  response.send(convertFont(result));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const query = `UPDATE player_details 
                    SET player_name = '${playerName}'
                    WHERE player_id =${playerId}`;

  const result = await db.run(query);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const result = await db.get(query);

  response.send(convertMatch(result));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM match_details
                 WHERE match_id = (SELECT match_id 
                                    FROM player_match_score 
                                    WHERE player_id = ${playerId})`;
  const result = await db.all(query);
  response.send(result.map((eachMatch) => convertMatch(eachMatch)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM player_details
                        WHERE player_id = (SELECT player_id
                                            FROM player_match_score
                                            WHERE match_id =${matchId})`;

  const result = await db.all(query);
  response.send(result.map((eachPlayer) => convertFont(eachPlayer)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const query = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const result = await db.get(query);
  console.log(result.playerId);
  response.send(convert(result));
});

module.exports = app;
