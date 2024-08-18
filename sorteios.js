let path = "sweepstakes0";
let currentListenerRef = null;
let currentDepositKey = null;
let selectedAmount = 0;
let balance = 0;
let nameUser = null;
let photoUser = null;
let send = null;

let infoLoaded = false;
document.addEventListener("DOMContentLoaded", function () {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      if (!infoLoaded) {
        displayUserInfo(user);
        registrarVisita();
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");
        if (tab) {
          handleLinkClick(tab);
        } else {
          handleLinkClick("sweepstakes0");
        }
        infoLoaded = true;
      }
    } else {
      window.location.replace('index.html'); //ALTERADO
    }
  });

  server();

  document.querySelector(".badge").style.display = "none";
  const notificationsRef = firebase.database().ref("notifications");
  notificationsRef.on("value", (snapshot) => {
    const notifications = snapshot.val();
    updateNotificationCount(notifications); // Função para atualizar o contador de notificações
  });

  document.addEventListener("click", function (event) {
    const popup = document.getElementById("notificationsPopup");
    const icon = document.getElementById("notificationIcon");

    if (popup && !popup.contains(event.target) && event.target !== icon) {
      closeNotificationsPopup();
    }
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    hideProgressDialog();
  }

  if (document.visibilityState === "visible" && currentDepositKey) {
    const commandRef = firebase
      .database()
      .ref(`deposits/${currentDepositKey}/command`);

    commandRef
      .once("value")
      .then((snapshot) => {
        const currentCommand = snapshot.val();
        if (currentCommand === "PAGAR") {
          console.log("Comando PAGAR encontrado, aguardando 3 segundos...");
          showProgressDialog("Processando...");
          setTimeout(() => {
            commandRef
              .set("CONSULTAR_COBRANÇA")
              .then(() => {
                console.log("Comando CONSULTAR_COBRANÇA enviado");
                hideProgressDialog();
              })
              .catch((error) => {
                console.error(
                  "Erro ao enviar comando CONSULTAR_COBRANÇA: ",
                  error
                );
              });
          }, 3000); // Aguardar 3 segundos (3000 milissegundos)
        } else {
          console.log("Comando PAGAR não encontrado");
        }
      })
      .catch((error) => {
        console.error("Erro ao verificar comando: ", error);
      });
  }
});

let serverListenerRef = null;
function server() {
  if (serverListenerRef) {
    serverListenerRef.off();
  }
  let serverTimestamp;
  serverListenerRef = db.ref("settings/server");
  serverListenerRef.on("value", (snapshot) => {
    if (snapshot.exists()) {
      serverTimestamp = snapshot.val();
      let currentTime = Date.now();
      let differenceInSeconds = (currentTime - serverTimestamp) / 1000;
      let differenceInMinutes = Math.floor(differenceInSeconds / 60);

      if (differenceInMinutes > 1) {
        window.location.replace("manutencao.html");
      }
    } else {
      console.error("O timestamp do servidor não está disponível.");
    }
  });
}

function viewParticipants(sweepstakeKey, winnerKey) {
  console.log(sweepstakeKey);
  localStorage.setItem("winner_key", winnerKey);
  window.location.href = `participants.html?sweepstakeKey=${sweepstakeKey}`;
}

function viewWithdrawals() {
  toggleDrawer();
  const uid = firebase.auth().currentUser.uid;
  window.location.href = `requests.html?uid=${uid}`;
}

function handleParticipation(sweepstakeKey, ticketPrice, path) {
  if (path === "sweepstakes3") {
    const code = prompt(
      "Por favor, insira o código para participar do sorteio."
    );

    if (code === null) {
      console.log("Participação cancelada!");
      return;
    }

    if (code.trim() === "") {
      showToast("Código inválido!");
      return;
    }

    // Adiciona o código ao postData
    const key = firebase.database().ref().push().key;
    const uid = firebase.auth().currentUser.uid;
    const id = sweepstakeKey;
    const postData = {
      key,
      uid,
      name: nameUser,
      img: photoUser,
      id,
      path,
      code,
    };

    showProgressDialog("Carregando...");
    const participateButton = document.querySelector(
      `button[onclick="handleParticipation('${sweepstakeKey}', ${ticketPrice}, '${path}')"]`
    );
    participateButton.disabled = true;

    firebase.database().ref(`participate_sweepstakes/${key}`).set(postData);
    listenForCallback(key, participateButton);
  } else {
    // Caso não seja o sorteio que precisa de código
    showProgressDialog("Carregando...");
    const participateButton = document.querySelector(
      `button[onclick="handleParticipation('${sweepstakeKey}', ${ticketPrice}, '${path}')"]`
    );
    participateButton.disabled = true;

    const key = firebase.database().ref().push().key;
    const uid = firebase.auth().currentUser.uid;
    const id = sweepstakeKey;

    // Atualize os nomes das propriedades para 'name' e 'img'
    const postData = {
      key,
      uid,
      name: nameUser,
      img: photoUser,
      id,
      path,
    };

    // Envie os dados atualizados para o Firebase
    firebase
      .database()
      .ref(`participate_sweepstakes/${key}`)
      .set(postData)
      .then(() => {
        // Sucesso na gravação
        listenForCallback(key, participateButton);
      })
      .catch((error) => {
        // Tratar erros
        console.error("Erro ao gravar dados: ", error);
      });
  }
}

