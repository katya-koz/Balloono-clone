import { Block, Cell } from "/gameClasses/entities.js";
import { Game } from "/game.js"
class Board { // drawing object; handles background graphics of our game and initial environmental generation
  static spriteHandler;
  static spriteColumn = 0;
  static spriteRow = 0;
  static width = 19; //gameboard dimensions in terms of number of cells/ row & column// size changes based on num of players
  static height = 13;
  static element = document.getElementById("game-window");
  static ctx = Board.element.getContext("2d");
  constructor() {
    console.log("board is being made...")
    this.declareCanvasDimensions();
    Board.drawBackground();
  }
  declareCanvasDimensions() {
    //setting canvas length n width based on # of cells and their width - for modularity/ability to change layout of board easily
    Board.element.width = Cell.width * Board.width;
    Board.element.height = Cell.height * Board.height;
  }
  static drawRect(color, x, y, width, height) {
    Board.ctx.beginPath();
    Board.ctx.rect(x, y, width, height);
    Board.ctx.fillStyle = color;
    Board.ctx.fill();
    Board.ctx.closePath();
  }

  static drawBackground() { // draw grass the positions of these objects never change so this information doesn't need to be stored online
    //first create background
    for (let i = 0; i < Board.height; i++) {

      for (let j = 0; j < Board.width; j++) {

        if ((i * Board.width + j) % 2 == 0) {
          this.color = "#3da103";
        } else {
          this.color = "#259004";
        }
        Board.drawRect(this.color, j * Cell.width, i * Cell.height, Cell.width, Cell.height);

      }
    }
  }
  static renderPlayer(player) { // render the player

    Board.spriteColumn += 1;
    if (Board.spriteColumn === 3) {
      Board.spriteColumn = 0;
    }
    if (!player.isMovingLeft && !player.isMovingRight) {
      Board.spriteRow = 0;
    }
    if (player.isMovingLeft) {
      Board.spriteRow = 1;
    }
    if (player.isMovingRight) {
      Board.spriteRow = 2;
    }

    let position = Board.spriteHandler.spritePositionToImagePosition(Board.spriteRow, Board.spriteColumn);
    //console.log(position)
    Board.ctx.drawImage(
      player.img,
      position.x,
      position.y,
      player.dimensions.w,
      player.dimensions.h,
      player.pos.x,
      player.pos.y,
      player.dimensions.w,
      player.dimensions.h,
    );
    //draw outfit
    Board.ctx.drawImage(
      player.stuff.outfit,
      position.x,
      position.y,
      player.dimensions.w,
      player.dimensions.h,
      player.pos.x,
      player.pos.y,
      player.dimensions.w,
      player.dimensions.h,
    );
    //draw boots
    Board.ctx.drawImage(
      player.stuff.boots,
      position.x,
      position.y,
      player.dimensions.w,
      player.dimensions.h,
      player.pos.x,
      player.pos.y,
      player.dimensions.w,
      player.dimensions.h,
    );
    //draw hat
    Board.ctx.drawImage(
      player.stuff.hat,
      position.x,
      position.y,
      player.dimensions.w,
      player.dimensions.h,
      player.pos.x,
      player.pos.y,
      player.dimensions.w,
      player.dimensions.h,
    );

  }
  static renderImages(objectToDraw) { // draw images based on their rendering identifiers
    if (objectToDraw.identifier == "image") {
      Board.ctx.drawImage(objectToDraw.img, objectToDraw.pos.x, objectToDraw.pos.y, objectToDraw.dimensions.w, objectToDraw.dimensions.h);
    } else if (objectToDraw.identifier == "rectangle") {
      Board.drawRect(objectToDraw.color, objectToDraw.pos.x, objectToDraw.pos.y, Block.dimensions.w, Block.dimensions.h);
    }
  }
  static updateGraphics() { // update graphics w framerate
    //redraw background
    Board.drawBackground();

    //i had intentions of making a render reordering system... such as render blocks on TOP of players when the bottom side of the block is at a greater y position than the player... but we had to make certain cuts </3 so the player will always look like hes standing on top of the blocks when he really shoudl be under them

    for (let i = 0; i < Game.entityMasterList.backgroundCells.length; i++) {
      for (let j = 0; j < Game.entityMasterList.backgroundCells[i].length; j++) {
        if (Game.entityMasterList.backgroundCells[i][j].hasSplash) {
          Board.renderImages(Game.entityMasterList.splash[i][j]);
        }
        Board.renderImages(Game.entityMasterList.powerUps[i][j]);
        if (Game.entityMasterList.backgroundCells[i][j].hasBalloon) {
          Board.renderImages(Game.entityMasterList.balloons[i][j]);
        }
        if (Game.entityMasterList.backgroundCells[i][j].hasStoneBlock) {
          Board.renderImages(Game.entityMasterList.stoneBlocks[i][j]);
        }
        if (Game.entityMasterList.backgroundCells[i][j].hasWoodenBlock) {
          Board.renderImages(Game.entityMasterList.woodenBlocks[i][j]);
        }
        for(let user in Game.entityMasterList.otherPlayers){
          if(Game.entityMasterList.otherPlayers[user].currentCell.row == i && Game.entityMasterList.otherPlayers[user].currentCell.column == j){
            Board.renderPlayer(Game.entityMasterList.otherPlayers[user]);
          }
          //Board.renderPlayer(user)
        }
        if(Game.entityMasterList.player.currentCell.gridLocation.row == i && Game.entityMasterList.player.currentCell.gridLocation.column == j){
          Board.renderPlayer(Game.entityMasterList.player);
        }
        
      }
    }
    // for(let user in Game.entityMasterList.otherPlayers){
    //   if(Game.entityMasterList.otherPlayers[user].currentCell.row == i && Game.entityMasterList.otherPlayers[user].currentCell.column == j){
    //     Board.renderPlayer(Game.entityMasterList.otherPlayers[user]);
    //   }
    //   //Board.renderPlayer(user)
    // }
    // for (let i = 0; i < Game.entityMasterList.otherPlayers.length; i++) {
    //   Board.renderPlayer(Game.entityMasterList.otherPlayers[i]);
    // } // changing array to key-value list 
    // Board.renderPlayer(Game.entityMasterList.player);
  }
  //this function isn't perfect... but is anyone really?
}

export { Board }