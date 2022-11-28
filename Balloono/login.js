import { System } from './firebase/system.js'
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js'

class Login {
  constructor() {
    this.system = new System();

    this.bindLogin();
  }

  bindLogin() {
    const login = document.getElementById('login');
    login.addEventListener('submit', (e) => this.handleLogin(e)); 
  }

  handleLogin(e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if(email !== '' & password !== '') {
      signInWithEmailAndPassword(this.system.authApp.auth, email, password)
      .then(() => {
        window.location.assign('/lobby.html');
      })
      .catch(error => {
        window.alert(error);
      })
    }
  }
}

new Login();