function listenForCallback(key, participateButton) {
  const callbackRef = firebase.database().ref(`callbacks/${key}`);

  callbackRef.on("value", (snapshot) => {
    const callbackData = snapshot.val();

    if (
      callbackData &&
      callbackData.type === "sweepstakes" &&
      callbackData.text
    ) {
      hideProgressDialog();
      showToast(callbackData.text);
      participateButton.disabled = false;
      callbackRef.remove();
    }
    if (
      callbackData &&
      callbackData.type === "create-draw" &&
      callbackData.text
    ) {
      hideProgressDialog();
      showToast(callbackData.text);
      callbackRef.remove();
    }
  });
}

function showIndicate() {
  toggleDrawer();
  const user = firebase.auth().currentUser;
  if (user) {
    const indicateLink = `https://bloi308.com/?ref=${user.uid}`;
    const shareData = {
      title: "Indique e ganhe",
      text: "Esse é o maior site de sorteios gratuitos do Brasil!\nAcesse agora o Bloi308!\nUse meu link de indicação e ganhe R$1,00 para iniciar.\n",
      url: indicateLink,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          console.log("Compartilhamento bem-sucedido");
        })
        .catch((error) => {
          console.error("Erro ao compartilhar:", error.message);
        });
    } else {
      // Mensagem de fallback para navegadores que não suportam navigator.share
      alert(
        "O compartilhamento não é suportado pelo seu navegador. Copie o link: " +
          indicateLink
      );
    }
  } else {
    alert("Você precisa estar logado para compartilhar seu link de indicação.");
  }
}

function registrarVisita() {
  const dataAtual = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
    .replace(/-/g, "");
  const ultimaVisita = localStorage.getItem("ultimaVisita");

  if (ultimaVisita !== dataAtual) {
    const ref = db.ref(`reports/${dataAtual}/visitations`);

    ref.transaction(
      (currentValue) => {
        return (currentValue || 0) + 1;
      },
      (error) => {
        if (error) {
          console.error("Erro ao registrar a visita:", error);
        } else {
          localStorage.setItem("ultimaVisita", dataAtual);
        }
      }
    );
  } else {
  }
}

function displayUserInfo(user) {
  const profile = document.querySelector(".profile");
  if (profile) {
    const elementsMap = {
      img: user.photoURL,
      "p.name": user.displayName,
      "p.email": user.email,
      "p.uid": `${user.uid}`,
    };

    nameUser = user.displayName;
    photoUser = user.photoURL;

    for (const [selector, value] of Object.entries(elementsMap)) {
      const element = profile.querySelector(selector);
      if (element) {
        if (selector === "img") {
          element.src = value;
          // Adicionar evento de clique na imagem
          element.addEventListener("click", () => {
            const newPhotoURL = prompt(
              "Insira o URL da nova imagem de perfil:"
            );
            if (newPhotoURL) {
              user
                .updateProfile({ photoURL: newPhotoURL })
                .then(() => {
                  element.src = newPhotoURL;
                  // Atualizar a imagem no Firebase Database
                  return firebase
                    .database()
                    .ref(`users/${user.uid}/profile`)
                    .update({ image: newPhotoURL });
                })
                .then(() => {
                  console.log(
                    "Foto de perfil atualizada com sucesso no Auth e no Database!"
                  );
                })
                .catch((error) => {
                  console.error("Erro ao atualizar a foto de perfil:", error);
                });
            }
          });
        } else if (selector === "p.name") {
          element.textContent = value;
          // Adicionar evento de clique no nome
          element.addEventListener("click", () => {
            const newName = prompt("Insira o novo nome:");
            if (newName) {
              user
                .updateProfile({ displayName: newName })
                .then(() => {
                  element.textContent = newName;
                  // Atualizar o nome no Firebase Database
                  return firebase
                    .database()
                    .ref(`users/${user.uid}/profile`)
                    .update({ name: newName });
                })
                .then(() => {
                  console.log(
                    "Nome atualizado com sucesso no Auth e no Database!"
                  );
                })
                .catch((error) => {
                  console.error("Erro ao atualizar o nome:", error);
                });
            }
          });
        } else {
          element.textContent = value;
        }
      }
    }

    // Referências aos elementos de saldo e pontos
    const balanceElement = profile.querySelector("p.balance");
    const pointsElement = profile.querySelector("p.points");
    const navbarBalanceElement = document.querySelector(
      ".navbar-title .balancee"
    );

    // Buscar saldo do usuário no banco de dados
    const userRef = firebase.database().ref(`users/${user.uid}/points`);
    userRef.on(
      "value",
      (snapshot) => {
        balance = snapshot.val();
        const formattedBalance = `${formatCurrency(balance || 0)}`;
        if (balanceElement) {
          balanceElement.textContent = formattedBalance;
        }
        if (navbarBalanceElement) {
          navbarBalanceElement.textContent = formattedBalance;
        }
      },
      (error) => {
        console.error("Erro ao buscar saldo do usuário:", error);
      }
    );

    // Buscar pontos de referência do usuário no banco de dados
    const referredPointsRef = firebase
      .database()
      .ref(`users/${user.uid}/referred_points`);
    referredPointsRef.on(
      "value",
      (snapshot) => {
        const referredPoints = snapshot.val();
        if (referredPoints !== null && pointsElement) {
          pointsElement.textContent = `Pontos de indicação: ${referredPoints}`;
        } else {
          if (pointsElement) {
            pointsElement.textContent = `Pontos de indicação: 0`;
          }
        }
      },
      (error) => {
        console.error("Erro ao buscar pontos referidos do usuário:", error);
      }
    );
  }
}

