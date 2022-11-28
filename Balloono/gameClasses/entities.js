import {Board} from "/gameClasses/board.js";
import {HandleEnvironment} from "/gameClasses/environmentHandler.js";
import {Game} from "/game.js"
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";
/// i didnt exactly do the best job with inheritance here and got pretty lazy... 
class Boundary {
  constructor(x, y) {
    this.dimensions = {
      w: 50,
      h: 55,
      overhang: 5,
    }
    this.pos = {
      x: x,
      y: y,
    }
    this.center = {
      x: this.pos.x - (this.dimensions.w / 2),
      y: this.pos.y - (this.dimensions.h / 2),
    }
    this.identifier = "image"; // for rendering
    this.name = "trees";
    this.img = new Image();
    this.img.src = ("/assets/bush.png")
    this.color = "#d4d4d4";
  }
}
class Cell {
  static height = 50;
  static width = Cell.height;
  constructor(x, y, i, j) {
    this.identifier = "rectangle"; // type of rendering 
    this.pos = {
      x: x,
      y: y,
    }
    this.center = {
      x: this.pos.x + Cell.width / 2,
      y: this.pos.y + Cell.height / 2,
    }
    this.dimensions = {
      w: 50,
      h: 50,
      overhang: 0,
  
    }
    this.hasBalloon = false; // relevent for collision detection
    this.hasStoneBlock = false;
    this.hasWoodenBlock = false;
    this.hasSplash = false;
    this.hasPowerUp = false;
    this.gridLocation = {
      row: i,
      column: j,
    }
  }
  addBalloon(balloon) {
    Game.entityMasterList.balloons[this.gridLocation.row][this.gridLocation.column] = balloon;
  }
}

class Block {
  static dimensions = {
    w: 50,
    h: 55,
    overhang: 5,
  }
  constructor(x, y, id) {
    this.pos = {
      x: x,
      y: y,
    }
    this.id = id;
  }
}

class WoodenBlock extends Block {
  constructor(x, y, onCell, id) {
    super(x, y, id);
    this.dimensions = {
      w: 50,
      h: 55,
      overhang: 5,
    }
    this.name = "woodenBlocks";
    this.onCell = onCell;
    this.identifier = "image";
    this.img = new Image();
    this.img.src = ("/assets/wood.png");
    this.hasHit = false;
  }
}

class StoneBlock extends Block {

  constructor(x, y, id) {
    super(x, y, id);
    this.dimensions = {
      w: 50,
      h: 55,
      overhang: 5,
    }
    this.identifier = "image";
    this.name = "stoneBlocks";
    this.img = new Image();
    this.img.src = ("/assets/stone.png")
    this.color = "#d4d4d4";
  }
}

class PowerUp {
  static max = 12;
  constructor(onCell, player) {
    this.identifier = "image";
    this.img = new Image();
    this.player = player;
    this.onCell = onCell;
    this.name = "powerUps";

    this.dimensions = {
      w: 40,
      h: 40,
    }
    this.pos = {
      x: this.onCell.pos.x + (this.onCell.dimensions.w - this.dimensions.w) / 2,
      y: this.onCell.pos.y + (this.onCell.dimensions.h - this.dimensions.h) / 2,
    }

  } 
  addStat() { // youll be excited to see some polymorphism here
    throw new error("cannot call method without initializing powerup type!");
  }
  removePowerUp() {
    Game.dataHandler.removeEntity(Game.entityMasterList.powerUps[this.onCell.gridLocation.row][this.onCell.gridLocation.column]);
    Game.entityMasterList.powerUps[this.onCell.gridLocation.row][this.onCell.gridLocation.column] = [];
    this.onCell.hasPowerUp = false;
  }
}

class RangePowerUp extends PowerUp {
  constructor(onCell, player) {
    super(onCell, player);
    this.img.src = "assets/rangeUp.png"
    this.onCell = onCell;
    this.name = "powerUps";
    this.type = "rangePowerUp"
    this.player = player;
    this.id = this.onCell.gridLocation.row * Board.width + this.onCell.gridLocation.column;
  }
  addStat() {
    if (this.player.stats.range < PowerUp.max) {
      this.player.stats.range += 1;
    }
    this.removePowerUp();
  }
}

