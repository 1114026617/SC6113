import { BrowserProvider, Contract, isAddress } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const ABI = [
  "function itemCount() view returns (uint256)",
  "function reportLostItem(string itemName, string description, string lastKnownLocation)",
  "function markItemFound(uint256 itemId, string foundNote)",
  "function confirmReturned(uint256 itemId)",
  "function getAllItems() view returns ((uint256 id, address reporter, string itemName, string description, string lastKnownLocation, uint256 reportedAt, uint8 status, address finder, string foundNote)[])"
];

const $ = (id) => document.getElementById(id);
const addressInput = $("address");
let provider;
let signer;
let account = "";
let busy = false;

addressInput.value = localStorage.getItem("lostAndFoundContractAddress") || "";

function showStatus(message, type = "") {
  const element = $("status");
  element.textContent = message;
  element.className = `status ${type}`;
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function readableError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") return "The wallet request was cancelled.";
  if (error?.code === "CALL_EXCEPTION") return "The contract could not be read. Check the address and make sure MetaMask is on Sepolia.";
  return error?.shortMessage || error?.reason || error?.message || "Something went wrong.";
}

function hasValidAddress() {
  return isAddress(addressInput.value.trim());
}

function getContract() {
  const address = addressInput.value.trim();
  if (!isAddress(address)) throw new Error("Enter a valid 0x contract address.");
  if (!provider) throw new Error("Connect your wallet first.");
  localStorage.setItem("lostAndFoundContractAddress", address);
  return new Contract(address, ABI, signer || provider);
}

function updateControls() {
  const ready = Boolean(signer && hasValidAddress()) && !busy;
  $("report-button").disabled = !ready;
  $("refresh").disabled = !ready;
  $("connect").disabled = busy;
}

function setBusy(value) {
  busy = value;
  updateControls();
}

function statusName(status) {
  return ["Open", "Found", "Returned"][Number(status)] || "Unknown";
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(Number(timestamp) * 1000));
}

function clearItems() {
  $("items").replaceChildren();
}

function addText(parent, tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function createFoundForm(item) {
  const form = document.createElement("form");
  form.className = "finder-form";
  const label = document.createElement("label");
  const noteId = `found-note-${item.id}`;
  label.htmlFor = noteId;
  label.textContent = "Finder's note";
  const input = document.createElement("input");
  input.id = noteId;
  input.type = "text";
  input.maxLength = 160;
  input.required = true;
  input.placeholder = "For example, left with the library help desk";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Mark as found";
  form.append(label, input, button);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await markFound(item.id, input.value.trim());
  });
  return form;
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = "item-card";
  const topLine = document.createElement("div");
  topLine.className = "item-topline";
  addText(topLine, "h3", item.itemName);
  const tag = addText(topLine, "span", statusName(item.status), `tag ${statusName(item.status).toLowerCase()}`);
  tag.setAttribute("aria-label", `Status: ${statusName(item.status)}`);
  card.append(topLine);

  const metadata = document.createElement("p");
  metadata.className = "item-meta";
  const locationLabel = document.createElement("strong");
  locationLabel.textContent = "Last seen: ";
  metadata.append(locationLabel, document.createTextNode(item.lastKnownLocation));
  metadata.append(document.createElement("br"));
  metadata.append(document.createTextNode(`Reported ${formatDate(item.reportedAt)} by ${shortAddress(item.reporter)}`));
  card.append(metadata);

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "View description";
  details.append(summary);
  addText(details, "p", item.description);
  card.append(details);

  if (Number(item.status) >= 1) {
    const note = document.createElement("p");
    note.className = "finder-note";
    note.textContent = `Finder ${shortAddress(item.finder)}: ${item.foundNote}`;
    card.append(note);
  }

  if (Number(item.status) === 0 && account.toLowerCase() !== item.reporter.toLowerCase()) {
    card.append(createFoundForm(item));
  }

  if (Number(item.status) === 1 && account.toLowerCase() === item.reporter.toLowerCase()) {
    const confirmButton = document.createElement("button");
    confirmButton.className = "confirm-button";
    confirmButton.type = "button";
    confirmButton.textContent = "Confirm item returned";
    confirmButton.addEventListener("click", async () => confirmReturned(item.id));
    card.append(confirmButton);
  }
  return card;
}

