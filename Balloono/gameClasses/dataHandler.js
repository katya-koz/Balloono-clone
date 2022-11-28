import {
  update,
  ref,
  onValue,
  remove,
  onChildAdded,
  onChildRemoved,
  get,
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";
import { Game } from "/game.js"
import { Balloon, OtherPlayer, WoodenBlock, RangePowerUp, BalloonPowerUp, SpeedPowerUp } from "/gameClasses/entities.js";

class HandleData { // cute little class to handle the data updates/ changes..
  constructor(system, lobbyId) {
    this.system = system;
    this.lobbyId = lobbyId;
    this.dead = [];
  }
  mapGenerated(){
    update(ref(this.system.db, `rooms/${this.lobbyId}/game/`),
      {
        [`mapStatus`]: true,
      })

  }
  getCoins(player) {
    get(ref(this.system.db, `users/${player.uid}/coins`)).then((snapshot) => {
      player.coins = snapshot.val();
      //retrieves user's coins from db
    }
    )


  }
  exportWoodenBlocks() {
    onChildAdded(ref(this.system.db, `/rooms/${this.lobbyId}/game/woodenBlocks`), (child) => {
      Game.entityMasterList.woodenBlocks[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column] = new WoodenBlock(child.val().pos.x, child.val().pos.y, child.val().onCell, child.val().id);

      Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hasWoodenBlock = true;
      //once the wooden blocks are all rendered, they are exported to the db where a different function will render them to each player's screen

      // i was not able to figure out how to fix a bug i have.. each player generates their own instance of the map and exports it to the firebase db... this causes, in a game of four players, for the map to be initialized and meshed together four times.... this isnt a huge issue since it doesnt affect gameplay, but i imagine it affects the initializing performance
    })
  }
  getStuffForOtherPlayer(uid) {
    console.log(uid);
    get(ref(this.system.db, `users/${uid}/equipped/Hat`)).then((snapshot) => {
      if (snapshot.exists()) {
        Game.entityMasterList.otherPlayers[uid].stuff.hat.src = snapshot.val().spriteSrc;
      }

    }).then(get(ref(this.system.db, `users/${uid}/equipped/Outfit`)).then((snapshot) => {

      if (snapshot.exists()) {
        Game.entityMasterList.otherPlayers[uid].stuff.outfit.src = snapshot.val().spriteSrc;
      }
    })).then(get(ref(this.system.db, `users/${uid}/equipped/Boots`)).then((snapshot) => {

      if (snapshot.exists()) {
        Game.entityMasterList.otherPlayers[uid].stuff.boots.src = snapshot.val().spriteSrc;
      }
    }));
  }
  getPlayers() {
    //when a player is added to the game db, every other player in the game is a child 'added', so this just adds them to their local rendering storage... 
    // this function could use some reworking (sorry mr ma i am just really tired), as sometimes you may find that when you play with multiple people, you will need to reload the page to render all of them in (and all of their customization)
    onChildAdded(ref(this.system.db, `rooms/${this.lobbyId}/game/players`), (snapshot) => {
      if (snapshot.key === this.system.authApp.user.uid) {
      } else {
        Game.userCount += 1;
        Game.entityMasterList.otherPlayers[snapshot.key] = (new OtherPlayer(snapshot.val().pos.x, snapshot.val().pos.y, snapshot.key));
        //console.log(Game.entityMasterList.otherPlayers);
        // if (Game.entityMasterList.otherPlayers.length > 0) {
        this.detectPlayerMovements(snapshot.key);
        // }


        //get player's things
        this.getStuffForOtherPlayer(snapshot.key);
      }
    })


  }
  detectPlayerMovements(uid) {
    // this listener is attached to every 'otherPlayer' and tracks changes in their positions in the DB, and updates each player's local storage with their new positions/directions
    onValue(ref(this.system.db, `/rooms/${this.lobbyId}/game/players/${uid}`), (child) => {
      Game.entityMasterList.otherPlayers[uid].pos.x = child.val().pos.x;
      Game.entityMasterList.otherPlayers[uid].pos.y = child.val().pos.y;
      Game.entityMasterList.otherPlayers[uid].isMovingLeft = child.val().isMovingLeft;
      Game.entityMasterList.otherPlayers[uid].isMovingRight = child.val().isMovingRight;
      Game.entityMasterList.otherPlayers[uid].currentCell.row = child.val().onCell.row;
      Game.entityMasterList.otherPlayers[uid].currentCell.column = child.val().onCell.column;
    }
    )

  }
  winListener(userCount) {
    // SO basically this function takes in the userCount (found by a different function) and is a listener which fires up every time any change is made to any player... this could be their position or their death status... i wasnt too sure on how to check JUST their death status with the way my data tree was structured, so that def affects performance... anyway, when a player dies it adds a number to the 'deadCounter' and further compares it to the users. if the all players but one are dead, the game will finish 
    onValue(ref(this.system.db, `/rooms/${this.lobbyId}/game/deadUsers`), (snapshot) => {
      if (snapshot.val() >= userCount) {
        if (Game.entityMasterList.player.isDead == false) {
          Game.entityMasterList.player.finalPlace = Game.userCount - 1;
          update(ref(this.system.db, `rooms/${this.lobbyId}/game/`),
            {
              [`/podium/${Game.userCount - 1}`]: `${this.system.authApp.user.uid}`,
            })
        }
        //console.log("game end");
        this.endGame();
      }

    })

  }
  resetGame() {// fix dis function.. shoiuldnt be onValue - use 'get'
    get(ref(this.system.db, `rooms/${this.lobbyId}/users`)).then((snapshot) => {
      for (let user in snapshot.val()) {
        update(ref(this.system.db, `/rooms/${this.lobbyId}/users/${user}`), // set all player's statuses to not ready to allow for another round
          {
            [`/ready`]: false,
          }).then(update(ref(this.system.db, `/rooms/${this.lobbyId}`),
            {
              [`/gameStarted`]: false,
            })
          ).then(
            remove(ref(this.system.db, `/rooms/${this.lobbyId}/game`)) // delete game from storage to allow for another round
              .then(() => {
                console.log("data removed successfully");
              })
              .catch((error) => {
                console.log("data not removed, sorry :(" + error)
              })
          )
      }
    })
      .then(() => {
        window.location.assign(`/pregamelobby.html?rm=${this.lobbyId}`)
      }); // take players back to game lobby

  }
  rewardPlayer() {
    // add coins to player based on their place... their 'finalPlace' property is a coins multiplier based on how many players died before them
    if (Game.entityMasterList.player.finalPlace > 0) { // only update if player is not the first to die.. would be redundant to update otherwise
      const COINS = 50;
      let finalCoins = (COINS * Game.entityMasterList.player.finalPlace) + Game.entityMasterList.player.coins
      update(ref(this.system.db, `users/${this.system.authApp.user.uid}`),
        {
          [`/coins`]: finalCoins,
        }).then(
          console.log("coins added xoxo")
        )
    }

  }

  endGame() {
    this.rewardPlayer();
    this.resetGame();


  }
  detectServerChanges() {
    onChildRemoved(ref(this.system.db, `/rooms/${this.lobbyId}/game/balloons`),
      (child) => {
        // when a balloon pops, its removed from the server and then from everyone else's local storage
        Game.entityMasterList.balloons[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column] = [];
        Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hshasBalloon = false;
      })
    onChildRemoved(ref(this.system.db, `/rooms/${this.lobbyId}/game/woodenBlocks`),
      (child) => {
        // when blocks break, theyre removed from the server and then from everyone else's local storage
        Game.entityMasterList.woodenBlocks[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column] = [];

        Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hasWoodenBlock = false;
      })
    onChildRemoved(ref(this.system.db, `/rooms/${this.lobbyId}/game/powerUps`),
      (child) => {
        // when a powerup is picked up... theyre removed from the ser- blah blah blah yk the drill

        Game.entityMasterList.powerUps[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column] = [];
        Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hasPowerUp = false;

      })

    onChildAdded(ref(this.system.db, `/rooms/${this.lobbyId}/game/powerUps`), (child) => { // if a powerup is added to the server, add it to every other players locol storage

      //with powerups, u need to check their type before adding it to the storage... so this is what im doing below
      if (!Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hasPowerUp) {
        if (child.val().type == "balloonPowerUp") {
          this.powerUp = new BalloonPowerUp(Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column], Game.entityMasterList.player);

        } else if (child.val().type == "rangePowerUp") {
          this.powerUp = new RangePowerUp(Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column], Game.entityMasterList.player);

        } else if (child.val().type == "speedPowerUp") {
          this.powerUp = new SpeedPowerUp(Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column], Game.entityMasterList.player);
        }
        Game.entityMasterList.backgroundCells[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column].hasPowerUp = true;
        Game.entityMasterList.powerUps[child.val().onCell.gridLocation.row][child.val().onCell.gridLocation.column] = this.powerUp;
      }

    })

    onChildAdded(ref(this.system.db, `/rooms/${this.lobbyId}/game/balloons`),
      // if a balloon is added to the server, then add that balloon to every other player's local storage
      (child) => {
        child = child.val();
        if (!Game.entityMasterList.backgroundCells[child.onCell.gridLocation.row][child.onCell.gridLocation.column].hasBalloon) {// only add a balloon if the cell doesnt already have a balloon (prevents game from placing two balloons on the same cell for the player who initailly placed the balloon.. since when u place a balloon, the data gets sent to the server, which would triggger this listtener)
          Game.entityMasterList.balloons[child.onCell.gridLocation.row][child.onCell.gridLocation.column] = new Balloon(Game.entityMasterList.backgroundCells[child.onCell.gridLocation.row][child.onCell.gridLocation.column], Game.entityMasterList.player.stats.range, { uid: "xxx" }); // gave a 'fake' player  so that a balloon palced by a different player will not affect the stats of anyone else.. this is becuz when a balloon pops, it cross references the uid of the player that placed it to change their 'balloonsPlaced' stat (this stat is to limit the amount of balloons u can place at once)
          Game.entityMasterList.backgroundCells[child.onCell.gridLocation.row][child.onCell.gridLocation.column].hasBalloon = true;
        }

      })
  }

  getStuff() {
    //this function does a similar thing to the one on top. it rummages through the player's equipped, and sets the player's properties to that of their equipped items to be rendered
    get(ref(this.system.db, `users/${this.system.authApp.user.uid}/equipped/Hat`)).then((snapshot) => {
      if (snapshot.exists()) {
        Game.entityMasterList.player.stuff.hat.src = snapshot.val().spriteSrc;
      }

    }).then(get(ref(this.system.db, `users/${this.system.authApp.user.uid}/equipped/Outfit`)).then((snapshot) => {

      if (snapshot.exists()) {
        Game.entityMasterList.player.stuff.outfit.src = snapshot.val().spriteSrc;
      }
    })).then(get(ref(this.system.db, `users/${this.system.authApp.user.uid}/equipped/Boots`)).then((snapshot) => {

      if (snapshot.exists()) {
        Game.entityMasterList.player.stuff.boots.src = snapshot.val().spriteSrc;
      }
    }));

  }
  async playerDead() { //is called when a player is dead
    update(ref(this.system.db, `rooms/${this.lobbyId}/game/players/${this.system.authApp.user.uid}`),
      {
        [`isDead`]: true,
      })
      .then(
        await get(ref(this.system.db, `rooms/${this.lobbyId}/game/deadUsers`)).then((snapshot) => {
          if (snapshot.exists()) {
            this.deadCount = snapshot.val();
          } else {
            this.deadCount = 0;

          }
          Game.entityMasterList.player.finalPlace = this.deadCount; // should set local status of player's final place before any change is made to db (which would trigger winListener and gameEnd before player's local status is established)
        }),

        update(ref(this.system.db, `/rooms/${this.lobbyId}/game`),
          {
            [`/deadUsers`]: this.deadCount + 1,
          })).then(
            update(ref(this.system.db, `rooms/${this.lobbyId}/game/`),
              {
                [`/podium/${this.deadCount}`]: `${this.system.authApp.user.uid}`,
              })
          )
    //i had plans of turning them into ghost sprites after death :(

  }
  resetPlayerDirection() {
    //other player's directions are upodated in the server every time they move... but when they move, it changes direction and essentially locks that direction in place on the server. os this fucntion is necessary to reset all of their directions on KeyUp (controls.js)
    update(ref(this.system.db, `rooms/${this.lobbyId}/game/players/${this.system.authApp.user.uid}`),
      {
        [`/isMovingLeft`]: false,
        [`/isMovingRight`]: false,

      });
  }

  updatePlayerCoords(player, xChange, yChange) { // mr ma u should know what this does because this is from your example
    update(ref(this.system.db, `rooms/${this.lobbyId}/game/players/${this.system.authApp.user.uid}`),
      {
        [`/pos/x`]: player.pos.x += xChange,
        [`/pos/y`]: player.pos.y += yChange,
        [`/isMovingLeft`]: player.isMovingLeft,
        [`/isMovingRight`]: player.isMovingRight,
        [`onCell/row`]: player.currentCell.gridLocation.row,
        [`onCell/column`]: player.currentCell.gridLocation.column,

      });
  }
  updatePos(player) { // so is this one
    onValue(ref(this.system.db, `rooms/${this.lobbyId}/game/players/${this.system.authApp.user.uid}/pos/`), (snapshot) => {
      if (snapshot.val()) {
        const x = snapshot.val().x;
        const y = snapshot.val().y
        player.x = x;
        player.x = y;
      } else {
        //If database has not be initiated
        update(ref(this.system.db, `/rooms/${this.lobbyId}/game/players/${this.system.authApp.user.uid}`), {
          [`pos/x`]: player.pos.x,
          [`pos/y`]: player.pos.y,
          [`onCell/row`]: player.currentCell.gridLocation.row,
          [`onCell/column`]: player.currentCell.gridLocation.column,
          ['isDead']: false,
        })
      }
    })
  }

  addEntity(entity) {
    //add an entity to the db
    update(ref(this.system.db, `/rooms/${this.lobbyId}/game/${entity.name}`),
      {
        [`/${entity.id}`]: entity,
      });
  }


  removeEntity(entity) {
    //remove entity from db 
    remove(ref(this.system.db, `/rooms/${this.lobbyId}/game/${entity.name}/${entity.id}`))
      .then(() => {
        console.log("data removed successfully");
      })
      .catch((error) => {
        console.log("data not removed, sowwy :(" + error)
      });

  }
}

export { HandleData }