function toggleDrawer() {
  var drawer = document.getElementById("drawer");
  if (drawer.style.width === "250px") {
    drawer.style.width = "0";
    if (options.style.display === "block") {
      options.style.display = "none";
      arrow.innerHTML = "▼";
    }
  } else {
    drawer.style.width = "250px";
  }
}

const options = document.getElementById("sweepstake-options");
const arrow = document.getElementById("sweepstake-arrow");
function toggleSweepstakes() {
  if (options.style.display === "block") {
    options.style.display = "none";
    arrow.innerHTML = "▼";
  } else {
    options.style.display = "block";
    arrow.innerHTML = "▲";
  }
}

function handleLinkClick(path) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", path);
  window.history.pushState({}, "", url);
  loadSweepstakes(path);
  updateOrientationText(path); // Atualizar o texto de orientação

  const links = document.querySelectorAll(".tab-layout a");
  links.forEach((link) => {
    const linkPath = link.getAttribute("onclick").match(/'([^']+)'/)[1];
    if (linkPath === path) {
      link.style.backgroundColor = "#fff"; // Cor de fundo diferente para o link selecionado
      link.style.color = "#3949AB";
      link.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      }); // Centraliza o link na viewport
    } else {
      link.style.backgroundColor = "#3949AB"; // Cor de fundo padrão para os outros links
      link.style.color = "#fff";
    }
  });
}

function updateOrientationText(path) {
  const orientationText = document.getElementById("orientation-text");
  switch (path) {
    case "sweepstakes0":
      orientationText.textContent =
        "Participe dos sorteios gratuitos e aguarde completar a quantidade de participantes para que o sorteio ocorra.";
      break;
    case "sweepstakes":
      orientationText.textContent =
        "Participe dos sorteios pagos para ter a chance de ganhar prêmios maiores.";
      break;
    case "sweepstakes4":
      orientationText.innerHTML =
        'Indique amigos e ganhe pontos para participar dos sorteios por indicação. <a href="#" onclick="showIndicate()">Compartilhar</a>';
      break;

    case "sweepstakes5":
      orientationText.innerHTML =
        'Aqui voce encontra os sorteios criado pelos usuarios. <a href="#" onclick="createSweepstake()">Clique aqui</a> e crie um novo sorteio.';
      break;

    case "sweepstakes6":
      orientationText.innerHTML =
        "De centavo em centavo, seu prêmio é garantido";
      break;

    case "sweepstakes7":
      orientationText.innerHTML = "Prêmios extremamente grandes";
      break;

    case "sweepstakes3":
      orientationText.innerHTML =
        'Tem um grupo de amigos, familiares, colegas de escola ou trabalho? Entre em contato conosco e crie um sorteio exclusivo para o seu grupo! Personalize os prêmios e tenha uma experiência única. <a href="javascript:void(0);" onclick="openChat()">Fale com a gente</a> para saber mais detalhes.';
      break;

    case "sweepstakes2":
      orientationText.textContent =
        "Veja os sorteios que já foram concluídos e os vencedores.";
      break;
    default:
      orientationText.textContent =
        "Selecione um tipo de sorteio para mais informações.";
      break;
  }
}

