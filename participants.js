// Mostrar spinner de carregamento
document.getElementById('spinner').style.display = 'block';

// Função para obter o parâmetro de URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Função para exibir a lista de participantes
function displayParticipants() {
    const sweepstakeKey = getQueryParam('sweepstakeKey');
    const participantsList = document.getElementById('participants-list');

    // Buscar a chave do ganhador do localStorage
    const winnerKey = localStorage.getItem('winner_key');

    // Buscar os participantes no Realtime Database
    db.ref(`participants/${sweepstakeKey}`).once('value')
        .then((snapshot) => {
            let participantsHTML = ''; // Variável para armazenar o HTML dos participantes
            let index = 1; // Inicializa o índice dos participantes

            snapshot.forEach((childSnapshot) => {
                const participant = childSnapshot.val();
                const isWinner = (childSnapshot.key === winnerKey); // Usar a chave do snapshot
                const winnerClass = isWinner ? 'winner' : ''; // Adicionar a classe 'winner' se for o ganhador
                const participantContainerId = `participant-${childSnapshot.key}`; // Gerar um ID único para cada contêiner de participante

                participantsHTML += `
                    <div id="${participantContainerId}" class="participant-card ${winnerClass}">
                        <div class="participant-number">${index}</div>
                        <img src="${participant.image}" alt="${participant.name}">
                        <div>${participant.name}</div>
                    </div>
                `;
                index++; // Incrementa o índice para o próximo participante
            });

            // Atualizar o conteúdo da lista de participantes com o HTML construído
            participantsList.innerHTML = participantsHTML;

            // Adicionar event listeners para cada contêiner de participante
            snapshot.forEach((childSnapshot) => {
                const participantContainer = document.getElementById(`participant-${childSnapshot.key}`);
                participantContainer.addEventListener('click', () => {
                    console.log(childSnapshot.val().uid);
                });
            });

            // Esconder spinner de carregamento
            document.getElementById('spinner').style.display = 'none';
        })
        .catch((error) => {
            console.error("Erro ao buscar participantes: ", error);
        });
}

function goBack() {
    window.history.back();
}

// Chamar a função para exibir os participantes ao carregar a página
displayParticipants();
