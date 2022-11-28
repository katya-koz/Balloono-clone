import {System} from "/firebase/system.js";
import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {
  update,
  ref,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

//inventory page
class Inventory {
  constructor() {
    this.arr = [];
  }
  
  //assigns the left button to be an equip button on initialization
  leftButtonText(leftButton) { 
    leftButton.setAttribute('class', 'leftButton');
    leftButton.innerHTML = 'Equip';
  }
  
  static equipButton(items, leftButton, system) {
    this.characterContainer = document.getElementById('character-container');
    //searches through the inventory list to find the selected item
    for (let i = 0; i < items.length; i++) { 
      this.itemImg = items[i].imgSrc;
      this.itemID = items[i].ID;

      update(ref(system.db, `/users/${system.authApp.user.uid}`),
        {
          [`/equipped/${items[i].ID}`]: items[i], //logs the equipped item in firebase
        })
      //displays the equipped item onto the character
      if (document.getElementById(i).classList.contains('shopCellOnClick')) {
        this.displayClothingItem = document.createElement('img');
        this.displayClothingItem.setAttribute('src', this.itemImg);
        this.displayClothingItem.setAttribute('id', this.itemID);
        this.displayClothingItem.setAttribute('class', 'layer');
        this.characterContainer.appendChild(this.displayClothingItem);
        //checks cell and turns the equip button into an unequip button
        Shop.checkCell(this.characterContainer, this.itemID, leftButton, i);
        break;
      }
    }
  }
  
  static unequipButton(items, leftButton, system) {
    for (let i = 0; i < items.length; i++) {
      //searches for the selected item to unequip
      if (document.getElementById(i).classList.contains('shopCellOnClick')) {
        //removes the item from the firebase equipped log
        remove(ref(system.db, `/users/${system.authApp.user.uid}/equipped`)) 
        //removes the item image from displaying on the character
        this.itemID = items[i].ID;
        this.removeClothingItem = document.getElementById(this.itemID);
        document.getElementById('character-container').removeChild(this.removeClothingItem);
        Shop.checkCell(this.characterContainer, this.itemID, leftButton, i);
        break;
      }
    }
  }
  
  //called whenever you click on an item and there's already an item in the same category equipped
  static disableEquipButton(equipButton) {
    equipButton.setAttribute('class', 'disabledButton');
    equipButton.innerHTML = 'Equip';
  }
}

//superclass for hats, outfits, and boots page
class ClothesCategory {
  //assigns the left button to be a buy button
  leftButtonText(leftButton) {
    leftButton.setAttribute('class', 'leftButton');
    leftButton.innerHTML = 'Buy';
  }
  static buyButton(items, system) {
    for (let i = 0; i < items.length; i++) {
      this.itemPrice = items[i].price;
      //searches through the page list to see the selected item
      //also only runs if the user has enough money to buy the item
      if (document.getElementById(i).classList.contains('shopCellOnClick') && this.itemPrice <= Shop.balance){
        update(ref(system.db, `/users/${system.authApp.user.uid}`),
          {
            [`/coins`]: Shop.balance - this.itemPrice, //updates the user balance
          })
        
        Shop.inventoryPage.arr.push(items[i]); //place item in the inventory page
        
        update(ref(system.db, `/users/${system.authApp.user.uid}`),
          {
            [`/inventory/${items[i].itemID}`]: items[i], //updates item to be in the inventory page
          })
        Shop.balance -= this.itemPrice; //subtract item value from total balance
        items.splice(i, 1); //remove item from the page

        //re-display the page but without the item you bought
        Render.clearGrid();
        Render.displayItems(items);
        Render.displayCurrentBalance();
        break;
      }
    }
  }
}

//subclasses for ClothesCategory ↓↓, items are stored in their own arrays 

class Outfits extends ClothesCategory {
  constructor() {
    super();
    this.arr = [];
  }
}

class Hats extends ClothesCategory {
  constructor() {
    super();
    this.arr = [];
  }
}

class Boots extends ClothesCategory {
  constructor() {
    super();
    this.arr = [];
  }
}

//class used as a template for all clothing items
class Item {
  constructor(name, ID, price, imageSource, itemID, spriteSrc) {
    this.name = name
    this.ID = ID;
    this.itemID = itemID;
    this.price = price;
    this.imgSrc = imageSource;
    this.spriteSrc = spriteSrc;
  }
}

//main class where everything is created
class Shop {
  static balance;
  static currentPage;

  //base price for the items
  static outfitsPrice = 300;
  static bootsPrice = 100;
  static hatsPrice = 100;

  static gridWidth = 4;
  static gridLength = 4;
  static numOfCells = Shop.gridWidth * Shop.gridLength;

  //instantiates all the clothing pages
  static inventoryPage = new Inventory(this.system);
  static outfitsPage = new Outfits(this.system);
  static bootsPage = new Boots(this.system);
  static hatsPage = new Hats(this.system);


  constructor(system) {
    this.system = system;

    //creates all the clothing items
    Shop.outfitsPage.arr = [
      new Item('Cynical Shirt', 'Outfit', Shop.outfitsPrice, '/shop/shopAssets/emoshirtidle.png', "O1", '/assets/stuff/emoshirtsprite.png'),
      new Item('Parisian Shirt', 'Outfit', Shop.outfitsPrice, '/shop/shopAssets/parisianshirtidle.png', "O2", '/assets/stuff/parisianshirtsprite.png'),
      new Item('Hipster Fit', 'Outfit', Shop.outfitsPrice, '/shop/shopAssets/hipsteroutfitidle.png', "O3", '/assets/stuff/hipsteroutfitsprite.png'),
    ]
    Shop.hatsPage.arr = [
      new Item('Beanie', 'Hat', Shop.hatsPrice, '/shop/shopAssets/beanieidle.png', "H1", '/assets/stuff/beaniesprite.png'), 
      new Item('Beret', 'Hat', Shop.hatsPrice, '/shop/shopAssets/beretidle.png', "H2", '/assets/stuff/beretsprite.png' ),
      new Item('Bucket Hat', 'Hat', Shop.hatsPrice, '/shop/shopAssets/buckethatidle.png', "H3", '/assets/stuff/buckethatsprite.png' ),
      new Item('Cowboy Hat', 'Hat', Shop.hatsPrice, '/shop/shopAssets/cowboyhatidle.png', "H4", '/assets/stuff/cowboyhatsprite.png' ),
      new Item('Emo Hair', 'Hat', Shop.hatsPrice, '/shop/shopAssets/emohairidle.png', "H5", '/assets/stuff/emohairsprite.png' ),
      new Item('Fez', 'Hat', Shop.hatsPrice, '/shop/shopAssets/fezhatidle.png', "H6", '/assets/stuff/fezhatsprite.png' ),
      new Item('Yukon Hat', 'Hat', Shop.hatsPrice, '/shop/shopAssets/yukonhatidle.png', "H7", '/assets/stuff/yukonhatsprite.png' ),
    ]
    Shop.bootsPage.arr = [
      new Item('Cowboy Boots', 'Boots', Shop.bootsPrice, '/shop/shopAssets/cowboybootsidle.png', "B1", '/assets/stuff/cowboybootssprite.png'),
      new Item('Demonia Stompers', 'Boots', Shop.bootsPrice, '/shop/shopAssets/demoniasidle.png', "B2", '/assets/stuff/demoniassprite.png'),
      new Item('Converse All Stars', 'Boots', Shop.bootsPrice, '/shop/shopAssets/converseidle.png', "B3", '/assets/stuff/conversesprite.png'),
    ]

    //methods to check a user's inventory, equipped items, and balance upon initialization
    //for scenarios where a user has logged out and logged in again, or reloaded the page
    //saves the user's configurations from their last session to display it for their current session
    this.getInventory();
    this.getEquipped();
    this.getBalance();
    
    setTimeout(() => { // dont be mad ik this is super hacky but its so late and ive already been sitting here for too long trying to figure promises out 
      // silly firebase functions run while the rest of the program runs which leaves a lot of variables undefined when theyre needed. the timeout lets the getSpawn() function work before anythign needing its return value is called

      //creates the shop page
      this.grid = new Grid(Shop.gridWidth, Shop.gridLength);

      this.buttonContainer = document.createElement('div');
      this.buttonContainer.setAttribute('id', 'button-container');
      document.getElementById('grid-container').appendChild(this.buttonContainer);
      this.characterContainer = document.getElementById('character-container');

      this.inventoryNav = document.getElementById('inventory-nav');
      this.outfitsNav = document.getElementById('outfits-nav');
      this.hatsNav = document.getElementById('hats-nav');
      this.bootsNav = document.getElementById('boots-nav');

      //nav buttons
      this.inventoryNav.addEventListener('click', () => this.navOnClick(this.inventoryNav));
      this.outfitsNav.addEventListener('click', () => this.navOnClick(this.outfitsNav));
      this.hatsNav.addEventListener('click', () => this.navOnClick(this.hatsNav));
      this.bootsNav.addEventListener('click', () => this.navOnClick(this.bootsNav));

      this.prevElement;

      //renders the user's current balance and the character image
      Render.currentBalance();
      Render.characterTemplate();

      //back and equip/buy button
      this.bindBackButton();
      this.bindLeftButton();

      //displays the inventory page upon initalization
      this.navOnClick(this.inventoryNav);
    }, 500);
  }

  //checks the user's equipped items in the database and equips them upon initialization
  getEquipped() {
    get(ref(this.system.db, `users/${this.system.authApp.user.uid}/equipped/`)).then((snapshot) => {
      for (let item in snapshot.val()) {
        get(ref(this.system.db, `users/${this.system.authApp.user.uid}/equipped/${item}`)).then((snapshot) => {
          this.displayClothingItem = document.createElement('img');
          this.displayClothingItem.setAttribute('src', snapshot.val().imgSrc);
          this.displayClothingItem.setAttribute('id', snapshot.val().ID);
          this.displayClothingItem.setAttribute('class', 'layer');
          document.getElementById('character-container').appendChild(this.displayClothingItem);
        });
      }
    });
  }

  //checks the user's inventory in the database and displays it
  getInventory() {
    get(ref(this.system.db, `users/${this.system.authApp.user.uid}/inventory/`)).then((snapshot) => {
      for (let item in snapshot.val()) {
        get(ref(this.system.db, `users/${this.system.authApp.user.uid}/inventory/${item}`)).then((snapshot) => {
          Shop.inventoryPage.arr.push(snapshot.val());
          //remove item from pages
          if (snapshot.val().ID == "Hat") {
            this.arr = Shop.hatsPage.arr;
          } else if (snapshot.val().ID == "Boots") {
            this.arr = Shop.bootsPage.arr;
          } else if (snapshot.val().ID == "Outfit") {
            this.arr = Shop.outfitsPage.arr;
          }
          for (let i = 0; i < this.arr.length; i++) {
            if (snapshot.val().itemID == this.arr[i].itemID) {
              this.arr.splice(i, 1);
            }
          }
        });
      }
    });
  }

  //checks the user's balance in the database and displays it
  getBalance() {
    get(ref(this.system.db, `users/${this.system.authApp.user.uid}/coins`)).then((snapshot) => {
      Shop.balance = snapshot.val();
    });
  }

  navOnClick(navElement) {
    //makes it so that there is only one nav clicked at a time
    if (navElement != this.prevElement) {
      navElement.setAttribute('class', 'navOnClick');
      if (this.prevElement != undefined) {
        this.prevElement.setAttribute('class', 'navigation');
      }
      this.prevElement = navElement;
    }
    //display page based on which nav bar user clicked
    if (navElement === this.inventoryNav) {
      Shop.currentPage = Shop.inventoryPage;
    }
    else if (navElement === this.outfitsNav) {
      Shop.currentPage = Shop.outfitsPage;
    }
    else if (navElement === this.hatsNav) {
      Shop.currentPage = Shop.hatsPage;
    }
    else if (navElement === this.bootsNav) {
      Shop.currentPage = Shop.bootsPage;
    }
    //render the page
    Render.clearGrid();
    Render.displayItems(Shop.currentPage.arr);
    Shop.currentPage.leftButtonText(this.leftButton);
  }

  //runs checkCell everytime the user clicks on an item
  static inventoryCellOnClick(i) {
    this.characterContainer = document.getElementById('character-container');
    this.leftButton = document.getElementById('left-button');
    Shop.checkCell(this.characterContainer, Shop.currentPage.arr[i].ID, this.leftButton, i);
  }

  //checks the cell to see if item should be equipped, unequipped, or disabled
  static checkCell(characterContainer, itemId, leftButton, i) {
    //if the current cell is equipped and shows up on the cat
    if (characterContainer.querySelector(`#${itemId}`) !== null) {
      //if the item in a certain category is the item on the cat --> button is now an unequip button
      if (document.getElementById(`${itemId}`).src === document.getElementById(i).firstElementChild.src) {
        leftButton.setAttribute('class', 'leftButton');
        leftButton.innerHTML = 'Unequip';
      }
      //if the selected item in a certain category is not the item on the cat --> disable the equip button
      //this is to prevent having more than one instance of boots/outfits/hats equipped on the cat
      else {
        Inventory.disableEquipButton(leftButton);
      }
    }
    //if the item isn't equipped on the cat --> button is now an equip button
    else {
      leftButton.setAttribute('class', 'leftButton');
      leftButton.innerHTML = 'Equip';
    }
  }
  
  //creation of the equip/buy button
  bindLeftButton() {
    this.leftButton = document.createElement('button');
    this.leftButton.setAttribute('class', 'leftButton');
    this.leftButton.setAttribute('id', 'left-button');
    this.buttonContainer.appendChild(this.leftButton);

    this.leftButton.addEventListener('click', () => {
      //if the page is outfits/hats/boots, run the buyButton function to buy the item
      if (Shop.currentPage != Shop.inventoryPage) {
        ClothesCategory.buyButton(Shop.currentPage.arr, this.system);
      }
      //if the user is ont he inventory page
      else {
        //if the button is an equip button
        if (this.leftButton.innerHTML === 'Equip' && this.leftButton.classList.contains('leftButton') === true) {
          Inventory.equipButton(Shop.currentPage.arr, this.leftButton, this.system);
        }
        //if the button is an unequip button
        else if (this.leftButton.innerHTML === 'Unequip') {
          Inventory.unequipButton(Shop.currentPage.arr, this.leftButton, this.system);
        }
      }
    });
  }

  //button to return to the lobby
  bindBackButton() {
    this.backButton = document.createElement('button');
    this.backButton.setAttribute('class', 'button');
    this.backButton.innerHTML = 'Go Back';
    this.characterContainer.appendChild(this.backButton);

    this.backButton.addEventListener('click', () => {
      window.location.assign('/lobby.html')
    });
  }
}

//renders the shop
class Render {
  //clears the grid of items from the previously accessed page
  static clearGrid() {
    let i = 0;
    while (document.getElementById(i).innerText !== '') {
      document.getElementById(i).innerText = '';
      // document.getElementById(i).setAttribute('class', 'shopCell');
      i += 1;
    }
    Cell.clearCellDisplay();
  }
  
  static displayItems(items) {
    //displays the pages items
    for (let i = 0; i < items.length; i++) {
      //display item name and price
      document.getElementById(i).innerText = items[i].name + ': ' + items[i].price + ' shallots';

      //display item image
      this.displayImage = document.createElement('img');
      this.displayImage.setAttribute('src', items[i].imgSrc);
      this.displayImage.setAttribute('class', 'image-display');
      document.getElementById(i).appendChild(this.displayImage);
    }
    Cell.disabledCell();
  }

  //displays the user's current balance
  static displayCurrentBalance() {
    this.balance.innerText = 'Current Balance: ' + Shop.balance + ' shallots';
  }

  //creates the current balance h2 element
  static currentBalance() {
    this.characterContainer = document.getElementById('character-container');
    this.balance = document.createElement('h2')
    Render.displayCurrentBalance();
    this.characterContainer.appendChild(this.balance);
  }

  //container where the cat will be ♥
  static characterTemplate() {
    this.displayCharacter = document.createElement('img');
    this.displayCharacter.setAttribute('src', '/shop/shopAssets/idle_1.png')
    this.displayCharacter.setAttribute('class', 'character-display')
    document.getElementById('character-container').appendChild(this.displayCharacter)
  }
}

class Cell {
  static prevElement;
  constructor(n) {
    this.n = n;
    this.element = document.getElementById(n);
    this.element.addEventListener('click', () => this.displayCell(this.element));
  }
  
  //if the cell doesn't have an item in it, assign its class to disabledCell
  //disables the cell from any action from the user
  static disabledCell() {
    for (let i = 0; i < Shop.numOfCells; i++) {
      this.cell = document.getElementById(i);
      if (this.cell.childNodes.length === 0) {
        this.cell.setAttribute('class', 'disabledCell')
      }
      else {
        this.cell.setAttribute('class', 'shopCell')
      }
    }
  }
  
  //runs everytime a cell is clicked on
  //assigns a class for the clicked on cell
  displayCell(currentCell) {
    if (currentCell != Cell.prevElement && currentCell.classList.contains('disabledCell') === false) {
      currentCell.setAttribute('class', 'shopCellOnClick');
      if (Cell.prevElement != undefined) {
        Cell.prevElement.setAttribute('class', 'shopCell');
      }
      Cell.prevElement = currentCell;
    }
    //runs if the selected cell is in the inventory page
    if (Shop.currentPage === Shop.inventoryPage) {
      Shop.inventoryCellOnClick(this.n);
    }
  }
  
  //resets all the cell classes to shopCell (unclicked on)
  static clearCellDisplay() {
    if (Cell.prevElement != undefined) {
      Cell.prevElement.setAttribute('class', 'shopCell');
      Cell.prevElement = undefined;
    }
  }
}

//creates the shop grid
class Grid {
  constructor(rowCount, cellCount) {
    this.grid = document.getElementById('grid-container');
    this.rowCount = rowCount;
    this.cellCount = cellCount;
    this.makeGrid();
  }
  makeGrid() {
    for (let i = 0; i < this.rowCount; i++) {
      this.row = document.createElement('div');
      this.row.setAttribute('class', 'shopRow');
      this.grid.appendChild(this.row);
      for (let j = 0; j < this.cellCount; j++) {
        this.cell = document.createElement('div');
        this.cell.setAttribute('class', 'shopCell');
        this.cell.setAttribute('id', i * this.cellCount + j);
        this.row.appendChild(this.cell);
        this.categoryCell = new Cell(i * this.cellCount + j);
      }
    }
  }
}

//instaniates the shop
class ShopPage {
  constructor() {
    this.system = new System();
    onAuthStateChanged(this.system.authApp.auth, (user) => {
      if (user) {
        //create shop once user has logged in
        this.createShop();
      }
    })
  }
  createShop() {
    this.shop = new Shop(this.system);
  }
}

new ShopPage();