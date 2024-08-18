// Fade-in animation for textview1
anime({
    targets: '#textview1',
    opacity: [0, 1],
    duration: 1000,
    easing: 'linear'
});

// Translation animation for textview1
anime({
    targets: '#textview1',
    translateX: [200, 0],
    duration: 1000,
    easing: 'linear'
});

// Translation animation for textview2
anime({
    targets: '#textview2',
    translateX: [-200, 0],
    duration: 1000,
    easing: 'linear'
});

// Função para redirecionar mantendo o parâmetro 'ref'
function redirectWithRef(url) {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const targetUrl = `${url}${ref ? `?ref=${ref}` : ''}`;
    window.location.replace(targetUrl);
}

// Verificar se o usuário está autenticado ao carregar a página
firebase.auth().onAuthStateChanged(function(user) {
    setTimeout(() => {
        if (user) {
            // Se o usuário estiver autenticado, redirecione para a página de sorteios
            window.location.replace('sorteios.html');
        } else {
            // Se o usuário não estiver autenticado, redirecione para a página de login com o parâmetro 'ref'
            redirectWithRef('login.html');
        }
    }, 2000); // Atraso de 2 segundos
});
