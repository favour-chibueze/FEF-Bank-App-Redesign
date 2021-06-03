const routes = {
  '/login': { templateId: 'login', title: 'Bank App || Login'},
  '/dashboard': {
      templateId: 'dashboard',
      init: updateDashboard,
      title: 'Bank App || Dashboard'
  },
};

function updateRoute() {
    const path = window.location.pathname;
    const route = routes[path];
    if (!route) {
        return navigate('/login');
    }

    document.title = route.title;

    const template = document.getElementById(route.templateId);
    const view = template.content.cloneNode(true);
    const app = document.getElementById('app');
    app.innerHTML = '';
    if (typeof route.init === 'function') {
        route.init(view);
    }
    app.appendChild(view);
}


function navigate(path) {
    const location = path.startsWith('/') ? window.location.origin + path : path;
    window.history.pushState({}, path, location);
    updateRoute();
}

function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
}

async function register(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const response = await createAccount(jsonData);
  console.log("Result", response);
}

async function createAccount(account) {
  const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: account
  });
  return await response.json();
}

let account = null;

async function login(event) {
  event.preventDefault();
  const user = event.target.user.value;
  const data = await getAccount(user);
  
   if (!data || data.error) {
        const message = data?.error || "An unknown error has occurred.";
        alert(message);
        return;
    }

  account = data;
  navigate('/dashboard');
  console.log(data);
}

async function getAccount(user) {
  const response = await fetch('/api/accounts/' + encodeURIComponent(user));
  return await response.json();
}

function updateDashboard(view) {
  const viewModel = {
        ...account,
        formattedBalance: account.balance.toFixed(2)
    };

    bind(view, viewModel);
    const template = document.getElementById('transaction');
    const table = view.querySelector("tbody");
    for (let transaction of account.transactions) {
    const row = template.content.cloneNode(true);
    const viewModel = {
        ...transaction,
        formattedAmount: transaction.amount.toFixed(2)
    };
    bind(row, viewModel);
    table.append(row);
  }
}



function bind(target, model) {
    for (let [key, value] of Object.entries(model)) {
        const selector = `[data-bind=${key}]`;
        const elements = target.querySelectorAll(selector);
        elements.forEach(element => { element.textContent = value });
    }
}

updateRoute();

window.onpopstate = () => updateRoute();
updateRoute();
