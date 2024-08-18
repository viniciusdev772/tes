document.addEventListener('DOMContentLoaded', function() {
    // Fetching stats data from Firebase
    firebase.database().ref('/stats').on('value', function(snapshot) {
        document.getElementById('total-users').innerText = snapshot.val().totalUsers.toLocaleString('pt-BR');
        document.getElementById('total-draws').innerText = snapshot.val().totalDraws.toLocaleString('pt-BR');
        document.getElementById('total-prizes').innerText = 'R$' + snapshot.val().totalPrizes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
});


function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            const isNewUser = result.additionalUserInfo.isNewUser;

            if (isNewUser) {
                const urlParams = new URLSearchParams(window.location.search);
                let ref = urlParams.get('ref');
                ref = ref ? ref : '';
                
                const image = user.photoURL;
                const email = user.email;
                const uid = user.uid;
                const name = user.displayName;
                const newUser = { image, email, uid, ref, name };
                
                firebase.database().ref(`new_users/${user.uid}`).set(newUser)
                    .then(() => {
                        window.location.replace(`sorteios.html?ref=${ref}`);
                    })
                    .catch(error => {
                        console.error('Erro ao criar novo usuário:', error);
                        logout();
                    });
            } else {
                window.location.replace('sorteios.html');
            }
        })
        .catch((error) => {
            alert('Erro ao fazer login com o Google: ' + error.message);
        });
}

function scrollToLogin() {
    document.querySelector('.login-container').scrollIntoView({ behavior: 'smooth' });
}

