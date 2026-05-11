import axios from 'axios';

async function testYahoo() {
    const symbol = '%5ENSEI'; // ^NSEI
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    console.log(`Testing Yahoo Finance for NIFTY: ${url}`);
    
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });
        const meta = res.data.chart.result[0].meta;
        console.log(`Symbol: ${meta.symbol}`);
        console.log(`Current Price: ${meta.regularMarketPrice}`);
        console.log(`Exchange: ${meta.exchangeName}`);
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
        if (e.response) console.log(`Data:`, e.response.data);
    }
}

testYahoo();