class SpeedPowerUp extends PowerUp {
  constructor(onCell, player) {
    super(onCell, player);
    this.img.src = "assets/speed.png"
    this.onCell = onCell;
    this.name = "powerUps";
    this.type = "speedPowerUp"
    this.id = this.onCell.gridLocation.row * Board.width + this.onCell.gridLocation.column;
    this.player = player;
  }
  addStat() {
    if (this.player.stats.speed < PowerUp.max) {
      this.player.stats.speed += 1;
    }
    this.removePowerUp();
  }
}

class BalloonPowerUp extends PowerUp {
  constructor(onCell, player) {
    super(onCell, player);
    this.img.src = "assets/balloonUp.png"
    this.onCell = onCell;
    this.name = "powerUps";
    this.type = "balloonPowerUp"
    this.player = player;
    this.id = this.onCell.gridLocation.row * Board.width + this.onCell.gridLocation.column;
  }
  addStat() {
    if (this.player.stats.maxBalloons < PowerUp.max) {
      this.player.stats.maxBalloons += 1;
    }
    this.removePowerUp();
  }
}

class OtherPlayer {
  constructor(x, y, uid) {
    this.pos = {
      x: x,
      y: y
    };
    this.dimensions = {
      w: 45,
      h: 70
    };
    this.stuff = {
      hat: new Image(),
      outfit: new Image(),
      boots: new Image(),
    }
    this.currentCell = {
      row: 0,
      column: 0,
    }
    this.stuff.hat.src;
    this.stuff.outfit.src;
    this.stuff.boots.src;
    this.identifier = "sprite";
    this.img = new Image();
    this.img.src = "/assets/sprites/cat_spriteSheet.png";
    this.uid = uid;
    this.isDead = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
  }
}


class Player {
  constructor(uid, spawn) {

    this.identifier = "sprite"; // type of rendering 
    this.uid = uid;
    this.isDead = false;
    this.pos = {
      x: spawn.x,
      y: spawn.y,
    };
    this.dimensions = {
      w: 45,
      h: 70
    };
    this.isMovingRight = false;
    this.isMovingLeft = false;
    this.collisions = {
      right: false,
      left: false,
      top: false,
      bottom: false,
    };
    this.center = {
      x: this.pos.x - (this.dimensions.w / 2),
      y: this.pos.y - (this.dimensions.h / 2),
    }
    this.stuff = { // this holds the image values for the customizatio to be rendered on top
      hat: new Image(),
      outfit: new Image(),
      boots: new Image(),
    }
    this.stuff.hat.src;
    this.stuff.outfit.src;
    this.stuff.boots.src;
    this.stats = {
      speed: 8,
      range: 1,
      maxBalloons: 1,
      balloonsPlaced: 0,
    };
    this.img = new Image();
    this.img.src = "/assets/sprites/cat_spriteSheet.png";
  }
  calcCurrentCell() {
    let currentCell = { // temp placeholder for current cell resultant.. this is set so that it is certainly replaced by a cell that is closer
      magnitude: 9999,
      x: 9999,
      y: 9999,
    }
    for (let i = 0; i < Game.entityMasterList.backgroundCells.length; i++) {
      for (let j = 0; j < Game.entityMasterList.backgroundCells[i].length; j++) {
        currentCell = Game.environmentHandler.compareDistances(Game.entityMasterList.player, Game.entityMasterList.backgroundCells[i][j], currentCell); // compare distances (see more of the math that goes into this in environmentHandler.js) and finds the closest cell.. for the first time this function is called, it iterates through every single cell
      }
    }
  }
  static placeBalloon(player) { // this places balloons 
    if (player.stats.balloonsPlaced < player.stats.maxBalloons) {
      if (!player.currentCell.hasBalloon && !player.currentCell.hasStoneBlock && !player.currentCell.hasWoodenBlock && !player.isDead) { 
        player.stats.balloonsPlaced++; // records that the player has plaaced a balloon
        this.balloon = new Balloon(player.currentCell, player.stats.range, player) // creates balloon
        Game.entityMasterList.balloons[player.currentCell.gridLocation.row][player.currentCell.gridLocation.column] = this.balloon;
        Game.entityMasterList.backgroundCells[player.currentCell.gridLocation.row][player.currentCell.gridLocation.column].hasBalloon = true; // locally stores balloon
        Game.dataHandler.addEntity(this.balloon); //sends balloon to server 

      } 
    }
  }
}

