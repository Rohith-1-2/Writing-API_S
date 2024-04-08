let express = require('express')
let app = express()
let {open} = require('sqlite')
let path = require('path')
let dbpath = path.join(__dirname, 'cricketMatchDetails.db')
let sqlite3 = require('sqlite3')
app.use(express.json())

let db = null
let initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

function converterPlayer(a) {
  return {
    playerId: a.player_id,
    playerName: a.player_name,
  }
}

//API-1
app.get('/players/', async (request, response) => {
  let dbquery = `
    select * 
    from player_details;`
  let dbresponse = await db.all(dbquery)
  let newArray = []
  for (let i of dbresponse) {
    newArray.push(converterPlayer(i))
  }
  response.send(newArray)
})

//API-2
app.get('/players/:playerId/', async (request, response) => {
  let {playerId} = request.params
  let dbquery = `
    select * 
    from player_details
    where player_id = ${playerId};`
  let dbresponse = await db.get(dbquery)
  response.send(converterPlayer(dbresponse))
})

//API-3
app.put('/players/:playerId/', async (request, response) => {
  let {playerId} = request.params
  let {playerName} = request.body
  let dbquery = `
  update player_details
  set 
  player_name = '${playerName}'
  where player_id = ${playerId};`
  await db.run(dbquery)
  response.send('Player Details Updated')
})

//API-4
app.get('/matches/:matchId/', async (request, response) => {
  let {matchId} = request.params
  let dbquery = `
    select match_id as matchId,match,year
    from match_details
    where match_id = ${matchId};`
  let dbresponse = await db.get(dbquery)
  response.send(dbresponse)
})

//API-5
app.get('/players/:playerId/matches/', async (request, response) => {
  let {playerId} = request.params
  let dbquery = `
  select 
  match_details.match_id as matchId,
  match_details.match,
  match_details.year
  from player_match_score 
  natural join match_details 
  where player_match_score.player_id = ${playerId};`
  let dbresponse = await db.all(dbquery)
  response.send(dbresponse)
})

//API-6
app.get('/matches/:matchId/players', async (request, response) => {
  let {matchId} = request.params
  let dbquery = `
  select 
  player_details.player_id as playerId,
  player_details.player_name as playerName
  from player_match_score 
  natural join player_details 
  where player_match_score.match_id = ${matchId};`
  let dbresponse = await db.all(dbquery)
  response.send(dbresponse)
})

//API-7
app.get('/players/:playerId/playerScores', async (request, response) => {
  let {playerId} = request.params
  let dbquery = `
  select 
  player_match_score.player_id as playerId,
  player_details.player_name as playerName,
  sum(player_match_score.score) as totalScore,
  sum(player_match_score.fours) as totalFours,
  sum(player_match_score.sixes) as totalSixes
  from player_match_score 
  natural join player_details 
  where player_match_score.player_id = ${playerId}
  group by player_match_score.player_id;`
  let dbresponse = await db.all(dbquery)
  response.send(...dbresponse)
})

module.exports = app
