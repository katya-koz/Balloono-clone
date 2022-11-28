import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js'
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js'
import { Auth } from './auth.js'
import { firebaseConfig } from './config.js'


class System {
  constructor() {
    this.app = initializeApp(firebaseConfig); //Just the app
    this.db = getDatabase(this.app); //Connects to OUR database
    this.authApp = new Auth();
  }
}

export { System };