function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;

    // Remove todas as classes de tipo previamente adicionadas
    toast.className = "toast";

    // Adiciona a classe correta baseada no conteúdo da mensagem
    if (message.includes("insuficiente") || message.includes("inválido") || message.includes("Erro")) {
        toast.classList.add("error");
    } else if (message.includes("sucesso")) {
        toast.classList.add("success");
    } else {
        toast.classList.add("info");
    }

    // Adiciona a classe show para exibir o toast
    toast.classList.add("show");

    // Remove a classe show após 3 segundos
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}




function formatCurrency(value) {
    return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showProgressDialog(message) {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    const progressDialog = document.createElement('div');
    progressDialog.id = 'progressDialog';
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    const progressCircle = document.createElement('div');
    progressCircle.className = 'progressCircle';
    progressDialog.appendChild(messageElement);
    progressDialog.appendChild(progressCircle);
    overlay.appendChild(progressDialog);
    document.body.appendChild(overlay);
}

function hideProgressDialog() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.remove();
    }
}

function logout() {
    firebase.auth().signOut();
}

if (window.location.hostname === 'bloi308.pages.dev') {
            window.location.href = 'https://bloi308.com' + window.location.pathname + window.location.search;
        }
        