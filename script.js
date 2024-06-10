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