function loadSweepstakes(path) {
  const db = firebase.database();
  const sweepstakesList = document.getElementById("sweepstakes-list");
  const user = firebase.auth().currentUser;

  if (user) {
    // Remover listener anterior, se existir
    if (currentListenerRef) {
      currentListenerRef.off();
    }
    // Mostrar spinner de carregamento
    showProgressDialog("Carregando...");
    // Configurar novo listener e armazenar a referência
    currentListenerRef = db.ref(path);
    currentListenerRef.on(
      "value",
      (snapshot) => {
        // Esconder spinner de carregamento
        hideProgressDialog();
        sweepstakesList.innerHTML = ""; // Limpar a lista antes de adicionar os novos sorteios
        let sweepstakesArray = [];

        snapshot.forEach((childSnapshot) => {
          const sweepstake = childSnapshot.val();

          // Verificar se existe a chave old_key e winner_key antes de usar
          let oldKey = null;
          let winnerKey = null;
          if (path === "sweepstakes2" && sweepstake.hasOwnProperty("old_key")) {
            oldKey = sweepstake.old_key;
          }

          if (sweepstake.hasOwnProperty("winner_key")) {
            winnerKey = sweepstake.winner_key;
          }

          const prize = formatCurrency(sweepstake.award);
          const participants = sweepstake.current + "/" + sweepstake.total;
          const ticketPrice = parseFloat(sweepstake.ticket);
          const date = formatDate(sweepstake.timestamp);
          const sweepstakeKey = childSnapshot.key; // Obter o ID do sorteio
          const winner = sweepstake.winner
            ? `Ganhador: <span class="winner-blue">${sweepstake.winner}</span>`
            : "Ainda sem ganhador";

          // Verificar se o usuário já está participando
          const isParticipating =
            sweepstake.list_of_participants &&
            sweepstake.list_of_participants.hasOwnProperty(user.uid);

          const participateButton =
            isParticipating && (ticketPrice === 0 || path === "sweepstakes4")
              ? "" // Não mostrar o botão se o usuário já estiver participando e o preço for 0 ou o path for 'sweepstakes4'
              : `<button class="btn-participate" onclick="handleParticipation('${sweepstakeKey}', ${ticketPrice}, '${path}')">Participar</button>`;

          // Definir a classe CSS com base na participação e se o sorteio é pago ou gratuito
          const itemClass = isParticipating ? "participating" : "";

          // Definir valor do ingresso com base no path
          let ticketValueText =
            ticketPrice === 0
              ? 'Ingresso: <span class="ticket-red">Gratuito</span>'
              : `Ingresso: <span class="ticket-red">${formatCurrency(
                  sweepstake.ticket
                )}</span>`;
          if (path === "sweepstakes3") {
            ticketValueText = "";
          }
          if (path === "sweepstakes4") {
            ticketValueText = `Ingresso: <span class="ticket-red">${ticketPrice} ponto${
              ticketPrice > 1 ? "s" : ""
            }</span>`;
          }

          if (path === "sweepstakes2") {
            ticketValueText = winner;
          }

          // Adicionar o criador se existir
          const creatorText = sweepstake.description
            ? `<p class="creator-text">${sweepstake.description}</p>`
            : "";

          const sweepstakeHash = hashCode(sweepstakeKey);

          const sweepstakeItem = `
    <div class="sweepstake-item ${itemClass} ${
            path === "sweepstakes2" ? "sweepstake-green" : ""
          }">
        <div class="sweepstake-date">Concurso: ${sweepstakeHash}</div>
        <div class="sweepstake-others">
            ${creatorText}
            <h3>Prêmio: <span class="prize-green">${prize}</span></h3>
            <p class="participants-container">Participantes: ${participants}</p>
            <p>${ticketValueText}</p>
            ${path !== "sweepstakes2" ? participateButton : ""}
            ${
              path !== "sweepstakes2"
                ? `<button class="btn-view" onclick="viewParticipants('${
                    oldKey || sweepstakeKey
                  }', '${winnerKey}')">Visualizar</button>`
                : ""
            }
        </div>
    </div>`;

          sweepstakesArray.push(sweepstakeItem);
        });

        // Inverter a ordem dos sorteios se o path for 'sweepstakes2'
        if (path === "sweepstakes2") {
          sweepstakesArray = sweepstakesArray.reverse();
        }

        // Adicionar os sorteios ao DOM
        sweepstakesArray.forEach((item) => {
          sweepstakesList.innerHTML += item;
        });
      },
      (error) => {
        console.error("Erro ao carregar os sorteios:", error.message);
        hideProgressDialog();
        sweepstakesList.innerHTML = ""; // Limpar a lista
        let sweepstakesArray = [];
        currentListenerRef.off();
        showToast("Erro ao carregar os sorteios. Tente novamente mais tarde.");
      }
    );
  } else {
    window.location.replace("login.html");
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 1000000; // Garantir que o hash seja positivo e até 6 dígitos
}

function handleRequest() {
  toggleDrawer();
  const user = firebase.auth().currentUser;

  if (user) {
    if (balance !== null && balance >= 5) {
      openModal2();
    } else {
      showToast("Saldo insuficiente para resgate. O saldo mínimo é R$ 5,00.");
    }
  } else {
    showToast("Usuário não autenticado.");
  }
}

function extract() {
  toggleDrawer();
  const user = firebase.auth().currentUser;
  const uid = user.uid;
  window.location.href = `/extract.html?uid=${uid}`;
}

function irParaWhatsapp() {
  toggleDrawer();
  var message = encodeURIComponent("");
  const urlWhatsapp = `https://wa.me/5545988312858?text=${message}`;
  window.location.href = urlWhatsapp;
}

function handleDeposit() {
  toggleDrawer();
  openModal();
  const uid = firebase.auth().currentUser.uid;
  const depositRef = firebase.database().ref(`deposits/${uid}`);

  depositRef
    .once("value")
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Já existe um depósito, monitora o status
        snapshot.forEach((childSnapshot) => {
          monitorDepositStatus(uid);
        });
      } else {
        // Não existe depósito, cria um novo
        openModal();
      }
    })
    .catch((error) => {
      console.error("Error checking deposit: ", error);
    });
}

function viewDraw(sweepstakes) {
  toggleDrawer();
  handleLinkClick(sweepstakes);
}

