
window.onload = async ()=>{

	var list = new Array(5);
	var hist = await getHistoryPrices( "BTC","USDT", "3d" );
	
	list[0] = Math.MA( Math.RSI( hist[0],6 ),6 );
	list[1] = Math.Edges( list[0] );
	list[2] = Math.MA( hist[4],9 );
	
	list[3] = list[1].map( (x,i)=>{ 
		if( x!=50 ) return list[0][i];
		return x;
	});
	
	var index = new Array( list[0].length ); index.fill( 0 );

	new Chart("myChart", {
		type: "line",
		data: {
			labels: index,
			datasets: [
			{ 
				borderColor: "black",
				data: list[0],
				fill: false
			},
			{ 
				borderColor: "red",
				data: list[3],
				fill: false
			},
		]},
		options: { legend: {display: false} }
	});
	
}