class SplashPath {
  //im warnning u rn this class is my LEAST favourite
  constructor(onCell, range) {
    this.onCell = onCell;
    this.range = range;
    this.pathClear = { // tracks if the path is clear for the splash
      n: null,
      e: null,
      s: null,
      w: null,
    };
    this.hasHitWoodenBlock = { // tracks if the splas has hit any wooden blocks (allows it to breakonly ONE block)
      n: false,
      e: false,
      s: false,
      w: false,
    };
    this.rangeForSplashPath = {
      n: 0, // tracks range for the splash path (until it either hits a block or it runs out of range)
      nCut: false,
      e: 0,
      eCut: false,
      s: 0,
      sCut: false,
      w: 0,
      wCut: false,
    }
    this.splashes = [];
    this.createSplash();
  }
  addSplash(row, column, imgSrc, width, height) {
    this.splash = new Splash(Game.entityMasterList.backgroundCells[row][column], imgSrc, width, height);// make the splash
    Game.entityMasterList.splash[row][column] = this.splash;
    this.splash.killPlayer(Game.entityMasterList.player) // if splash is colliding with a player, kill them
    Game.entityMasterList.backgroundCells[row][column].hasSplash = true;
    this.splashes.push(this.splash);
  }
  removeSplash(row, column) { // for removing splashes after the pop time is up
    Game.entityMasterList.splash[row][column] = [];
    Game.entityMasterList.backgroundCells[row][column].hasSplash = false;
  }
  removeAllSplashPaths() { // removes ALL splashes after the pop time is up 
    for (let i = 0; i < this.splashes.length; i++) {
      this.removeSplash(this.splashes[i].onCell.gridLocation.row, this.splashes[i].onCell.gridLocation.column);
    }
  }
  calcRanges() { // this calculates how much range each cardinal direction around the balloon has until it either runs out of range, or hits something
    this.n = 1;
    this.rangeLeft = this.range;
    while (this.rangeLeft > 0) { // while the values are still changing
      //north splash
      this.isPathClear(this.onCell.gridLocation.row - this.n, this.onCell.gridLocation.column, -1, this.onCell.gridLocation.row - this.n, this.rangeForSplashPath.nCut) ? this.rangeForSplashPath.n++ : this.rangeForSplashPath.nCut = true;
      //south splash
      this.isPathClear(this.onCell.gridLocation.row + this.n, this.onCell.gridLocation.column, this.onCell.gridLocation.row + this.n, Board.height, this.rangeForSplashPath.sCut) ? this.rangeForSplashPath.s++ : this.rangeForSplashPath.sCut = true;
      //east splash
      this.isPathClear(this.onCell.gridLocation.row, this.onCell.gridLocation.column + this.n, this.onCell.gridLocation.column + this.n, Board.width, this.rangeForSplashPath.eCut) ? this.rangeForSplashPath.e++ : this.rangeForSplashPath.eCut = true;

      //west splash
      this.isPathClear(this.onCell.gridLocation.row, this.onCell.gridLocation.column - this.n, -1, this.onCell.gridLocation.column - this.n, this.rangeForSplashPath.wCut) ? this.rangeForSplashPath.w++ : this.rangeForSplashPath.wCut = true;

      this.n++;
      this.rangeLeft--;
    }
  }
  checkBoundary(boundary1, boundary2) { // checks if the balloon splash is out of bounds or not
    if (boundary1 < boundary2) {
      return true;
    } else {
      return false;
    }
  }
  
