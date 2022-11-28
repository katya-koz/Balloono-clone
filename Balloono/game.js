import { System } from "./firebase/system.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js"
import {
  get,
  ref
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

import { Board } from "/gameClasses/board.js";
import { Controls } from "/gameClasses/controls.js";
import { HandleData } from "/gameClasses/dataHandler.js";
import { Player, Cell } from "/gameClasses/entities.js";
import { HandleEnvironment } from "/gameClasses/environmentHandler.js";
import { HandleSprites } from "/gameClasses/spritehandler.js"

// jsut to note... this game is not complete

class Game {
  static user;
  static dataHandler;
  static environmentHandler = new HandleEnvironment();
  static gameEnd = false;
  static userCount = 1;
  static gameHost;
  static mapGenerated;

  static entityMasterList = {
    player: null,
    otherPlayers: {},
    stoneBlocks: [],
    woodenBlocks: [],
    balloons: [],
    backgroundCells: [],
    splash: [],
    powerUps: [],
  }

  constructor(lobbyId, system) {
    this.lobbyId = lobbyId;
    this.system = system;
    Game.user = this.system.authApp.user.uid;
    Game.dataHandler = new HandleData(this.system, this.lobbyId);

    this.initialize();
  }
  getMapStatus() {
    get(ref(this.system.db, `rooms/${this.lobbyId}/game/mapStatus`)).then((snapshot) => {
      if (snapshot.exists()) {
        Game.mapGenerated = snapshot.val();

      } else {
        Game.mapGenerated = false;
      }

    })

  }
  getGameHost() {
    get(ref(this.system.db, `rooms/${this.lobbyId}/users`)).then((snapshot) => {
      Game.gameHost = Object.keys(snapshot.val())[0];

    })

  }
  countUsers() { // counts the users??? duhhh
    let j = 0;
    get(ref(this.system.db, `rooms/${this.lobbyId}/users`)).then((snapshot) => {
      for (let user in snapshot.val()) {
        j++;
      }
      this.userCount = j;
    });
  }
  async initializeUser() {

    await this.getSpawn();
    this.player = new Player(this.system.authApp.user.uid, this.spawnPoint);
    Game.entityMasterList.player = this.player;
    this.controls = new Controls(this.system, this.player);
    Game.dataHandler.getStuff();
  }
  async initialize() {
    this.getMapStatus();
    this.getGameHost();
    await this.initializeUser();
    Game.environmentHandler.initializeEnvironment();
    this.board = new Board();
    Game.dataHandler.exportWoodenBlocks();
    Board.spriteHandler = new HandleSprites(Game.entityMasterList.player);
    this.player.currentCell = Game.entityMasterList.backgroundCells[0][0]; //initialize to first cell AFTER environment has been initialized
    Game.dataHandler.updatePos(this.player);
    Game.dataHandler.getCoins(this.player);
    Game.dataHandler.detectServerChanges();

    await Game.dataHandler.getPlayers();

    //Game.dataHandler.getStuffForOtherPlayers();

    //this.countUsers();
    Game.dataHandler.winListener(Game.userCount);

    setInterval(function () {
      this.gameLoop();
    }.bind(this), 40);
    // this.gameLoop();
  }
  async getSpawn() {
    let j = 0;
    await get(ref(this.system.db, `rooms/${this.lobbyId}/users`)).then((snapshot) => {
      // is this lazy?? yes.. mayb...but i am sooo tired and i cant be bothered to think of a sick algoritm to find spawning coords... hahaha. maybe in my next life
      for (let user in snapshot.val()) {

        if (user == Game.user) {
          if (j == 0) {
            this.spawnPoint = { x: Cell.width, y: Cell.height / 2 }
          } else if (j == 1) {
            this.spawnPoint = { x: (Board.width - 2) * Cell.width, y: (Board.height - 3) * Cell.height }
          } else if (j == 2) {
            this.spawnPoint = { x: (Board.width - 2) * Cell.width, y: Cell.height / 2 }
          } else if (j == 3) {
            this.spawnPoint = { x: Cell.width - 2 * Cell.width, y: (Board.height - 3) * Cell.height }
          }
        } else {
          j++;
        }
      }
    });
    //console.log(this.spawnPoint);
  }
  gameLoop() {
    Board.updateGraphics();
    this.controls.handleDirectionChange(); // this is it... THE game.
  }
}

class GamePage {
  constructor() {
    this.system = new System();

    onAuthStateChanged(this.system.authApp.auth, (user) => {
      if (user) {
        this.createGame(); // make sure user is logged in before creating the game
      }
    })
  }
  createGame() {
    this.game = new Game(new URLSearchParams(window.location.search).get('rm'), this.system);
  }
}

new GamePage();

export { Game }