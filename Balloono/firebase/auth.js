import {getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js"

class Auth {
  #protectedRoutes = ["/game.html", "/lobby.html"];
  constructor() {
    this.auth = getAuth(); //Connects to firebase auth
    this.user = null;

    onAuthStateChanged(this.auth, (user) => {
      //If somebody has logged in
      if(user) {
        this.user = user;
      } else {
        //If no one has logged in
        this.user = null;
        if (this.#protectedRoutes.includes(window.location.pathname)) {
          //Move users to the home screen if they're not logged in
          window.location.assign('/');
        }
      }
    });
  }

  bindSignOut(id) {
    const btn = document.getElementById(id);
    btn.addEventListener('click', () => {
      signOut(this.auth) //Signs out the user
      .then(() => window.location.assign('/')) //Bring the user back to home page if it works
      .catch(error => {
        window.alert(error); //Alert for error if error
      })
    })
  }
}

export {Auth};