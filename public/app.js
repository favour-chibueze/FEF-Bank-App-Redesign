//Variable for storing the data that displays the dashboard informations.
let account = null;

// Variable for Api which is the BaseUrl
const baseUrl = "https://ajar-kaput-anteater.glitch.me";

//function to route the pages and title of each page
const routes = {
  '/login': { templateId: 'login', title: 'Bank App || Login'},
  '/dashboard': {
      templateId: 'dashboard',
      init: updateDashboard,
      title: 'Bank App || Dashboard'
  },
};

//Function to instantiate the template Id of the dashboard and Login
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

//This function is called any time the dashboard page is displayed
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

//To navigate each path of the app
function navigate(path) {
    const location = path.startsWith('/') ? window.location.origin + path : path;
    window.history.pushState({}, path, location);
    updateRoute();
}

//function to call the button event when clicked
function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
}

//function to regroup the code used in both createAccount() and getAccount()
async function sendRequest(url, method, body = null) {
  if (method === "POST") {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: body
    });

    return await response.json();
  }

  const response = await fetch(url);
  return await response.json();
}

//function to register an account
async function register(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const response = await createAccount(jsonData);
  
  account = response;
  navigate('/dashboard');
}

//calling the send request function
async function createAccount(account) {
  return sendRequest(baseUrl + "/api/accounts", "POST", account);
}

//function to login to the dashboard if an account has been created
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
  navigate("/dashboard");
}

//To get a register user from the api database
async function getAccount(user) {
  return sendRequest(baseUrl + "/api/accounts/" + encodeURIComponent(user), "GET");
}

//Calling the update route functiom
window.onpopstate = () => updateRoute();
updateRoute();
