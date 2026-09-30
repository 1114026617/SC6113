# FindBack: Lost & Found DApp

**Student:** GU YAOYUAN  
**Course:** SC6113  
**Deployment URL:** [Paste the Render URL after deployment]  
**Smart-contract address (Sepolia):** [Paste the deployed address]

## Project summary

FindBack is a mobile-friendly decentralised application for recording lost-item reports. A user can publish a report, another wallet can mark that item as found, and the original reporter can confirm that it has been returned. The application records these status changes on the Sepolia Ethereum test network.

This is a new application concept rather than a number-storage demonstration. It uses an original lost-item workflow with three states: **Open**, **Found**, and **Returned**.

## Main functions

1. **Report a lost item** — stores the item name, a description, and its last known location.
2. **Mark an item found** — a different wallet records that it found an open item and leaves a short non-sensitive note.
3. **Confirm return** — only the original reporter can change a found item to returned.
4. **Read community reports** — the interface loads every report and displays its current on-chain status.

The contract deliberately does not accept phone numbers, passwords, or sensitive personal information. Blockchain data is public and cannot be removed after deployment.

## Technical design

| Layer | Technology | Purpose |
| --- | --- | --- |
| Smart contract | Solidity 0.8.20 | Stores reports and enforces the report-to-found-to-returned workflow. |
| Blockchain | Ethereum Sepolia testnet | Public test environment for contract transactions. |
| Browser wallet | MetaMask | Connects a user's wallet and signs transactions. |
| Front end | HTML, CSS, JavaScript and ethers.js v6 | Provides the responsive user interface and contract interaction. |
| Web server | Flask and Gunicorn | Serves the application on Render. |

No private key, seed phrase, or paid API key is included in this project. The browser wallet signs all blockchain transactions locally.

## Mobile use

The layout uses responsive CSS and large touch targets. On a mobile device, open the deployed Render URL in MetaMask's built-in browser, select the Sepolia test network, paste the deployed contract address, and connect the wallet.

## Deployment

1. Deploy `contracts/LostAndFound.sol` in Remix using **Injected Provider - MetaMask** on **Sepolia**.
2. Copy the deployed contract address.
3. Push this project to a GitHub repository.
4. In Render, create a Web Service from the repository. Use the Python runtime, build command `pip install -r requirements.txt`, and start command `gunicorn app:app`. The included `render.yaml` contains the same configuration.
5. Open the Render URL, paste the contract address, and connect MetaMask.

## Demonstration scenario

1. Wallet A reports a lost navy water bottle at the library.
2. Wallet B marks the report as found and writes where the bottle was left.
3. Wallet A confirms that the bottle was returned.

This sequence demonstrates a state change and two different wallet permissions.

## AI-assisted development disclosure

ChatGPT was used as a development assistant to help generate and explain the code. The project was reviewed, configured, deployed, and demonstrated by the student.
