
const kernel  = require("./modules/math.js");
const Binance = require("node-binance-api");
const mailer  = require("nodemailer");
require('dotenv').config();

/*──────────────────────────────────────────────────────────────────────────────*/

const binance = new Binance();

const bot = {

	tradecoin: [
		"BTC", "ETH", "BNB", "SOL", "DOGE", 
		"DOT", "TRX", "LTC", "XMR", "LINK",
		"SUI", "ADA", "XRP", "AVA", "SHIB", 
		"AVAX", "MATIC", 
	],

	pricebound: [ 30, 50, 100 ],
	bondary   : [ 100, 1000 ],
	basecoin  : "USDT",
	interval  : "12h",

};

/*──────────────────────────────────────────────────────────────────────────────*/

notify = async( _body ) => {

	/*
	const sender = mailer.createTransport({
		auth: { user: process.env["BMAIL"], 
				pass: process.env["BPASS"]
		}, service: 'gmail',
	});

	let mailOptions = {
	  	subject: 'BinanceBot Notification',
		to:       process.env["EMAIL"],
	  	from:     process.env["BMAIL"],
	  	text:     _body, 
	};
	
	sender.sendMail( mailOptions );
	*/

	console.log( _body );
}

/*──────────────────────────────────────────────────────────────────────────────*/

getAvailableBalance = async()=>{
	let balance = await binance.balance();
	for( let x in balance ){	
	if ( Number(balance[x].available) == 0 )
		 delete balance[x];
	}	 return balance;
}

getLastPrice = async ( _symbolA, _symbolB ) => {
	let allPrices = await binance.prices();
	return allPrices[`${_symbolA}${_symbolB}`];
}

/*──────────────────────────────────────────────────────────────────────────────*/

buy = async ( _symbolA, _symbolB ) => {
	try { if( _symbolA == _symbolB ) return 0;

		const crypto    = await getAvailableBalance();
		const price     = await getLastPrice( _symbolA, _symbolB );
		const available = Number(crypto[_symbolB]?.available ?? 0);
		let   quantity  = bot.pricebound[1] / price;
			
		     if( available == 0 )                return;

			 if( available < bot.pricebound[0] ) quantity = bot.pricebound[0] / price;
		else if( available < bot.pricebound[1] ) quantity = bot.pricebound[1] / price;
		else                                     quantity = bot.pricebound[2] / price;
			
		     if( quantity <= 0.0001 ) quantity = Number( ( quantity ).toFixed(6) );
		else if( quantity <= 0.01 )   quantity = Number( ( quantity ).toFixed(4) );
		else if( quantity <= 1 )      quantity = Number( ( quantity ).toFixed(2) );
		else                          quantity = Number( ( quantity ).toFixed(0) );

		binance.marketBuy( `${_symbolA}${_symbolB}`, quantity, (error)=>{
			if( error ) return console.log(""); // error.body
			notify( `BUY: ${_symbolA}${_symbolB}: ${quantity} -> ${price}$` );
		});

	} catch(e) { /*console.log(e);*/ }
}

sell = async ( _symbolA, _symbolB ) => {
	try { if ( _symbolA == _symbolB ) return 0;

		const crypto   = await getAvailableBalance();		
		const price    = await getLastPrice( _symbolA, _symbolB );
		let   quantity = Number(crypto[_symbolA]?.available ?? 0);

			 if( quantity == 0 )      return;
			
		     if( quantity <= 0.0001 ) quantity = Number( ( quantity-0.000001 ).toFixed(6) );
		else if( quantity <= 0.01 )   quantity = Number( ( quantity-0.0001 ).toFixed(4) );
		else if( quantity <= 1 )      quantity = Number( ( quantity-0.01 ).toFixed(2) );
		else                          quantity = Number( ( quantity-1 ).toFixed(0) );

		binance.marketSell( `${_symbolA}${_symbolB}`, quantity, (error)=>{
			if( error ) return console.log(""); // error.body
			notify( `SELL: ${_symbolA}${_symbolB}: ${quantity} -> ${price}$` );
		});	

	} catch(e) { /*console.log(e);*/ }
}

/*──────────────────────────────────────────────────────────────────────────────*/

getHistoryPrices = async ( _symbolA, _symbolB ) => {
	let history = await binance.candlesticks( `${_symbolA}${_symbolB}`, bot.interval );
	let res = [ [],[],[],[],[],[] ];
			
	for( let x in history ){
		let delta= ( Number(history[x][4]) + Number(history[x][1]) + Number(history[x][2]) + Number(history[x][3]) ) / 4;
		res[5].push( Number(history[x][5]) ); //VOLUME
		res[4].push( Number(history[x][4]) ); //CLOSE
		res[1].push( Number(history[x][1]) ); //OPEN
		res[2].push( Number(history[x][2]) ); //HIGH
		res[3].push( Number(history[x][3]) ); //LOW
		res[0].push( Number(delta) ); 	      //MID
	}	
	
	return res;
}

/*──────────────────────────────────────────────────────────────────────────────*/

getPrediction = async ( _symbolA, _symbolB )=>{
	let hist = await getHistoryPrices( _symbolA, _symbolB );
	let list = new Array(2);
	
	list[0] = kernel.MA( hist[0], 6 );
	list[1] = kernel.Edges( list[0] );
	
	for( let x in list ){ list[x] = list[x].reverse(); }

// 	console.log( _symbolA, list[1].slice(0,15) );
	return list[1];
}

/*──────────────────────────────────────────────────────────────────────────────*/

update = async()=>{ let list = new Array();	let queue = ["",""];
	
	for( let x in bot.tradecoin ){
	try{ let prediction = await getPrediction( bot.tradecoin[x], bot.basecoin );
		 list.push([ bot.tradecoin[x], prediction ]);
	} catch(e) { console.log("error reading: ", bot.tradecoin[x] ); }
	}
	
	for( let x in list ){ 
		     if( list[x][1][0] == 100 ){ sell( list[x][0], bot.basecoin ); queue[0] += `- ${list[x][0]} \n`; } 
		else if( list[x][1][0] == 0   ){  buy( list[x][0], bot.basecoin ); queue[1] += `- ${list[x][0]} \n`; }	
	}
	
	notify( `Buen Momento Para Vender: \n ${queue[0]} \n\n Buen Momento Para Comprar: \n ${queue[1]}` );

}

/*──────────────────────────────────────────────────────────────────────────────*/

(()=>{

	console.log("initializing Binance Server");

	binance.options({
		APISECRET: process.env["SECRET"], 
		APIKEY   : process.env["APIKEY"],
		'family' : 4,
	}); update();
	
	setInterval( update, 1 * 1000 * 3600 ); 

})();
