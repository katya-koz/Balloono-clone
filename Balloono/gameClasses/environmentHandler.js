import { Board } from "/gameClasses/board.js";
import { StoneBlock, WoodenBlock, Block, Boundary, Cell } from "/gameClasses/entities.js";
import { Game } from "/game.js"


class HandleEnvironment {
  // handles environmental equations, objects and their interactions with one another/ player
  static woodenBlockChance = 5; // 70% chance
 
  static randomize(max, target) {
    let isChance = Math.floor(Math.random() * max);
    if (isChance < target) {
      return true;
    } else {
      return false;
    }
  }
  checkIfSpotIsFree(i, j) {
    for (let n = 0; n < this.rejectSpots.length; n++) {
      if (this.rejectSpots[n].row == i && this.rejectSpots[n].column == j) {
        return false;
      }
    }
    return true;
  }

  generateWoodenBlock(i, j) {
    this.rejectSpots = [ // these are all possible spots where the player could spawn, so ive blocked them out
      { row: 1, column: 1 },
      { row: 1, column: 2 },
      { row: 2, column: 1 },

      { row: 1, column: Board.width - 3 },
      { row: 1, column: Board.width - 2 },
      { row: 2, column: Board.width - 2 },

      { row: Board.height - 2, column: Board.width - 3 },
      { row: Board.height - 2, column: Board.width - 2 },
      { row: Board.height - 3, column: Board.width - 2 },

      { row: Board.height - 2, column: 1 },
      { row: Board.height - 2, column: 2 },
      { row: Board.height - 3, column: 1 },
    ]
    Game.dataHandler.mapGenerated();
    if (!Game.entityMasterList.backgroundCells[i][j].hasStoneBlock) {
      if (this.checkIfSpotIsFree(i, j)) {
        if (HandleEnvironment.randomize(10, HandleEnvironment.woodenBlockChance)) {
          this.woodenBlock = new WoodenBlock(j * Block.dimensions.w, (i * Cell.height) - Block.dimensions.overhang, Game.entityMasterList.backgroundCells[i][j], i * Board.width + j);

          Game.dataHandler.addEntity(this.woodenBlock);
        }
      }
      
    }
  }
  static detectCanvasBoundaries(player) { // finds canvas boundaries... very much like 'detectColliisons function'
    let xChange = 0;
    let yChange = 0;
    if (player.pos.y < 0) {
      yChange -= player.pos.y;
    }
    if (player.pos.x < 0) {
      xChange -= player.pos.x;
    }
    if (player.pos.x + player.dimensions.w > Board.element.width) {
      xChange -= player.pos.x + player.dimensions.w - Board.element.width;
    }
    if (player.pos.y + player.dimensions.h > Board.element.height) {
      yChange -= player.pos.y + player.dimensions.h - Board.element.height;
    }
    Game.dataHandler.updatePlayerCoords(player, xChange, yChange);
  }

  static calcCenterDistance(player, cell) {
    let resultant;
    //applies the pythagorean theorem to find magnitude between two specified points
    let sideA = (player.dimensions.h * 0.75 + player.pos.y) - (cell.dimensions.h / 2 + cell.pos.y);
    let sideB = (player.dimensions.w / 2 + player.pos.x) - (cell.dimensions.w / 2 + cell.pos.x);
    resultant = {
      magnitude: Math.sqrt((sideA * sideA) + (sideB * sideB)),
      x: cell.dimensions.w / 2 + cell.pos.x, // coords of the center of the cell
      y: cell.dimensions.h / 2 + cell.pos.y,
    }
    return resultant;
  }
  compareDistances(player, cell, currentResultant) {
    // calc magnitude between center of player's base and center of cell and update the value of the current shortest magnitude as needed
    let computedResultant = HandleEnvironment.calcCenterDistance(player, cell);
    if (currentResultant.magnitude > computedResultant.magnitude) {
      currentResultant = computedResultant;
      player.currentCell = cell;
    }
    return (currentResultant);
  }
  initializeEnvironment() {
    //used to initialize environment for the first time creating objects... it is a little repetitive.. ill admit
    for (let i = 0; i < Board.height; i++) {
      Game.entityMasterList.woodenBlocks.push([])
      Game.entityMasterList.balloons.push([]);
      Game.entityMasterList.stoneBlocks.push([]);
      Game.entityMasterList.backgroundCells.push([]);
      Game.entityMasterList.splash.push([]);
      Game.entityMasterList.powerUps.push([]);
      for (let j = 0; j < Board.width; j++) {
        Game.entityMasterList.woodenBlocks[i].push([]);
        Game.entityMasterList.powerUps[i].push([]);
        Game.entityMasterList.splash[i].push([]);
        Game.entityMasterList.backgroundCells[i].push(new Cell(j * Cell.width, i * Cell.height, i, j)); // the only thing that is being stored locally is the backgroudn cells and stone blocks... this is because they dont change and dont need to ever be stored in the database
        Game.entityMasterList.balloons[i].push([]);
        if (i === 0 || i === Board.height - 1 || j == 0 || j === Board.width - 1) {
          let x = j * Block.dimensions.w;
          let y = (i * Cell.height) - Block.dimensions.overhang;
          this.stoneBlock = new Boundary(x, y); // making a boundary (bush things around map)
          Game.entityMasterList.backgroundCells[i][j].hasStoneBlock = true; // super lazy to make a new boolean signifying presence of boundary on cell, so im jsut reusing stoneBlock
          Game.entityMasterList.stoneBlocks[i].push(this.stoneBlock); // stores in object dictionary
        }
        else if ((i % 2 == 0 && j % 2 == 0 && !Game.entityMasterList.backgroundCells.hasStoneBlock)) { // render and store stones (every other one)
          let x = j * Block.dimensions.w;
          let y = (i * Cell.height) - Block.dimensions.overhang;
          this.stoneBlock = new StoneBlock(x, y);
          Game.entityMasterList.backgroundCells[i][j].hasStoneBlock = true;
          Game.entityMasterList.stoneBlocks[i].push(this.stoneBlock); // stores in object dictionary
        }
        else {
          Game.entityMasterList.stoneBlocks[i].push([]); // push empty array to signify lack of stone block in that portion of the grid
        }
        if(Game.user == Game.gameHost && Game.mapGenerated == false){
          console.log("generating mappp xpooxoox");
          this.generateWoodenBlock(i, j);
        }
      }
    }
  }

