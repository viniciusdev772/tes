const firebaseConfig = {
            apiKey: "AIzaSyCC3XFod1rA7NooeE-iqT8zJ6H0qLvtHYM",
            authDomain: "project-8f47d.firebaseapp.com",
            databaseURL: "https://project-8f47d-default-rtdb.firebaseio.com",
            projectId: "project-8f47d",
            storageBucket: "project-8f47d.appspot.com",
            messagingSenderId: "600765843161",
            appId: "1:600765843161:web:c94c4cdddee04fa39360c8",
            measurementId: "G-CTTK5V3SDS"
        };

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();
