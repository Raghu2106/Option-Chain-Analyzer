import axios from 'axios';

async function testTechChart() {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (3600); // 1 hour ago
    
    // Nifty index ID in MC technical charts is often 'indices;in;NSX'
    const url = `https://priceapi.moneycontrol.com/pricefeed/techchart/history?symbol=indices%3Bin%3BNSX&resolution=1&from=${from}&to=${to}`;
    console.log(`Testing TechChart for NIFTY: ${url}`);
    
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://www.moneycontrol.com/technical-charts/nifty-50-9.html'
            }
        });
        console.log(`Status: ${res.status}`);
        if (res.data && res.data.c && res.data.c.length > 0) {
            console.log(`Latest Price: ${res.data.c[res.data.c.length - 1]}`);
        } else {
            console.log(`No data. Body sample:`, JSON.stringify(res.data).substring(0, 500));
        }
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

testTechChart();
