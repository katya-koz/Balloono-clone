import { System } from './firebase/system.js'
import { update, ref, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js'
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js"

class PreGameLobby {
  constructor() {
    this.lobbyId = new URLSearchParams(window.location.search).get('rm');
    this.system = new System();

    this.bindExit();

    //Bind the create room button
    this.bindReadyBtn();
    this.checkIfReady();


    //First make sure a user has logged in before we render the list
    onAuthStateChanged(this.system.authApp.auth, (user) => {
      if (user) {
        this.listPlayers();
      }
    })
  }


  checkIfReady() { // cycle through users in lobby checking if theyre ready... if all of them are ready, then start game
    onValue(ref(this.system.db, `/rooms/${this.lobbyId}/users`), (snapshot) => {
      let playersReady = true;
      for (let user in snapshot.val()) {
        onValue(
          ref(this.system.db, `/rooms/${this.lobbyId}/users/${user}/ready`),
          (snapshot) => {
            let status = snapshot.val();
            if (status === false) {
              playersReady = false;
            }
          })
      }
      if (playersReady === true) {
        update(ref(this.system.db, `/rooms/${this.lobbyId}`),
          {
            [`gameStarted`]: true,
          }).then(window.location.assign(`/game.html?rm=${this.lobbyId}`));

      } else {
        update(ref(this.system.db, `/rooms/${this.lobbyId}`),
          {
            [`gameStarted`]: false,
          })
      }
    })

  }
 
  bindReadyBtn() {
    const readyBtn = document.getElementById('ready-btn');
    // onclick, player ready
    let insertValue;
    readyBtn.addEventListener("click", () => {
      onValue(
        ref(this.system.db, `/rooms/${this.lobbyId}/users/${this.system.authApp.user.uid}/ready`),
        (snapshot) => {
          if (snapshot.val() === true) {
            insertValue = false;

          } else {
            insertValue = true;
          }
        })
      update(ref(this.system.db, `rooms/${this.lobbyId}/users`), // updates player ready statuses
        {
          [`/${this.system.authApp.user.uid}`]: {
            ready: insertValue,
          },
        });
    });
  }

  bindExit() {
    const exitBtn = document.getElementById('exit');
    exitBtn.addEventListener("click", () => {
      remove(ref(this.system.db, `rooms/${this.lobbyId}/users/${this.system.authApp.user.uid}`),
      ).then(window.location.assign(`/lobby.html`));
    });
  }
  clearUi(list) {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  }
  listPlayers() {
    const list = document.getElementById('user-list-container');

    onValue(
      ref(this.system.db, `/rooms/${this.lobbyId}/users`),
      (snapshot) => {
        this.clearUi(list); // clear ui before rendering user elements
        //snapshot should return ALL the rooms the user has been in
        for (let user in snapshot.val()) {
          onValue(
            ref(this.system.db, `/users/${user}`),
            (snapshot) => {

              //Create the list item element
              const listItem = document.createElement('li');

              // //Add the class name to that list item
              listItem.classList.add('user-list-item');

              // //Add the room code to that list item so we can see it
              listItem.innerText = snapshot.val().username;

              list.appendChild(listItem);
            })
        }
      })
  }
}

new PreGameLobby(); // always important to pregame