function breve() {
  toggleDrawer();
  showToast("Em breve!");
}

function openModal() {
  document.getElementById("deposit-modal").style.display = "block";
}

function closeModal() {
  document.getElementById("deposit-modal").style.display = "none";
}

function selectAmount(amount) {
  // Remove a classe 'selected' de todos os botões
  const buttons = document.querySelectorAll(".amount-button");
  buttons.forEach((button) => button.classList.remove("selected"));

  // Adiciona a classe 'selected' ao botão clicado
  event.target.classList.add("selected");
  selectedAmount = amount;
}

function recharge() {
  if (selectedAmount === 0) {
    alert("Por favor, selecione um valor para recarregar.");
    return;
  }

  const user = firebase.auth().currentUser;
  if (user) {
    const uid = user.uid;
    const depositData = {
      uid: uid,
      value: selectedAmount,
      command: "GERAR_COBRANÇA",
    };

    firebase
      .database()
      .ref(`deposits/${uid}`)
      .update(depositData)
      .then(() => {
        showToast("Recarregar solicitação enviada com sucesso!");
        closeModal();
        monitorDepositStatus(uid);
      })
      .catch((error) => {
        console.error("Erro ao enviar a solicitação de recarga:", error);
        alert(
          "Erro ao enviar a solicitação de recarga. Por favor, tente novamente."
        );
      });
  } else {
    alert("Usuário não autenticado.");
  }
}

function openModal2() {
  document.getElementById("request-modal").style.display = "block";
}

function closeModal2() {
  document.getElementById("request-modal").style.display = "none";
}

function selectAmount(amount) {
  // Remove a classe 'selected' de todos os botões
  const buttons = document.querySelectorAll(".amount-button");
  buttons.forEach((button) => button.classList.remove("selected"));

  // Adiciona a classe 'selected' ao botão clicado
  event.target.classList.add("selected");
  selectedAmount = amount;
}

function requests() {
  if (selectedAmount === 0) {
    alert("Por favor, selecione um valor para sacar.");
    return;
  }

  if (balance !== null && balance >= selectedAmount) {
    const user = firebase.auth().currentUser;
    if (user) {
      const uid = user.uid;
      const pixType = document.getElementById("pix-type").value;
      const pixKey = document.getElementById("pix-key").value;

      // Verificação básica se a chave PIX foi fornecida
      if (!pixKey) {
        alert("Por favor, insira sua chave PIX.");
        return;
      }

      // Validação da chave PIX
      if (!validatePixKey(pixType, pixKey)) {
        return;
      }

      const requestData = {
        uid: uid,
        name: nameUser,
        value: selectedAmount,
        pixType: pixType,
        pixKey: pixKey,
      };

      db.ref(`withdrawal_requests`)
        .push(requestData)
        .then(() => {
          showToast("Solicitação enviada com sucesso!");
          closeModal2();
          window.location.href = `requests.html?uid=${uid}`;
        })
        .catch((error) => {
          console.error("Erro ao enviar a solicitação de resgate:", error);
          showToast(
            "Erro ao enviar a solicitação de resgate. Por favor, tente novamente."
          );
          closeModal2();
        });
    } else {
      alert("Usuário não autenticado.");
      closeModal2();
    }
  } else {
    showToast("Saldo insuficiente para resgatar esse valor");
  }
}

document.getElementById("pix-key").addEventListener("input", function (e) {
  const pixType = document.getElementById("pix-type").value;
  if (pixType === "CPF" || pixType === "CNPJ" || pixType === "PHONE") {
    e.target.value = e.target.value.replace(/\D/g, ""); // Remove todos os caracteres que não são números
  }
});

function updatePixInput() {
  const pixType = document.getElementById("pix-type").value;
  const pixKeyInput = document.getElementById("pix-key");

  if (pixType === "CPF") {
    pixKeyInput.type = "text";
    pixKeyInput.placeholder = "Digite seu CPF";
    pixKeyInput.pattern = "\\d{11}"; // Padrão para CPF
  } else if (pixType === "CNPJ") {
    pixKeyInput.type = "text";
    pixKeyInput.placeholder = "Digite seu CNPJ";
    pixKeyInput.pattern = "\\d{14}"; // Padrão para CNPJ
  } else if (pixType === "PHONE") {
    pixKeyInput.type = "tel";
    pixKeyInput.placeholder = "Digite seu número de celular";
    pixKeyInput.pattern = "\\d{11}"; // Padrão para celular
  } else if (pixType === "EMAIL") {
    pixKeyInput.type = "email";
    pixKeyInput.placeholder = "Digite seu e-mail";
  } else if (pixType === "EVP") {
    pixKeyInput.type = "text";
    pixKeyInput.placeholder = "Digite sua chave aleatória";
  }
}

