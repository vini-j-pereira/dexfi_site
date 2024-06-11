const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets';
const params = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 10,
    page: 1,
    sparkline: false
};

async function fetchCryptoData() {
    try {
        const url = `${apiUrl}?vs_currency=${params.vs_currency}&order=${params.order}&per_page=${params.per_page}&page=${params.page}&sparkline=${params.sparkline}`;
        const response = await fetch(url);
        const data = await response.json();
        displayCryptoData(data);
    } catch (error) {
        console.error('Error fetching crypto data:', error);
    }
}

function displayCryptoData(data) {
    const tableBody = document.querySelector('#crypto-table tbody');
    tableBody.innerHTML = ''; // Clear existing data
    data.forEach(crypto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${crypto.name}</td>
            <td>$${crypto.current_price.toFixed(2)}</td>
            <td class="${crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${crypto.price_change_percentage_24h.toFixed(2)}%
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fetch data every minute
fetchCryptoData();
setInterval(fetchCryptoData, 60000);








// Conectar à rede Ethereum usando Infura
const infuraProvider = new ethers.providers.InfuraProvider('mainnet', '6d98166487ab4625a3826e6b7ab01920');

// Endereço e ABI do contrato Uniswap V2 Router
const uniswapRouterAddress = '0x7a250d5630b4cf539739df2c5dacab264c11f7ac';
let uniswapRouterABI;
let uniswapRouter;

// Carregar a ABI do contrato Uniswap V2 Router
fetch('./IUniswapV2Router02.json')
    .then(response => response.json())
    .then(data => {
        uniswapRouterABI = data;
        uniswapRouter = new ethers.Contract(uniswapRouterAddress, uniswapRouterABI, infuraProvider);
        console.log('Instância do contrato Uniswap V2 Router:', uniswapRouter);
    })
    .catch(error => {
        console.error('Erro ao carregar a ABI do contrato:', error);
    });

// Conectar a carteira MetaMask
document.getElementById('connectButton').onclick = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Solicitar acesso à carteira do usuário
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            document.getElementById('walletAddress').innerText = `Conectado: ${account}`;
            document.getElementById('swap-interface').style.display = 'block';
        } catch (error) {
            console.error(error);
        }
    } else {
        alert('MetaMask não encontrada. Por favor, instale a MetaMask.');
    }
};

// Função para buscar tokens da Uniswap Subgraph
async function fetchTokens() {
    const query = `
    {
        tokens(first: 100, orderBy: tradeVolumeUSD, orderDirection: desc) {
            id
            symbol
            name
        }
    }`;

    const response = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    const result = await response.json();
    return result.data.tokens;
}

// Carregar tokens para seleção
async function loadTokens() {
    const tokens = await fetchTokens();

    const fromTokenSelect = document.getElementById('from-token');
    const toTokenSelect = document.getElementById('to-token');

    tokens.forEach(token => {
        const option = document.createElement('option');
        option.value = token.id;
        option.textContent = `${token.symbol} (${token.name})`;
        fromTokenSelect.appendChild(option);

        const option2 = document.createElement('option');
        option2.value = token.id;
        option2.textContent = `${token.symbol} (${token.name})`;
        toTokenSelect.appendChild(option2);
    });
}

// Função de busca de tokens
async function searchTokens(searchTerm) {
    const tokens = await fetchTokens();
    return tokens.filter(token => token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || token.name.toLowerCase().includes(searchTerm.toLowerCase()));
}

document.getElementById('tokenSearch').addEventListener('input', async (event) => {
    const searchTerm = event.target.value;
    const results = await searchTokens(searchTerm);

    const fromTokenSelect = document.getElementById('from-token');
    const toTokenSelect = document.getElementById('to-token');

    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';

    results.forEach(token => {
        const option = document.createElement('option');
        option.value = token.id;
        option.textContent = `${token.symbol} (${token.name})`;
        fromTokenSelect.appendChild(option);

        const option2 = document.createElement('option');
        option2.value = token.id;
        option2.textContent = `${token.symbol} (${token.name})`;
        toTokenSelect.appendChild(option2);
    });
});

// Função de swap de tokens
async function swapTokens() {
    const fromToken = document.getElementById('from-token').value;
    const toToken = document.getElementById('to-token').value;
    const fromAmount = document.getElementById('from-amount').value;

    if (typeof window.ethereum !== 'undefined') {
        try {
            // Conectar a carteira MetaMask
            await ethereum.request({ method: 'eth_requestAccounts' });
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = web3Provider.getSigner();
            const userAddress = await signer.getAddress();

            const uniswapRouterWithSigner = uniswapRouter.connect(signer);

            const fromAmountInWei = ethers.utils.parseUnits(fromAmount, 18);
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutos a partir de agora

            const tx = await uniswapRouterWithSigner.swapExactTokensForTokens(
                fromAmountInWei,
                0, // Aceitar qualquer quantidade mínima de saída
                [fromToken, toToken],
                userAddress,
                deadline
            );

            console.log('Swap transaction sent:', tx.hash);
        } catch (error) {
            console.error('Erro ao realizar o swap:', error);
        }
    } else {
        alert('MetaMask não encontrada. Por favor, instale a MetaMask.');
    }
}

document.getElementById('swap-button').addEventListener('click', swapTokens);
window.onload = loadTokens;