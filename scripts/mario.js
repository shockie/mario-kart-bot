module.exports = (robot) => {


  const addMatch = (players) => {
    //first add the matches to the players
    for(let player of players ) {
      playerBumpMatch(player)
    }

    //add the win for the number one player
    playerBumpWin(players[0])

    // push the match into the log
    pushLog({
      players: players,
      date: new Date()
    })
  }

  const initStore = () => {
    if(!robot.brain.get('matches')) {
      robot.brain.set('matches', {})
    }
    if(!robot.brain.get('wins')) {
      robot.brain.set('wins', {})
    }
    if(!robot.brain.get('logs')) {
      robot.brain.set('logs', [])
    }
  }

  const resetStore =  () => {
    robot.brain.set('matches', {})
    robot.brain.set('wins', {})
    robot.brain.set('logs', [])
  }

  const playerBumpWin = (name) => {
    let wins = robot.brain.get('wins')
    if(!wins[name]){
      wins[name] = 0
    }

    wins[name]++
    robot.brain.set('wins', wins)
  }

  const playerBumpMatch = (name) => {
    let matches = robot.brain.get('matches')
    if(!matches[name]){
      matches[name] = 0
    }

    matches[name]++
    robot.brain.set('matches', matches)
  }

  const pushLog = (entry) => {
    let logs = robot.brain.get('logs')
    logs.push(entry)
    robot.brain.set('logs', logs)
  }

  const playerWins = (name) => {
    let wins = robot.brain.get('wins')
    if(wins[name]) {
      return wins[name]
    }
    return 0
  }

  const playerMatches = (name) => {
    let matches = robot.brain.get('matches')
    if(matches[name]) {
      return matches[name]
    }
    return 0
  }

  const playerWinRatio = (name) => {
    return playerWins(name) / playerMatches(name)
  }

  const getLogs = () => robot.brain.get('logs')

  const topPlayers = (number) => {
    // first get all the players
    let players = Object.keys(robot.brain.get('matches')).map((player_name) => {
      return {
        name: player_name,
        wins: playerWins(player_name),
        matches: playerMatches(player_name),
        ratio: playerWinRatio(player_name)
      }
    })

    let sortedList = players.sort((a, b) => {
      if(a.ratio > b.ratio){
        return -1
      }

      if(a.ratio < b.ratio){
        return 1
      }

      return 0
    })

    return sortedList.slice(0, number)
  }

  robot.brain.on("loaded", initStore)
  initStore()

  robot.respond(/match (.*)/i, (res) => {
    let players = res.match[1].trim().split(" ")
    addMatch(players)
    const first_place = players[0],
          second_place = players[1],
          third_place = players[2],
          fourth_place = players[3]

    const match_messages = [
      `What a match!`,
      `I've seen better matches :shrugging:`,
      `Liar, ${first_place} didn't win, I think ${second_place} won!`,
      `That was fun :muscle:`
    ]

    const message = res.random(match_messages)
    res.reply(`${message}, congratulations ${first_place}!`)
  })

  robot.respond(/last/i, (res) => {
    let last_match = getLogs()[getLogs().length - 1]

    let ranking_string = []

    for(let [index, player] of last_match.players.entries()) {
      ranking_string.push(`${index + 1}. ${player}`)
    }

    res.reply(`
Result of last match:
${ranking_string.join("\n")}
    `.trim())
  })

  robot.respond(/champion/i, (res) => {
    res.reply(`:first_place_medal: ${topPlayers(1)[0].name} :first_place_medal:`)
  })

  robot.respond(/reset/i, (res) => {
    resetStore()
    res.reply('cleared the state')
  })

  robot.respond(/top\s?(.*)/i, (res) => {
    let number = 10

    if (res.match[1]) {
      number = parseInt(res.match[1], 10)
    }

    let ranking = topPlayers(number).map((score, index) => {
      let icon = index + 1
      if(index == 0){
         icon = ":first_place_medal:"
      } else if(index == 1) {
        icon = ":second_place_medal:"
      } else if(index == 2) {
        icon = ":third_place_medal:"
      }

      return `${icon}: ${score.name} (won ${score.wins} of ${score.matches}, ratio: ${score.ratio})`
    })

    const message = `
These are they best players overall:
${ranking.join("\n")}
    `

    res.reply(message)
  })
}