  static checkCollision(player, entity) {
    //rudimentary collision checker. used to check if any part of the player is colliding with any part of another entity.. this isnt for maintaining boundaries, but for interacting with objects (picking upo a powerup, walking over a ballon, being splashed and KILLED)
    let collisionStatus;

    // check for collisions
    if (player.pos.x < entity.pos.x + entity.dimensions.w && // if the player's lateral coordinates are within the target object;s lateral coordinates
      player.pos.x + player.dimensions.w > entity.pos.x &&
      player.pos.y + player.dimensions.h/2 < entity.pos.y + entity.dimensions.h &&    // and if the player's lattitudial coordinates are within the target object's lattitudial coordinates
      player.pos.y + player.dimensions.h > entity.pos.y && !player.isDead) {

      // a collision is detected!
      collisionStatus = true; // set the object the player is colliding with's collision value to true
    } else {
      collisionStatus = false; // otherwise, set the collision value to false
    }
    return collisionStatus;
  }
  static detectCollisions(player, block) {
    // detect collisions taking into account which side of which block the player is colliding with and furthermore maintaining their boundaries
    let xChange = 0;
    let yChange = 0;

    // https://stackoverflow.com/questions/29861096/detect-which-side-of-a-rectangle-is-colliding-with-another-rectangle

    // var dx=(r1.x+r1.w/2)-(r2.x+r2.w/2);
    // var dy=(r1.y+r1.h/2)-(r2.y+r2.h/2);
    // var width=(r1.w+r2.w)/2;
    // var height=(r1.h+r2.h)/2;
    // var crossWidth=width*dy;
    // var crossHeight=height*dx;


    var dx = (player.pos.x + player.dimensions.w / 2) - (block.pos.x + block.dimensions.w / 2);
    var dy = (player.pos.y + player.dimensions.h*(3/4)) - (block.pos.y + block.dimensions.h / 2);
    var width = (player.dimensions.w + block.dimensions.w) / 2;
    var height = (player.dimensions.h /2 + block.dimensions.h) / 2;
    var crossWidth = width * dy;
    var crossHeight = height * dx;
    var collision = 'none';

    if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
      if (crossWidth > crossHeight) {
        collision = (crossWidth > (-crossHeight)) ? 'bottom' : 'left';
      } else {
        collision = (crossWidth > -(crossHeight)) ? 'right' : 'top';
      }
    }

    // var bL = block.pos.x;
    // var bR = block.pos.x + block.dimensions.w;
    // var bT = block.pos.y;
    // var bB = block.pos.y + block.dimensions.h;

    // var pL = player.pos.x;
    // var pR = player.pos.x + player.dimensions.w;
    // var pT = player.pos.y + player.dimensions.h/2;
    // var pB = player.pos.y + player.dimensions.h;

    // if (block.pos.x < player.pos.x + player.dimensions.w &&
    //   block.pos.x + block.dimensions.w > player.pos.x &&
    //   block.pos.y < player.pos.y + player.dimensions.h &&
    //   rect1.h + block.pos.y > player.pos.y) {
      
  // } 

    // i was going to use SAT collision detection but there wasnt enough time so we r just stuck with these kinda crappy collision detections (youll see in game lol)
    if (collision == 'bottom' && !player.isDead) {
      yChange += block.pos.y + block.dimensions.h - player.pos.y - player.dimensions.h / 2; // gently and lovingly place the player onto the boundary <3
    }
    if (collision == 'top' && !player.isDead) { // when a player is dead, they are able to move through blocks as if they are a ghost
      yChange -= player.pos.y + player.dimensions.h - block.pos.y;

    }
    if (collision == 'left' && !player.isDead) {
      xChange -= player.pos.x + player.dimensions.w - block.pos.x
    }
    if (collision == 'right' && !player.isDead) {
      xChange += block.pos.x + block.dimensions.w - player.pos.x;
    }

    Game.dataHandler.updatePlayerCoords(player, xChange, yChange); // update the player coords after a collison, since the collison fixes their coords to the boundary of the block 
  }
}

export { HandleEnvironment }