function validatePixKey(pixType, pixKey) {
  let regex;
  let errorMessage;

  switch (pixType) {
    case "CPF":
      regex = /^\d{11}$/; // CPF sem formatação, apenas números
      errorMessage = "Por favor, insira um CPF válido com 11 dígitos.";
      break;
    case "CNPJ":
      regex = /^\d{14}$/; // CNPJ sem formatação, apenas números
      errorMessage = "Por favor, insira um CNPJ válido com 14 dígitos.";
      break;
    case "PHONE":
      regex = /^\d{11}$/; // Celular sem formatação, apenas números
      errorMessage =
        "Por favor, insira um número de celular válido com 11 dígitos.";
      break;
    case "EMAIL":
      regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errorMessage = "Por favor, insira um e-mail válido.";
      break;
    case "EVP":
      regex = /^.{32}$/; // Exemplo: uma chave aleatória com 32 caracteres
      errorMessage =
        "Por favor, insira uma chave aleatória válida com 32 caracteres.";
      break;
    default:
      return false;
  }

  if (!regex.test(pixKey)) {
    alert(errorMessage);
    return false;
  }

  return true;
}

function monitorDepositStatus(uid) {
  const depositRef = firebase.database().ref(`deposits/${uid}`);

  // Mostrar o diálogo e o indicador de carregamento
  showDialog();

  depositRef.on("value", (snapshot) => {
    const deposit = snapshot.val();
    if (snapshot.exists()) {
      if (deposit && deposit.codepix) {
        currentDepositKey = uid;
        // Esconde o indicador de carregamento e mostra o código Pix
        hideLoadingIndicator();
        showCodePix(deposit.codepix);
      }
    } else {
      hideDialog();
    }
  });
}

function showDialog() {
  const dialogOverlay = document.getElementById("payment-dialog");
  if (dialogOverlay) {
    dialogOverlay.style.display = "flex";
    showLoadingIndicator();
  }
}

function hideDialog() {
  const dialogOverlay = document.getElementById("payment-dialog");
  if (dialogOverlay) {
    dialogOverlay.style.display = "none";
  }
}

function showLoadingIndicator() {
  const loadingElement = document.getElementById("loading-indicator");
  if (loadingElement) {
    loadingElement.style.display = "block";
  }
}

function hideLoadingIndicator() {
  const loadingElement = document.getElementById("loading-indicator");
  if (loadingElement) {
    loadingElement.style.display = "none";
  }
}
function generateQRCode(codePix) {
  // Limpa o QR code existente (se houver)
  document.getElementById("qrcode").innerHTML = "";

  // Gera o QR code
  new QRCode(document.getElementById("qrcode"), {
    text: codePix,
    width: 200,
    height: 200,
  });
}
function showCodePix(codepix) {
  const codePixElement = document.getElementById("codepix");
  const copyButton = document.getElementById("copy-button");
  if (codePixElement && copyButton) {
    codePixElement.innerText = codepix;
    generateQRCode(codepix);
    codePixElement.style.display = "block";
    copyButton.style.display = "block";
  }
}

function copyCodePix() {
  const codePixElement = document.getElementById("codepix");
  if (codePixElement) {
    const textArea = document.createElement("textarea");
    textArea.value = codePixElement.innerText;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      navigator.clipboard
        .writeText(textArea.value)
        .then(() => {
          showToast("Código Pix copiado!");
        })
        .catch(() => {
          document.execCommand("copy");
          showToast("Código Pix copiado!");
        });
    } catch (err) {
      document.execCommand("copy");
      showToast("Código Pix copiado!");
    }

    document.body.removeChild(textArea);
  }
}

function cancelPix() {
  const uid = firebase.auth().currentUser.uid;
  const commandRef = firebase.database().ref(`deposits/${uid}/command`);
  commandRef
    .set("DELETAR_COBRANÇA")
    .then(() => {
      console.log("Comando DELETAR_COBRANÇA enviado");
      currentDepositKey = null;
    })
    .catch((error) => {
      console.error("Erro ao enviar comando DELETAR_COBRANÇA: ", error);
    });
}

function updateNotificationCount(notifications) {
  let countNotifications = 0;

  // Verificar se há notificações
  if (notifications) {
    let localStorageNotifications = JSON.parse(
      localStorage.getItem("list_notifications")
    );

    // Verificar se localStorageNotifications é um array válido
    if (!Array.isArray(localStorageNotifications)) {
      localStorageNotifications = [];
    }

    localStorageNotifications.forEach((item) => {
      if (!notifications.hasOwnProperty(item.key)) {
        notifications[item.key] = item;
      }
    });

    const user = firebase.auth().currentUser;
    const uid = user ? user.uid : null; // Obter o UID do usuário atual

    const ids_notifications = localStorage.getItem("ids_notifications");
    const ids_notifications_array = ids_notifications
      ? ids_notifications.split(",")
      : [];

    Object.values(notifications).forEach((notification) => {
      if (
        uid &&
        (!ids_notifications ||
          !ids_notifications_array.includes(notification.key.toString())) &&
        (notification.to === uid || notification.to === "all") &&
        !isNotificationRead(notification.key)
      ) {
        countNotifications += 1;
      }
    });

    // Atualizar o contador e exibir o badge
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.textContent = countNotifications;
      badge.style.display = countNotifications > 0 ? "inline" : "none";
    } else {
      console.warn("Elemento badge não encontrado.");
    }

    // Atualizar localStorage
    localStorage.setItem("list_notifications", JSON.stringify(notifications));
  } else {
    console.log("Nenhuma notificação encontrada");
  }
}

