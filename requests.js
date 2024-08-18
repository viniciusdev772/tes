// Mostrar spinner de carregamento
document.getElementById('spinner').style.display = 'block';

document.addEventListener('DOMContentLoaded', function() {
  
function updateOrientationText() {
    const orientationText = document.getElementById('orientation-text');
    const randomIndex = Math.floor(Math.random() * 5); // Gera um número aleatório entre 0 e 4

    switch (randomIndex) {
        case 0:
            orientationText.textContent = 'O prazo para o saldo ser creditado na conta é de até 24 horas.';
            break;
        case 1:
            orientationText.textContent = 'Certifique-se de que todas as informações estão corretas ao solicitar o saque. Não nos responsabilizamos por dados incorretos.';
            break;
        case 2:
            orientationText.textContent = 'Não há limite de saque diário. Você pode sacar quanto quiser no mesmo dia.';
            break;
        case 3:
            orientationText.textContent = 'Os saques podem ser feitos a qualquer momento, sem restrições de horários.';
            break;
        case 4:
            orientationText.textContent = 'Lembre-se de verificar as taxas aplicáveis ao realizar um saque.';
            break;
        default:
            orientationText.textContent = 'Verifique as condições de saque para garantir uma transação segura.';
            break;
    }
}

// Chama a função ao carregar a página
window.onload = updateOrientationText;

});

// Função para obter o parâmetro de URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Função para exibir a lista de participantes
function displayParticipants() {
    const uid = getQueryParam('uid');
    const participantsList = document.getElementById('requests-list');

    if (!participantsList) {
        console.error('Elemento #requests-list não encontrado.');
        return;
    }

    // Buscar os participantes no Realtime Database
    db.ref(`users/${uid}/withdrawals`).on('value', (snapshot) => {
        if (snapshot.exists()) {
            let participantsHTML = ''; // Variável para armazenar o HTML dos participantes

            // Ordenar os snapshots pela data (mais recentes primeiro)
            const participantsArray = [];
            snapshot.forEach((childSnapshot) => {
                participantsArray.push(childSnapshot.val());
            });
            participantsArray.sort((a, b) => new Date(b.date) - new Date(a.date));

            participantsArray.forEach((participant) => {
                // Adicione logs para depuração
                console.log(participant);

                // Formatando a data e hora para o fuso horário do Brasil
                const dateOptions = {
                    timeZone: 'America/Sao_Paulo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                const formattedDate = new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date(participant.date));

                // Formatando o valor no formato "R$0,00"
                const formattedValue = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(participant.value);

                // Definindo a classe de cor do status
                let statusClass = '';
                if (participant.status === 'Processando') {
                    statusClass = 'status-processing';
                } else if (participant.status === 'Pago') {
                    statusClass = 'status-paid';
                } else if (participant.status === 'Estornado' || participant.status === 'Cancelado') {
                    statusClass = 'status-refunded';
                }

                // Crie o HTML para cada participante
                participantsHTML += `
                    <div class="participant-card">
                        <strong>Data:</strong> ${formattedDate} <br>
                        <strong>Chave PIX:</strong> ${participant.pix} <br>
                        <strong>Status:</strong> <span class="${statusClass}">${participant.status}</span> <br>
                        <strong>Valor:</strong> ${formattedValue} <br>
                    </div>
                    
                `;
            });

            // Atualizar o conteúdo da lista de participantes com o HTML construído
            participantsList.innerHTML = participantsHTML;

            // Esconder spinner de carregamento
            document.getElementById('spinner').style.display = 'none';
        } else {
            document.getElementById('spinner').style.display = 'none';
            showToast('Não encontrado!');
        }
    }, (error) => {
        console.error("Erro ao buscar: ", error);
    });
}

function goBack() {
    window.history.back();
}

displayParticipants();
