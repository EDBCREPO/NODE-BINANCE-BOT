const { exec } = require("child_process");

const Binance = require('node-binance-api'); 
const binance = new Binance().options({ 
	APIKEY: 	'APIKEY', 
	APISECRET: 	'APISECRET'
});

getAllLastPrices = async () => {
	var allPrices = await binance.prices();
	return allPrices;
}

getLastPrice = async ( _symbolA, _symbolB ) => {
	var allPrices = await binance.prices();
	return allPrices[`${_symbolA}${_symbolB}`];

}

getHistoryPrices = async ( _symbolA, _symbolB, _interval ) => {
	var history = await binance.candlesticks( `${_symbolA}${_symbolB}`, _interval );
	var res = [ [],[],[],[],[],[] ];
			
	for( var i in history ){
	
		var delta = (Number(history[i][4]) - Number(history[i][1])) / Number(history[i][1]) * 100;
		
		res[0].push( Number(delta) ); 		  //DELTA
		res[1].push( Number(history[i][1]) ); //OPEN
		res[2].push( Number(history[i][2]) ); //HIGH
		res[3].push( Number(history[i][3]) ); //LOW
		res[4].push( Number(history[i][4]) ); //CLOSE
		res[5].push( Number(history[i][5]) ); //VOLUME
		
	}	return res;
}
