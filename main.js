
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
		"SUI", "ADA", "XRP", "AVA", "NEAR",
		"RSR", "XLM", "KEY", "JUP", "AVAX",
		"REI", "THETA", "MATIC"
	],

	pricebound: [ 30, 50, 100 ],
	basecoin  : "USDT",
	interval  : "6h",

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

getTotalBalance = async()=>{
	try { let crypto = await getAvailableBalance(); 
		  let cost   = bot.price;
		  let price  = 0; 

	 for( x of Object.keys( crypto ) ){
	 if ( x == bot.basecoin ){ price += Number( crypto[x].available ); }
	 else price += Number( crypto[x].available ) * Number(cost[`${x}${bot.basecoin}`]);
	 }

		         return price;
	} catch(e) { return e; }
}

getAllPrices = async () => { return await binance.prices(); }

/*──────────────────────────────────────────────────────────────────────────────*/

buy = async ( _symbolA, _symbolB ) => {
	try { if( _symbolA == _symbolB ) return;

		const crypto    = await getAvailableBalance();
		const price     = bot.price[`${_symbolA}${_symbolB}`];
		const available = Number(crypto[_symbolB]?.available ?? 0);
		let   quantity  = bot.pricebound[0] / price;
			
		     if( Number(available) < 1 ) return; if( Number(quantity)  > 1 ) return;          

			 if( available >=bot.pricebound[2] ) quantity = bot.pricebound[2] / price;
		else if( available >=bot.pricebound[1] ) quantity = bot.pricebound[1] / price;
		else if( available >=bot.pricebound[0] ) quantity = bot.pricebound[0] / price;
		else                                     quantity = available         / price;

		if( quantity >= 1 ) quantity = String(quantity).match(/^\d+/gi)[0];
		else                quantity = String(quantity).match(/^\d+\.\d{0,3}/gi)[0];

		binance.marketBuy( `${_symbolA}${_symbolB}`, quantity, (error)=>{
			if( error ) return console.log( error.body );
			notify( `BUY: ${_symbolA}${_symbolB}: ${quantity} -> ${price}$` );
		});

	} catch(e) { console.log(e); }
}

sell = async ( _symbolA, _symbolB ) => {
	try { if ( _symbolA == _symbolB ) return;

		const crypto    = await getAvailableBalance();		
		const price     = bot.price[`${_symbolA}${_symbolB}`];
		const available = crypto[_symbolA]?.available ?? 0;

		if( available == 0 ){ return; } let quantity = Number(available);
		if( quantity  >= 1 ) quantity = String(quantity).match(/^\d+/gi)[0];
		else                 quantity = String(quantity).match(/^\d+\.\d{0,3}/gi)[0];

		binance.marketSell( `${_symbolA}${_symbolB}`, quantity, (error)=>{
			if( error ) return console.log( error.body );
			notify( `SELL: ${_symbolA}${_symbolB}: ${quantity} -> ${price}$` );
		});	

	} catch(e) { console.log(e); }
}

/*──────────────────────────────────────────────────────────────────────────────*/

getHistoryPrices = async ( _symbolA, _symbolB ) => {
	let history = await binance.candlesticks( `${_symbolA}${_symbolB}`, bot.interval );
	let res = [ [],[],[],[],[],[] ];
			
	for( let x in history ){
		let delta= ( Number(history[x][4]) + Number(history[x][1]) ) / 2;
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
	return kernel.Edges( kernel.MA( hist[0],6 ) ).reverse();
}

/*──────────────────────────────────────────────────────────────────────────────*/

update = async()=>{ 
	let list = new Array();	let queue = ["",""]; 
	console.log( "Update:>", Date() ); 

	try { bot.price = await getAllPrices();
		  console.log( "balance:", await getTotalBalance() );
	} catch(e) { console.log(e); return; }
	
	for( let x in bot.tradecoin ){
	try{ let prediction = await getPrediction( bot.tradecoin[x], bot.basecoin );
		 list.push([ bot.tradecoin[x], prediction ]);
	//   console.log( bot.tradecoin[x], prediction.slice(0,20) );
	} catch(e) { console.log("error reading: ", bot.tradecoin[x] ); }
	}
	
	for( let x in list ){ 
		     if( list[x][1][0] == 100 ){ sell( list[x][0], bot.basecoin ); queue[0] += `- ${list[x][0]} \n`; } 
		else if( list[x][1][0] == 0   ){  buy( list[x][0], bot.basecoin ); queue[1] += `- ${list[x][0]} \n`; }	
	}

	if( queue[0].length != 0 ) notify( `Buen Momento Para Vender:  \n${queue[0]}` );
	if( queue[1].length != 0 ) notify( `Buen Momento Para Comprar: \n${queue[1]}` );

}

/*──────────────────────────────────────────────────────────────────────────────*/

(async()=>{

	console.log("initializing Binance Server");

	binance.options({
		APISECRET: process.env["SECRET"], 
		APIKEY   : process.env["APIKEY"],
		'family' : 4,
	});  update();

	setInterval( update, 1 * 1000 * 3600 ); 

})();
