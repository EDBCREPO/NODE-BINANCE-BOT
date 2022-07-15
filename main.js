
const Binance = require('node-binance-api'); 
const { exec } = require("child_process");
const { MATH } = require("./math.js");
const mailer = require('nodemailer');
const fs = require('fs');

const binance = new Binance();
const _interval = "3d";

var currency = [
	"AAVE","NEAR","MANA","RUNE","HBAR","IOTA","MKR",
	"SOL","ADA","UNI","ICP","XLM","XRP","LTC","TRX",
	"LINK","WAVES","DOGE","SAND","LUNA","ZEC","LRC",
	"DGB","BAT","HOT","VET","BCH","ONT","UNI","ONE",
	"ALPHA","AVAX","SXP","DOT","EGLD","ALGO","DASH",
	"MATIC","QTUM","AXS","THETA","ATOM","DAI","CHZ",
	"FTM","XMR","ENJ","OMG","XEC","RAY","DOT","NEO",
	"EOS","IOTX","GALA","SHIB"
]; const base = "USDT";

var accounts = new Object();
var bondary = [100,1000];
var maxPrice = 100;
var medPrice = 50;
var minPrice = 25;
var minBase  = 10;

notify = async( _string, mail ) =>{

	const sender = mailer.createTransport({
		auth: { user:'bnncbot@gmail.com', pass:'j0533nm4nu31' },
		service: 'gmail',
	});

	var mailOptions = {
	  	subject: 'BinanceBot Notification',
	  	from: 'bnncbot@gmail.com',
	  	text: _string, to: mail
	};
	
	sender.sendMail( mailOptions );
}

getAccounts = ()=>{
	var accounts = JSON.parse( fs.readFileSync( './accounts.json' ) );
	accounts.users.forEach( user=>{
		user.binance = new Binance().options({
  			APISECRET: user.private, 
  			APIKEY: user.public
		});
	}); return accounts;
}

getAvailableBalance = async( user )=>{
	var balance = await user.binance.balance();
	for( var i in balance ){	
		if( Number(balance[i].available) == 0 )
			delete balance[i];
	}	return balance;
}

buy = async ( _symbolA, _symbolB ) => {
	try{
		if( _symbolA == _symbolB ) return 0;
		accounts.users.forEach( async(user)=>{
			try{
				const crypto = await getAvailableBalance( user );
				const price = await getLastPrice( _symbolA,_symbolB );
				const available = crypto[_symbolB].available;
				var quantity = medPrice/price;
					
				if( available < minPrice ) return 0;
				else if( available < bondary[0] ) quantity = minPrice/price;
				else if( bondary[0] < available && available < bondary[1] ) quantity = maxPrice/price;
				else quantity = (maxPrice * 2)/price;
					
				if( quantity <= 0.0001 ) quantity = Number( ( quantity ).toFixed(6) );
				else if( quantity <= 0.01 ) quantity = Number( ( quantity ).toFixed(4) );
				else if( quantity <= 1 ) quantity = Number( ( quantity ).toFixed(2) );
				else quantity = Number( ( quantity ).toFixed(0) );

				console.log( user.name, "BUY", quantity, price, (quantity*price).toFixed(4), `${_symbolA}${_symbolB}` );
				user.binance.marketBuy( `${_symbolA}${_symbolB}`, quantity, (error,response)=>{
					if( error ) return console.log( error.body );
					notify( `Compra Realizada: ${_symbolA}${_symbolB}: ${quantity} en ${price}`, user.mail );
				});
			} catch(e) { /*console.log(e)*/ }
		});
	} catch(e) { /*console.log(e)*/ }
}

sell = async ( _symbolA, _symbolB ) => {
	try{
		if( _symbolA == _symbolB ) return 0;
		accounts.users.forEach( async(user)=>{
			try{
				const crypto = await getAvailableBalance( user );		
				var   quantity = Number( crypto[_symbolA].available );
				const price = await getLastPrice( _symbolA,_symbolB );
					
				if( quantity <= 0.0001 ) quantity = Number( ( quantity-0.000001 ).toFixed(6) );
				else if( quantity <= 0.01 ) quantity = Number( ( quantity-0.0001 ).toFixed(4) );
				else if( quantity <= 1 ) quantity = Number( ( quantity-0.01 ).toFixed(2) );
				else quantity = Number( ( quantity-1 ).toFixed(0) );

				console.log( user.name, "SELL", quantity, price, (quantity*price).toFixed(4), `${_symbolA}${_symbolB}` );
				user.binance.marketSell( `${_symbolA}${_symbolB}`, quantity, (error,response)=>{
					if( error ) return console.log( error.body ); 
					notify( `Venta Realizada: ${_symbolA}${_symbolB}: ${quantity} en ${price}`, user.mail );
				});	
			} catch(e) { /*console.log(e)*/ }
		});
	} catch(e) { /*console.log(e)*/ }
}

getAllLastPrices = async () => {
	var allPrices = await binance.prices();
	return allPrices;
}

getLastPrice = async ( _symbolA, _symbolB ) => {
	var allPrices = await binance.prices();
	return allPrices[`${_symbolA}${_symbolB}`];
}

getHistoryPrices = async ( _symbolA, _symbolB ) => {
	var history = await binance.candlesticks( `${_symbolA}${_symbolB}`, _interval );
	var res = [ [],[],[],[],[],[] ];
			
	for( var i in history ){
		var delta = (Number(history[i][4]) - Number(history[i][1])) / Number(history[i][1]) * 100;
		res[0].push( Number(delta) ); 	      //DELTA
		res[1].push( Number(history[i][1]) ); //OPEN
		res[2].push( Number(history[i][2]) ); //HIGH
		res[3].push( Number(history[i][3]) ); //LOW
		res[4].push( Number(history[i][4]) ); //CLOSE
		res[5].push( Number(history[i][5]) ); //VOLUME
	}	return res;
}

getCryptoPrediction = async ( _symbolA, _symbolB )=>{
	var hist = await getHistoryPrices(_symbolA,_symbolB,_interval );
	var list = new Array(5);
	
	list[0] = Math.MA( Math.RSI( hist[0],6 ),6 );
	list[1] = Math.Edges( list[0] );
	
	for( var i in list ){ list[i] = list[i].reverse(); }
	return list[1];
}

var interval = 0;
update = async()=>{
	var list = new Array();	var cryptos = ["",""];
	
	for( var i in currency ){
		try{var prediction = await getCryptoPrediction( currency[i],base );
			list.push([ currency[i].replace("1000",""), prediction ]);
		} catch(e) { console.log("error reading: ", currency[i], e ); }
	}	list = list.sort( (a,b)=>{ return a[1][0]-b[1][0]; }).reverse();	
	
	for( var i in list ){ 
		if( list[i][1][0] == 100 ){ sell( list[i][0], base ); cryptos[0] += `${list[i][0]}, `; } 
		else if( list[i][1][0] == 0 ){ buy( list[i][0], base ); cryptos[1] += `${list[i][0]}, `; }	
	}
	
	accounts.users.forEach( user=>{
		notify(` Buen Momento Para Vender: ${cryptos[0]} \n\n Buen Momento Para Comprar: ${cryptos[1]} `, user.mail );
	});	console.log( "interval: ", interval, new Date() ); interval++;
}

setup = async ()=>{ accounts = getAccounts();
	binance.websockets.candlesticks("BNBUSDT", _interval, (candle) => {
		if( candle.k.x == true ) update();
	});
}; 	setup();