  createSplash() {
    this.calcRanges(); // the ranges are calculated (how far in each direction the splash path can travel)
    this.addSplash(this.onCell.gridLocation.row, this.onCell.gridLocation.column, "assets/center.png", 50, 50);
    //north
    for (let i = 1; i < this.rangeForSplashPath.n + 1; i++) { //adds one splash in the center
      if (i == this.rangeForSplashPath.n) { // for the length of range in each direction, splashes are created.. their textures change based on if theyre an end piece or not
        this.addSplash(this.onCell.gridLocation.row - i, this.onCell.gridLocation.column, "assets/endnorth.png", 40, 50)
      } else {
        this.addSplash(this.onCell.gridLocation.row - i, this.onCell.gridLocation.column, "assets/northsouthsplash.png", 40, 50)
      }

    }
    //east
    for (let i = 1; i < this.rangeForSplashPath.e + 1; i++) {
      if (i == this.rangeForSplashPath.e) {
        this.addSplash(this.onCell.gridLocation.row, this.onCell.gridLocation.column + i, "assets/endeast.png", 50, 40)
      } else {
        this.addSplash(this.onCell.gridLocation.row, this.onCell.gridLocation.column + i, "assets/eastwestsplash.png", 50, 40)
      }
    }
    //south
    for (let i = 1; i < this.rangeForSplashPath.s + 1; i++) {
      if (i == this.rangeForSplashPath.s) {
        this.addSplash(this.onCell.gridLocation.row + i, this.onCell.gridLocation.column, "assets/endsouth.png", 40, 50)
      } else {
        this.addSplash(this.onCell.gridLocation.row + i, this.onCell.gridLocation.column, "assets/northsouthsplash.png", 40, 50)
      }
    }
    //west
    for (let i = 1; i < this.rangeForSplashPath.w + 1; i++) {
      if (i == this.rangeForSplashPath.w) {
        this.addSplash(this.onCell.gridLocation.row, this.onCell.gridLocation.column - i, "assets/endwest.png", 50, 40)
      } else {
        this.addSplash(this.onCell.gridLocation.row, this.onCell.gridLocation.column - i, "assets/eastwestsplash.png", 50, 40)
      }

    }
    this.breakWoodenBlocks(); // break the blocks
    setTimeout(() => {
      this.removeAllSplashPaths(); // after the splash time is up, remove the splashes
    }, Splash.splashTime);

  }
  destroyWoodenBlock(row, column) {
    if (HandleEnvironment.randomize(10, 4)) { // about a 2/5 chance a powerup will spawn
      SplashPath.randomizePowerUp(row, column); // randomizes the chance of powerup and if it lands, then a random powerup will spawn
    };
    Game.dataHandler.removeEntity(Game.entityMasterList.woodenBlocks[row][column]) // remove block from server
    Game.entityMasterList.woodenBlocks[row][column] = [];
    Game.entityMasterList.backgroundCells[row][column].hasWoodenBlock = false; // remove locally
  }
  breakWoodenBlocks() { // okay.. so when this.rangeForSplashPath.[direction]Cut is true, it means that the path was cut short by an object in the way... it then checks if the block one more spot ahead (one up, down, left, or right, depending on direction) was a wooden block, and if it is, then it will destroy that block
    if (this.rangeForSplashPath.nCut && this.checkBoundary(-1, this.onCell.gridLocation.row - this.rangeForSplashPath.n - 1) && Game.entityMasterList.backgroundCells[this.onCell.gridLocation.row - this.rangeForSplashPath.n - 1][this.onCell.gridLocation.column].hasWoodenBlock) { // if the path is cut in the north direction
      this.destroyWoodenBlock(this.onCell.gridLocation.row - this.rangeForSplashPath.n - 1, this.onCell.gridLocation.column); // this is what actually destroys hte block
    }
    if (this.rangeForSplashPath.sCut && this.checkBoundary(this.onCell.gridLocation.row + this.rangeForSplashPath.s + 1, Board.height - 1) && Game.entityMasterList.backgroundCells[this.onCell.gridLocation.row + this.rangeForSplashPath.s + 1][this.onCell.gridLocation.column].hasWoodenBlock) { // if the path is cut in the south direction
      this.destroyWoodenBlock(this.onCell.gridLocation.row + this.rangeForSplashPath.s + 1, this.onCell.gridLocation.column);

    }
    if (this.rangeForSplashPath.eCut && this.checkBoundary(this.onCell.gridLocation.column + this.rangeForSplashPath.e + 1, Board.width - 1) && Game.entityMasterList.backgroundCells[this.onCell.gridLocation.row][this.onCell.gridLocation.column + this.rangeForSplashPath.e + 1].hasWoodenBlock) { // if the path is cut in the east direction
      this.destroyWoodenBlock(this.onCell.gridLocation.row, this.onCell.gridLocation.column + this.rangeForSplashPath.e + 1);

    }
    if (this.rangeForSplashPath.wCut && this.checkBoundary(-1, this.onCell.gridLocation.column - this.rangeForSplashPath.w - 1) && Game.entityMasterList.backgroundCells[this.onCell.gridLocation.row][this.onCell.gridLocation.column - this.rangeForSplashPath.w - 1].hasWoodenBlock) { // if the path is cut in the west direction
      this.destroyWoodenBlock(this.onCell.gridLocation.row, this.onCell.gridLocation.column - this.rangeForSplashPath.w - 1);
    }
  }
  isPathClear(row, column, boundary1, boundary2, pathBlocked) { // checks if path is clear... is the splash going passt a boundary? is the splash hitting a block?
    if (this.checkBoundary(boundary1, boundary2) && !Game.entityMasterList.backgroundCells[row][column].hasWoodenBlock && !Game.entityMasterList.backgroundCells[row][column].hasStoneBlock && !pathBlocked) {
      return true;
    } else {
      return false;
    }
  }
  static randomizePowerUp(row, column) { // when a block is broken, this function runs and randomizes the powerup 
    let powerUp = Math.floor(Math.random() * 3);
    if (powerUp === 0) {
      this.powerUp = new BalloonPowerUp(Game.entityMasterList.backgroundCells[row][column], Game.entityMasterList.player);
      Game.entityMasterList.powerUps[row][column] = this.powerUp;
    } else if (powerUp === 1) {
      this.powerUp = new RangePowerUp(Game.entityMasterList.backgroundCells[row][column], Game.entityMasterList.player);
      Game.entityMasterList.powerUps[row][column] = this.powerUp

    } else if (powerUp === 2) {
      this.powerUp = new SpeedPowerUp(Game.entityMasterList.backgroundCells[row][column], Game.entityMasterList.player);
      Game.entityMasterList.powerUps[row][column] = this.powerUp;
    }
    Game.dataHandler.addEntity(this.powerUp); // adds powerup to server
    Game.entityMasterList.backgroundCells[row][column].hasPowerUp = true;
  }
}
class Splash {
  static splashTime = 500;
  constructor(onCell, imgSrc, width, height) {
    this.identifier = "image";

    this.onCell = onCell;
    this.img = new Image();
    this.img.src = imgSrc
    this.dimensions = {
      w: width,
      h: height
    }
    this.pos = {
      x: this.onCell.pos.x + (this.onCell.dimensions.w - this.dimensions.w) / 2,
      y: this.onCell.pos.y + (this.onCell.dimensions.h - this.dimensions.h) / 2
    }

    this.popBalloon(); // function which checks if splash is hitting a balloon, and if it, pop that balloon
  }
  killPlayer(player) {
    if (this.onCell.gridLocation.row === player.currentCell.gridLocation.row && this.onCell.gridLocation.column === player.currentCell.gridLocation.column) {
      player.isDead = true;
      Game.dataHandler.playerDead(); // kill player if player is touching splash
    }
  }
  popBalloon() {
    if (this.onCell.hasBalloon) {
      Game.entityMasterList.balloons[this.onCell.gridLocation.row][this.onCell.gridLocation.column].pop();
    }
  }
}
class Balloon {
  static popTime = 4000; // pop time in ms
  constructor(onCell, range, player) {
    this.player = player;
    this.onCell = onCell;
    this.popped = false;
    this.range = range
    this.id = this.onCell.gridLocation.row * Board.width + this.onCell.gridLocation.column;
    this.img = new Image();
    this.name = "balloons"
    this.identifier = "image"
    this.img.src = "/assets/balloon.png";
    this.dimensions = {
      w: 40,
      h: 40,
      overhang: 0,
    }
    this.pos = {
      x: this.onCell.pos.x + (this.onCell.dimensions.w - this.dimensions.w) / 2,
      y: this.onCell.pos.y + (this.onCell.dimensions.h - this.dimensions.w) / 2,
    }
    this.center = {
      x: this.pos.x - (this.dimensions.w / 2),
      y: this.pos.y - (this.dimensions.h / 2),
    }

    this.isNew = true; // boolean value to track whether or not a balloon has just been placed... allows the player to briefly walk over the balloon when first place to avoid collision bouncing
    setTimeout(() => { this.pop(); }, Balloon.popTime); // balloon immedietly starts to pop as it's placed
  }
  pop() {
    if (!this.popped) {

      this.popped = true;
      if (this.player.uid === Game.user) { // finds out if the player that placed the balloon is the same as the user, and if it is, then update balloonsPlaced to allow player to place more balloons once they pop
        this.player.stats.balloonsPlaced--;
      }
      Game.dataHandler.removeEntity(Game.entityMasterList.balloons[this.onCell.gridLocation.row][this.onCell.gridLocation.column]);
      Game.entityMasterList.balloons[this.onCell.gridLocation.row][this.onCell.gridLocation.column] = []; // remove balloon from entity list
      this.onCell.hasBalloon = false;
      this.createSplashPath(); // water splash after pop
    }
  }
  createSplashPath() {
    new SplashPath(this.onCell, this.range);// when a balloon pops... create the splashes
  }
}

export {Balloon, Player, OtherPlayer, StoneBlock, WoodenBlock, Splash, SplashPath, Block, PowerUp, RangePowerUp, BalloonPowerUp, SpeedPowerUp, Boundary, Cell}