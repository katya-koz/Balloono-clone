import {Player, Cell} from "/gameClasses/entities.js";
import {HandleEnvironment} from "/gameClasses/environmentHandler.js";
import {Game} from "/game.js"
class Controls { //class handling controls relating to player movement/ other interactions user makes with keyboard

  static keyPressed = { w: false, a: false, s: false, d: false };
  constructor(system, player) {
    this.system = system;
    this.player = player;
    this.bindListeners();
  }
  bindListeners() {
    document.addEventListener("keydown", this.handleKeyDownEvent);
    document.addEventListener("keyup", this.handleKeyUpEvent);
  }
  handleKeyDownEvent(e) {
    Controls.keyPressed[e.key] = true;
    if (e.code == "Space") {
      Player.placeBalloon(Game.entityMasterList.player);
    }
    if (e.code == "KeyD") {
      Game.entityMasterList.player.isMovingRight = true;
      Game.entityMasterList.player.isMovingLeft = false;
    } else if (e.code == "KeyA") {
      Game.entityMasterList.player.isMovingRight = false; // this is necessary for the sprites
      Game.entityMasterList.player.isMovingLeft = true;
    }

  }
  handleKeyUpEvent(e) {
    const { key } = e;
    Controls.keyPressed[key] = false;

    if (e.code == "KeyD") {
      Game.entityMasterList.player.isMovingRight = false;
    } else if (e.code == "KeyA") {
      Game.entityMasterList.player.isMovingLeft = false;

    }
    Game.dataHandler.resetPlayerDirection(this.player);
  }
  handleDirectionChange() {
    let xChange = 0;
    let yChange = 0;

    if (Controls.keyPressed.w) {
      yChange -= Game.entityMasterList.player.stats.speed;
    }
    if (Controls.keyPressed.a) {
      xChange -= Game.entityMasterList.player.stats.speed;
    }
    if (Controls.keyPressed.s) {
      yChange += Game.entityMasterList.player.stats.speed;
    }
    if (Controls.keyPressed.d) {
      xChange += Game.entityMasterList.player.stats.speed;
    }

    if (xChange !== 0 || yChange !== 0) {

      this.player.calcCurrentCell(); // find out which block player is standing on
      Game.dataHandler.updatePlayerCoords(this.player, xChange, yChange); // update the player coords in the dataHandler
      let chunkStartY = Math.floor(this.player.pos.y / Cell.height); // this equation finds the start point of the chunk
      let chunkStartX = Math.floor(this.player.pos.x / Cell.width);
      let chunkW = 2; // 2 x 3 grid
      let chunkH = 3;

      let chunkEndY = chunkStartY + chunkH; 
      let chunkEndX = chunkStartX + chunkW; 
      for (let i = chunkStartY; i < chunkEndY; i++) { // only check collisions for 2x3 grid surrounding player to optimize program
        for (let j = chunkStartX; j < chunkEndX; j++) {
          HandleEnvironment.detectCanvasBoundaries(Game.entityMasterList.player); // maintains canvas boundaries
          if (Game.entityMasterList.backgroundCells[i][j].hasPowerUp) {
            if (HandleEnvironment.checkCollision(Game.entityMasterList.player, Game.entityMasterList.powerUps[i][j])) {
              Game.entityMasterList.powerUps[i][j].addStat(); // check if player is colliding with a powerup... pick it up if they are
            }
          }
          if(Game.entityMasterList.backgroundCells[i][j].hasSplash){
            if(HandleEnvironment.checkCollision(Game.entityMasterList.player, Game.entityMasterList.splash[i][j])){
              Game.entityMasterList.splash[i][j].killPlayer(Game.entityMasterList.player) // if splash is colliding with a player, kill them
              //console.log("touching splash!")
            }
          }

          if (Game.entityMasterList.backgroundCells[i][j].hasStoneBlock || Game.entityMasterList.backgroundCells[i][j].hasWoodenBlock) {
            // console.log(i, j)
            // console.log(Game.entityMasterList);
       
            HandleEnvironment.detectCollisions(Game.entityMasterList.player, Game.entityMasterList.backgroundCells[i][j]); // check if player is colliding with wooden or stone block and treat them as boundaries
          }

          else if (Game.entityMasterList.backgroundCells[i][j].hasBalloon) {
            if (HandleEnvironment.checkCollision(Game.entityMasterList.player, Game.entityMasterList.balloons[i][j]) && Game.entityMasterList.balloons[i][j].isNew == true) { // treat balloons as boundaries only if the player has already stepped off of them.. if player steps off of 'new' balllon, change balloon to 'old' balloon so it can be a boudnary
              Game.entityMasterList.balloons[i][j].isNew = true;
            } else {
              Game.entityMasterList.balloons[i][j].isNew = false
            }

            if (Game.entityMasterList.balloons[i][j].isNew == false) {
              HandleEnvironment.detectCollisions(Game.entityMasterList.player, Game.entityMasterList.balloons[i][j]);
            }
          }
        }

      }
    }
  }
}

export{Controls}