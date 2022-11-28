import { System } from './firebase/system.js'
import { update, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js'
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js"
import { nanoid } from 'https://cdnjs.cloudflare.com/ajax/libs/nanoid/3.3.4/nanoid.min.js'

// i mostly borrowed this fucntion from ur example but i did leave some comments where i made changes

class Lobby {
  constructor() {
    this.system = new System();

    this.system.authApp.bindSignOut('sign-out');

    //Bind the create room button
    this.bindCreateRm();

    this.bindShopBtn();

    //First make sure a user has logged in before we render the list
    onAuthStateChanged(this.system.authApp.auth, (user) => {
      if (user) {
        this.listRms();
      }
    })
  }
  
  bindShopBtn(){
    const shopBtn = document.getElementById('shop');

    shopBtn.addEventListener('click', ()=>{
      window.location.assign(`shop/shop.html`) // take player to shop
    } );
  
  }

  bindCreateRm() {
    const createRmBtn = document.getElementById('lobby-create-room-btn');
    createRmBtn.addEventListener('click', () => {
      const id = nanoid(6); //We create a random ID with a length of 6

      //We're inputting to our database
      update(ref(this.system.db, '/'), {
       
        [`rooms/${id}/users/${this.system.authApp.user.uid}`]: {
          ready: false,
        },
       
      })
        .then(() => {
          window.location.assign(`/pregamelobby.html?rm=${id}`);
        })
        .catch((error) => {
          window.alert(error);
        })
    });
  }

  listRms() {
    const list = document.getElementById('lobby-list-container');

    onValue(
      ref(this.system.db, `/rooms`),
      (snapshot) => {
        //snapshot should return ALL the rooms the user has been in
        for (let room in snapshot.val()) {
          //Create the list item element
          const listItem = document.createElement('li');

          //Add the class name to that list item
          listItem.classList.add('lobby-list-item');

          //Add the room code to that list item so we can see it
          listItem.innerText = room;

          //Add a click event that redirects us to that game room
          listItem.addEventListener('click', () => {
            update(ref(this.system.db, '/'), { // i probably dont even need this update
              [`rooms/${room}/users/${this.system.authApp.user.uid}`]: {
                ready: false,
              },
              [`users/${this.system.authApp.user.uid}/rooms/${room}`]: true
            })
            .then(() => {
              window.location.assign(`/pregamelobby.html?rm=${room}`); // takes user to game lobby
            })
            .catch((error) => {
              window.alert(error);
            })
          })

          list.appendChild(listItem);
        }
      },
      { onlyOnce: true }
    )
  }
}

new Lobby();