function isNotificationRead(notificationKey) {
  const readNotifications =
    JSON.parse(localStorage.getItem("read_notifications")) || [];
  return readNotifications.includes(notificationKey);
}

function toggleNotificationsPopup() {
  const popup = document.getElementById("notificationsPopup");
  // Verificar se o popup está visível
  if (popup.style.display === "block") {
    closeNotificationsPopup();
  } else {
    openNotificationsPopup();
  }
}

function openNotificationsPopup() {
  const popup = document.getElementById("notificationsPopup");
  if (popup) {
    popup.style.display = "block";

    // Limpar a lista de notificações existente
    const notificationsList = document.getElementById("notificationsList");
    notificationsList.innerHTML = "";

    // Carregar e exibir as notificações
    const notifications =
      JSON.parse(localStorage.getItem("list_notifications")) || {};

    // Transformar objeto de notificações em array
    const notificationsArray = Object.values(notifications);
    notificationsArray.reverse();
    notificationsArray.forEach((notification) => {
      // Verificar se a notificação é destinada ao usuário logado
      const user = firebase.auth().currentUser;
      const uid = user ? user.uid : null;
      if (uid && (notification.to === uid || notification.to === "all")) {
        const listItem = document.createElement("li");
        listItem.textContent = notification.title;
        listItem.setAttribute("data-key", notification.key);

        // Adicionar um ponto vermelho para notificações não lidas
        if (!isNotificationRead(notification.key)) {
          const dot = document.createElement("span");
          dot.className = "notification-dot";
          listItem.appendChild(dot);
        }
        listItem.onclick = function () {
          showNotificationDetails(notification);
          markNotificationAsRead(notification.key);

          // Remover o ponto vermelho ao marcar como lida
          const dot = listItem.querySelector(".notification-dot");
          if (dot) {
            dot.remove();
          }
        };

        notificationsList.appendChild(listItem);
      }
    });
  } else {
    console.warn("Elemento popup não encontrado.");
  }
}

function closeNotificationsPopup() {
  const popup = document.getElementById("notificationsPopup");

  // Verifica se o elemento popup foi encontrado no DOM
  if (popup) {
    popup.style.display = "none";
  } else {
    console.warn("Elemento popup não encontrado.");
  }
}

function showNotificationDetails(notification) {
  const modal = document.getElementById("customNotificationModal");
  const titleElement = document.getElementById("customNotificationTitle");
  const textElement = document.getElementById("customNotificationText");
  const closeButton = document.querySelector(".custom-close-button");

  // Definir o conteúdo do diálogo
  titleElement.textContent = notification.title;
  const processedText = notification.text.replace(/<\/?p>/g, "");
  textElement.innerHTML = processedText;

  // Exibir o diálogo
  modal.style.display = "block";

  // Fechar o diálogo ao clicar no botão de fechar
  closeButton.onclick = function () {
    modal.style.display = "none";
  };

  // Fechar o diálogo ao clicar fora do conteúdo
  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

function markNotificationAsRead(notificationKey) {
  const readNotifications =
    JSON.parse(localStorage.getItem("read_notifications")) || [];
  readNotifications.push(notificationKey);
  localStorage.setItem("read_notifications", JSON.stringify(readNotifications));

  // Atualizar contador de notificações não lidas se necessário
  updateNotificationCount();

  // Atualizar badge imediatamente
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    // Obter o número atual de notificações não lidas
    let countNotifications = parseInt(badge.textContent) || 0;
    // Decrementar o contador se a notificação marcada como lida estava não lida
    if (countNotifications > 0) {
      countNotifications--;
    }
    // Atualizar o badge com o novo contador
    badge.textContent = countNotifications;
    badge.style.display = countNotifications > 0 ? "inline" : "none";
  } else {
    console.warn("Elemento badge não encontrado.");
  }

  // Atualizar contador na página principal, se necessário
  if (window.updateNotificationCount) {
    window.updateNotificationCount();
  }
}

let chatsRef = null;
let uidd = null;
let chatMessages = null;
function openChat() {
  toggleDrawer();
  document.getElementById("chat-modal").style.display = "flex";
  document.getElementById("chatContainer").style.display = "flex";

  chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = ""; // Limpar mensagens anteriores

  // Referência ao nó 'chats/uid'
  uidd = firebase.auth().currentUser.uid;
  chatsRef = db.ref(`chats/${uidd}`);

  chatsRef.off("child_added");
  // Carregar mensagens existentes
  chatsRef.on("child_added", (snapshot) => {
    const data = snapshot.val();
    const author = data.author;
    addMessage(data.text, author);
  });

  document.getElementById("sendButton").addEventListener("click", sendMessage);
  document
    .getElementById("chatInput")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });

  document.getElementById("closeButton").addEventListener("click", () => {
    document.getElementById("chatContainer").style.display = "none";
    document.getElementById("chat-modal").style.display = "none";
  });
}