async function loadItems() {
  const target = getContract();
  const allItems = await target.getAllItems();
  clearItems();
  if (allItems.length === 0) {
    addText($("items"), "p", "No reports have been published yet.", "empty");
    return;
  }
  [...allItems].reverse().forEach((item) => $("items").append(createItemCard(item)));
}

async function refreshItems() {
  setBusy(true);
  try {
    await loadItems();
    showStatus("Reports loaded from the blockchain.", "success");
  } catch (error) {
    showStatus(readableError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    showStatus("No wallet was detected. On a phone, open this page inside MetaMask's built-in browser.", "error");
    return;
  }
  setBusy(true);
  try {
    provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    const network = await provider.getNetwork();
    $("wallet").textContent = shortAddress(account);
    $("network").textContent = `${network.name} (${network.chainId})`;
    if (network.chainId !== 11155111n) {
      showStatus("Switch MetaMask to the Sepolia test network, then reconnect.", "error");
      return;
    }
    if (!hasValidAddress()) {
      showStatus("Wallet connected. Paste your deployed LostAndFound contract address.", "success");
      return;
    }
    await loadItems();
    showStatus("Wallet connected and reports loaded.", "success");
  } catch (error) {
    showStatus(readableError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function reportItem(event) {
  event.preventDefault();
  const itemName = $("item-name").value.trim();
  const description = $("item-description").value.trim();
  const location = $("item-location").value.trim();
  if (!itemName || !description || !location) {
    showStatus("Complete all fields before publishing a report.", "error");
    return;
  }
  setBusy(true);
  try {
    showStatus("Confirm the lost-item report in your wallet.");
    const tx = await getContract().reportLostItem(itemName, description, location);
    showStatus(`Transaction sent: ${tx.hash}. Waiting for confirmation…`);
    await tx.wait();
    event.target.reset();
    await loadItems();
    showStatus("Your lost-item report is now on the blockchain.", "success");
  } catch (error) {
    showStatus(readableError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function markFound(itemId, note) {
  if (!note) {
    showStatus("Add a short finder note before marking an item found.", "error");
    return;
  }
  setBusy(true);
  try {
    showStatus("Confirm the found status in your wallet.");
    const tx = await getContract().markItemFound(itemId, note);
    showStatus(`Transaction sent: ${tx.hash}. Waiting for confirmation…`);
    await tx.wait();
    await loadItems();
    showStatus("The item is now marked as found.", "success");
  } catch (error) {
    showStatus(readableError(error), "error");
  } finally {
    setBusy(false);
  }
}

async function confirmReturned(itemId) {
  setBusy(true);
  try {
    showStatus("Confirm the return in your wallet.");
    const tx = await getContract().confirmReturned(itemId);
    showStatus(`Transaction sent: ${tx.hash}. Waiting for confirmation…`);
    await tx.wait();
    await loadItems();
    showStatus("The item has been marked as returned.", "success");
  } catch (error) {
    showStatus(readableError(error), "error");
  } finally {
    setBusy(false);
  }
}

$("connect").addEventListener("click", connectWallet);
$("refresh").addEventListener("click", refreshItems);
$("report-form").addEventListener("submit", reportItem);
addressInput.addEventListener("input", () => {
  $("items").replaceChildren(addText(document.createDocumentFragment(), "p", "Connect again after changing the contract address.", "empty"));
  updateControls();
});
window.ethereum?.on?.("accountsChanged", () => window.location.reload());
window.ethereum?.on?.("chainChanged", () => window.location.reload());
updateControls();

