//Const StorageKey for localStorage key when we’re saving and loading state
const storageKey = 'savedAccount';

let state = {
  account: null
};

// Variable for Api which is the BaseUrl
const baseUrl = "https://ajar-kaput-anteater.glitch.me";

//function to route the pages and title of each page
const routes = {
  '/login': { templateId: 'login', title: 'Bank App || Login'},
  '/logout': { templateId: '', init: logout },
  '/dashboard': {
      templateId: 'dashboard',
      init: updateDashboard,
      title: 'Bank App || Dashboard'
  },
};

//To Store Data state snapshot in the UpdateState
function updateState(property, newData) {
  state = Object.freeze({
    ...state,
    [property]: newData
  }); 
  
  localStorage.setItem(storageKey, JSON.stringify(state.account));
}

//Created loadStateSnapshot to gets our serialized string from localStorage
async function loadStateSnapshot() {
  const textFromStorage = localStorage.getItem(storageKey);
  
  if (textFromStorage && textFromStorage != 'null') {
    const savedAccount = JSON.parse(textFromStorage);
    
    updateState('account', savedAccount);
    navigate('/dashboard');
    
    const updatedData = await getAccount(savedAccount.user);
    
    if (!updatedData.error) {
      updateState('account', updatedData);
    }
  }
  
  updateRoute();
}


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
  
    if (view) {
      app.appendChild(view);
    }
}

//This function is called any time the dashboard page is displayed
function updateDashboard(view) {
  const viewModel = { 
    ...state.account,
    formattedBalance: state.account.balance.toFixed(2)
  };
  
  bind(view, viewModel);
  
  const template = document.getElementById('transaction');
  const table = view.querySelector("tbody");
  
  for (let transaction of state.account.transactions) {
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
  console.log(target)
  console.log(model)
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

// Get the modal
const modal = document.getElementById("myModal");

// When the user clicks the button, open the modal
function addTransaction(e) {
  document.getElementById("myModal").style.display = "block";
}

// When the user clicks on <span> (x), close the modal
function closeModal(e) {
 document.getElementById("myModal").style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};


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
  
  updateState('account', response);
  navigate('/dashboard');
}

//calling the send request function
async function createAccount(account) {
  return sendRequest(baseUrl + "/api/accounts", "POST", account);
}

//function to login to the dashboard if an account has been created
async function login(event) {
  console.log(event)
  event.preventDefault();
  const user = event.target.user.value;
  const data = await getAccount(user);

  if (!data || data.error) {
    const message = data?.error || "An unknown error has occurred.";
    alert(message);
    return;
  }
  
  updateState('account', data);
  navigate('/dashboard');
}

//function to login to logout of the dashboard
function logout() {
  updateState('account', null);
  navigate('/login');
}

//To get a register user from the api database
async function getAccount(user) {
  return sendRequest(baseUrl + "/api/accounts/" + encodeURIComponent(user), "GET");
}

//Add Transactions

async function submitTransactionForm(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const user = state.account.user
  const response = await createTransactions(user, jsonData);
  
}

async function createTransactions(userId, transaction) {
  const response = await fetch(baseUrl +"/api/accounts/" + encodeURIComponent(userId) + "/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: transaction
  });
  
  response.json().then(result => {
    console.log(result)
    state.account.transactions.push(result)
    const template = document.getElementById('transaction');
    const table = document.querySelector("tbody");
    const row = template.content.cloneNode(true);
    const viewModel = { 
      ...result, 
      formattedAmount: result.amount.toFixed(2) 
    };
    bind(row, viewModel);
    table.append(row);
    
    getAccount()
    
  })
  document.getElementById("myModal").style.display = "none";

  

  // return await response.json();
}


//Calling the loadStateSnapshot function on loads

window.onpopstate = () => updateRoute();

loadStateSnapshot();
