let yourScore = 0;
let opponentScore = 0;
let playerName = "";
let yourChoiceState = "";
let opponentChoiceState = "";

const form = document.getElementById("form");
form.addEventListener("submit", event => {
  event.preventDefault();
})

const startBtn = document.getElementById("start");
const playerNameTextField = document.getElementById("playerName");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const yourScoreElem = document.getElementById("your-score");
const opponentScoreElem = document.getElementById("opponent-score");
const baseUrl = 'https://js2-mini-projekt-1-zipeng-default-rtdb.europe-west1.firebasedatabase.app'

startBtn.addEventListener("click", async () => {
  playerName = playerNameTextField.value;
  // console.log(playerName)
  yourScore = 0;
  yourScoreElem.innerText = 0;
  opponentScore = 0;
  opponentScoreElem.innerText = 0;
  if (playerName === "") {
    alert("Please fill in player name field")
    return;
  } 
  await firebaseCreatePlayerIfNotExists(playerName);
  await updatePlayerScoreList();
})


const choices = ["rock", "paper", "scissors"];

function createImages() {
  for (const choice of choices) {
    let choiceElem = document.createElement("img");
    choiceElem.id = choice;
    choiceElem.src = choice + ".png";
    document.getElementById("choices").append(choiceElem);
  }
};


function playerNameCheck() {
  for (const yourChoice of choices){
    const element = document.getElementById(yourChoice);

    element.addEventListener("click", async () => {
      const opponentChoice = getOpponentChoice();

      document.getElementById("opponent-choice").src = opponentChoice + ".png";
      document.getElementById("your-choice").src = yourChoice + ".png";

      const result = calcWinner(yourChoice, opponentChoice);
      updateScore(result);
      updateScoreUi();
      await updateScoreServer(result);
      await updatePlayerScoreList();
    })
  }
}
window.addEventListener("load", () => {
  createImages();
  playerNameCheck();
})

function getOpponentChoice() {
  const value = Math.floor(Math.random() * 3);
  const choise = choices[value];
  return choise;
}

function updateScoreUi() {
  yourScoreElem.innerText = yourScore;
  opponentScoreElem.innerText = opponentScore;
}


function updateScore(result) {
  if (result === "loose") {
    yourScore = 0;
    opponentScore += 1;
  }
  if (result === "win") {
    yourScore += 1;
    opponentScore = 0;
  }
}

function calcWinner(you, opponent){
  if (you !== opponent) {
    if (you == "rock") {
      if (opponent == "scissors") {
        return "win";
      } else if (opponent == "paper") {
        return "loose"
      }
    }

    if (you == "paper") {
      if (opponent == "rock") {
        return "win"
      } else if (opponent == "scissors") {
        return "loose"
      }
    }

    if (you == "scissors") {
      if (opponent == "paper") {
        return "win"
      } else if (opponent == "rock") {
        return "loose"
      }
    }
  }
  return "equal"
}

function updarteScore() {
  if (result === "loose") {
    yourScore = 0;
    opponentScore += 1;
  }
  if (result === "win") {
    yourScore += 1;
    opponentScore = 0;
  }
}

async function updateScoreServer(result) {
  if (result === "win") {

    const result = await firebaseGetPlayerByName(playerName);

    if (result.score < yourScore) {
      await firebaseUpdatePlayerScore(playerName, yourScore);

    }
  }
}


async function firebaseCreatePlayer(name) {
  const response = await fetch(`${baseUrl}/highscore.json`, {
    method: "POST",
    body: JSON.stringify({
      name,
      score: 0
    }),
    headers:{
      "Content-Type": "application/json;charset=UTF-8"
    }
  })
  const json = await response.json()
  // console.log(json);
  const id = json.name;
  return id;
}
async function firebaseGetAllPlayers() {
  const resposne = await fetch(`${baseUrl}/highscore.json`, {
    method: "GET",
  })
  const json = await resposne.json()
  if (json === null) {
    return []
  }
  return Object.entries(json).map(([id, document]) => ({
    id,
    ...document,
  }))
}
async function firebaseGetPlayerByName(name) {
  const players = await firebaseGetAllPlayers(name)
  return players.find(document => document.name === name)
}
async function firebaseCreatePlayerIfNotExists(name) {
  const player = await firebaseGetPlayerByName(name)
  const hasPlayer = Boolean(player);
  if (hasPlayer) {
    return player
  }
  return firebaseCreatePlayer(name);
}
async function firebaseUpdatePlayerScore(name, score) {
  const player = await firebaseGetPlayerByName(name)
  if (!player) {
    return;
  }
  const playerId = player.id;
  const prevScore = player.score;
  if (score < prevScore) {
    return;
  }
  await fetch(`${baseUrl}/highscore/${playerId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      score
    }),
    headers:{
      "Content-Type": "application/json;charset=UTF-8"
    }
  })
}


async function firebaseGetPlayersWithHighestScore() {
  const players = await firebaseGetAllPlayers();
  return players.sort((a, b) => {
    if (a.score < b.score) {
      return 1;
    }
    else if (a.score > b.score) {
      return -1;
    }
    return 0;
  }).slice(0, 5)
}

const playerScoreList = document.getElementById("score-list")

async function updatePlayerScoreList() {
  playerScoreList.innerHTML = "";
  const players = await firebaseGetPlayersWithHighestScore()
  for (const [index, player] of players.entries()) {
    const li = document.createElement("li");
    li.innerText = (1 + index) +". " + player.name +", score: " + player.score
    playerScoreList.appendChild(li);
  }
}
window.addEventListener("load", async () => {
  await updatePlayerScoreList();
})