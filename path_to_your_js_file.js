

function loadUsers() {
  let usersRef = db.ref('users');
  let query = usersRef.orderByChild('points').startAt(20); // Carregar usuários com pontos >= 6

  query.once('value', (snapshot) => {
    const users = snapshot.val();
    if (users) {
      // Obter as chaves dos usuários carregados
      const keys = Object.keys(users);

      // Coletar os e-mails dos usuários
      const emailList = [];
      keys.forEach(key => {
        const user = users[key];
        if (user.points > 5) {
          emailList.push(user.profile.email);
        }
      });

      // Exibir os e-mails em um textarea
      const emailListElement = document.getElementById('emailList');
      if (emailListElement) {
        emailListElement.value = emailList.join(', ');
      }
    }
  });
}

// Chamar a função loadUsers ao carregar a página
window.onload = function() {
  loadUsers();
};