function addMessage(text, author) {
  chatMessages = document.getElementById("chatMessages");
  const messageElement = document.createElement("div");

  if (author === "sistem") {
    messageElement.classList.add("message", "sistem");
  } else {
    messageElement.classList.add("message", author);

    const imgElement = document.createElement("img");
    if (author === "user") {
      imgElement.src = photoUser;
    } else {
      imgElement.src = "logo.png";
    }
    messageElement.appendChild(imgElement);
  }

  const textElement = document.createElement("span");
  textElement.textContent = text;

  messageElement.appendChild(textElement);

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const message = chatInput.value.trim();

  if (message === "") return;

  // Enviar mensagem para o Firebase
  chatsRef.push({
    text: message,
    author: "user",
  });

  db.ref(`chats_pending/${uidd}`).set(uidd);

  chatInput.value = "";
}

function createSweepstake() {
  toggleDrawer();
  document.getElementById("diallog").classList.add("open");
}

document.getElementById("cancelButton").addEventListener("click", function () {
  document.getElementById("diallog").classList.remove("open");
});

document
  .getElementById("prizeValue")
  .addEventListener("input", updateInvestmentInfo);
document
  .getElementById("numParticipants")
  .addEventListener("input", updateInvestmentInfo);

function updateInvestmentInfo() {
  const prizeValue = parseFloat(document.getElementById("prizeValue").value);
  const numParticipants = parseInt(
    document.getElementById("numParticipants").value
  );

  if (
    !isNaN(prizeValue) &&
    prizeValue >= 2 &&
    !isNaN(numParticipants) &&
    numParticipants >= 5
  ) {
    const ticketValue = (prizeValue * 2) / numParticipants;
    document.getElementById("ticketValue").value = ticketValue.toFixed(2);

    const investmentText = `Valor do investimento: R$${prizeValue.toFixed(2)}`;
    const potentialEarningsText = `Você ganhará: R$${(
      prizeValue +
      prizeValue / 4
    ).toFixed(2)}`;

    document.getElementById("investmentText").innerText = investmentText;
    document.getElementById("potentialEarningsText").innerText =
      potentialEarningsText;
  } else {
    document.getElementById("ticketValue").value = "";
    document.getElementById("investmentText").innerText = "";
    document.getElementById("potentialEarningsText").innerText = "";
  }
}

document.getElementById("createButton").addEventListener("click", function () {
  const prizeValue = parseFloat(document.getElementById("prizeValue").value);
  const numParticipants = parseInt(
    document.getElementById("numParticipants").value
  );
  const ticketValue = document.getElementById("ticketValue").value;

  if (!isNaN(prizeValue) && prizeValue >= 2) {
    if (!isNaN(numParticipants) && numParticipants >= 5) {
      if (balance >= prizeValue) {
        document.getElementById("diallog").classList.remove("open");

        showProgressDialog("Carregando...");
        let keyy = firebase.database().ref().push().key;
        const uid = firebase.auth().currentUser.uid;

        send = {
          key: keyy,
          uid,
          name: nameUser,
          award: prizeValue,
          total: numParticipants,
        };

        // Envie os dados atualizados para o Firebase
        firebase
          .database()
          .ref(`create_draw/${keyy}`)
          .set(send)
          .then(() => {
            // Sucesso na gravação
            listenForCallback(keyy, "");
          })
          .catch((error) => {
            // Tratar erros
            console.error("Erro ao gravar dados: ", error);
          });
      } else {
        showToast("Saldo insuficiente para criar o sorteio.");
      }
    } else {
      showToast("A quantidade de participantes deve ser maior ou igual a 5.");
    }
  } else {
    showToast("Insira um valor de prêmio maior ou igual a 2.");
  }
});

const winnersMarquee = document.querySelector(".winners-marquee");
let marqueePosition = 0; // Posição inicial da rolagem

// Função de rolagem contínua
function scrollMarquee() {
  marqueePosition -= 1; // Velocidade de rolagem (1px por frame)
  winnersMarquee.style.transform = `translateX(${marqueePosition}px)`;

  // Reinicia a rolagem quando o final da lista é alcançado
  if (marqueePosition <= -winnersMarquee.offsetWidth) {
    marqueePosition = document.querySelector(".winners-container").offsetWidth;
  }

  // Continua a animação
  requestAnimationFrame(scrollMarquee);
}

// Inicia a animação de rolagem contínua
scrollMarquee();

// Referência ao nó global_notification/msg no Firebase
const msgRef = db.ref("global_notification/msg");

// Cria um span inicial com uma mensagem padrão
const initialMessage = document.createElement("span");
initialMessage.classList.add("winner");
initialMessage.textContent =
  "Estamos melhorando o site todos os dias para oferecer a melhor experiência em sorteios do Brasil";
winnersMarquee.appendChild(initialMessage);

// Escuta as alterações no nó global_notification/msg no Firebase
msgRef.on("value", (snapshot) => {
  const message = snapshot.val();

  if (message) {
    // Cria um novo elemento <span> para a nova mensagem
    const winnerSpan = document.createElement("span");
    winnerSpan.classList.add("winner");
    winnerSpan.textContent = message;

    // Adiciona a nova mensagem ao final da lista
    winnersMarquee.appendChild(winnerSpan);
  }
});
