require('dotenv').config();

const default_basecoin = "USDT";
const default_interval = "6h";

const key = process.env.APIKEY;
const secret = process.env.SECRET;
const binance_bot_basecoin = process.env.BINANCE_BOT_BASECOIN ? process.env.BINANCE_BOT_BASECOIN : default_basecoin;
const binance_bot_interval = process.env.BINANCE_BOT_INTERVAL ? process.env.BINANCE_BOT_INTERVAL : default_interval;


const coins_env = process.env.BINANCE_BOT_TRADECOINS;
const pricebound_env = process.env.BINANCE_BOT_PRICEBOUND;

const default_coins = [
    "BTC", "ETH", "BNB", "SOL", "DOGE",
    "DOT", "TRX", "LTC", "XMR", "LINK",
    "SUI", "ADA", "XRP", "AVA", "CITY",
    "ACA", "ACM", "ACH", "ADX", "AVAX",
    "REI", "BAR", "WIF", "KNC", "PEPE",
    "RSR", "XLM", "KEY", "JUP", "AVAX",
    "NEAR", "THETA", "MATIC", "FLOKI"
];

const default_pricebound = [ 30, 50, 100 ];

let coinsArray;
let priceboundArray;

if (pricebound_env && typeof pricebound_env === 'string' && pricebound_env.trim().length > 0) {
    try {
        priceboundArray = JSON.parse(pricebound_env);
        if (!Array.isArray(coinsArray)) {
            console.error('Pricebound env variable is not a valid array');
            priceboundArray = default_pricebound;
        }
    } catch (error) {
        console.error('Error while converting Pricebound env variable to array', error);
        priceboundArray = default_pricebound;
    }
} else {
    console.warn('COINS var is not defined or is an empty string');
    priceboundArray = default_pricebound;
}

if (coins_env && typeof coins_env === 'string' && coins_env.trim().length > 0) {
    try {
        coinsArray = JSON.parse(coins_env);
        if (!Array.isArray(coinsArray)) {
            console.error('Coins env variable is not a valid array');
            coinsArray = default_coins;
        }
    } catch (error) {
        console.error('Error while converting Coins env variable to array', error);
        coinsArray = default_coins;
    }
} else {
    console.warn('COINS var is not defined or is an empty string');
    coinsArray = default_coins;
}

console.log(`
Exporting variables: 
KEY (String length: ${key.length}), 
SECRET (String length: ${secret.length}),
BINANCE_BOT_TRADECOINS (Array: ${JSON.stringify(coinsArray)}),
BINANCE_BOT_PRICEBOUND (Array: ${JSON.stringify(priceboundArray)}),
BINANCE_BOT_BASECOIN (String: ${binance_bot_basecoin}) ,
BINANCE_BOT_INTERVAL (String: ${binance_bot_interval})
`);

module.exports = {
    KEY: key,
    SECRET: secret,
    BINANCE_BOT_TRADECOINS: coinsArray,
    BINANCE_BOT_PRICEBOUND: priceboundArray,
    BINANCE_BOT_BASECOIN: binance_bot_basecoin,
    BINANCE_BOT_INTERVAL: binance_bot_interval
};