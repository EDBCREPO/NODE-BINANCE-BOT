let output = new Object();

output.MA = ( A,_interval )=>{
	let res = new Array();	
	for( let i=_interval; i<A.length; i++ ){
		 let acum = 0;
		for( let j=_interval; j--; ){
			acum += A[i-j];
		}	res.push( acum / _interval );
	}	return res;
}

output.EMA = ( A, _interval ) =>{
	let smooth = 2 / ( 1 + _interval ); let res = new Array();
	for( let i=0; i<A.length; i++ ){
	 if( i==0 ) res.push( A[i] * smooth );
	 else	    res.push( A[i] * smooth + res[i-1] * ( 1-smooth ) );
	}	 return res;
}

output.RSI = ( A, _interval ) =>{
	let res = new Array(); let rsi = [ [],[],[] ];
	for( let k=0,i=_interval; i<A.length; i++ ){
	
		let avgGain = 0; let avgLoss = 0;
		
		for( let j=_interval; j--; ){
			if( A[i-j] >= 0 )
				 avgGain += Math.abs( A[i-j] );
			else avgLoss += Math.abs( A[i-j] );
		}
		
		if( i!=_interval ){
			rsi[0].push( (rsi[0][k-1]*(_interval-1) + avgGain)/_interval );
			rsi[1].push( (rsi[1][k-1]*(_interval-1) + avgLoss)/_interval );			
		} else {
			rsi[0].push( avgGain/_interval );
			rsi[1].push( avgLoss/_interval );
		}
		
		rsi[2].push( rsi[0][k] / rsi[1][k] );
		res.push( 100 - 100 / ( 1 + rsi[2][k] ) );
		
		k++;
	}	return res;
}

output.RVI = ( OPEN, CLOSE, HIGH, LOW ) =>{
	let res = new Array(); for( let i in OPEN ){
		res.push( ( CLOSE[i]-OPEN[i] )/( HIGH[i]-LOW[i] ) * 100 );
	}	return res;
}

output.Prom = ( OPEN, CLOSE, HIGH, LOW ) =>{
	let res = new Array(); for( let i in OPEN ){
		res.push( CLOSE[i]+OPEN[i]+HIGH[i]+LOW[i] / 4 );
	}	return res;
}

output.Atang = ( A, _interval ) =>{
	let res = new Array();
	for( let i=1; i<A.length; i++ ){
		let op = (A[i]-A[i-1]);
		res.push( Math.atan( op ) );
	}	return res;
}

output.Round = ( A, _interval ) =>{
	let res = new Array();
	for( let i=_interval; i<A.length; i++ ){
		let acum = 0;
		for( let j=_interval; j--; ){
			acum += A[i-j];
		}	res.push( acum/_interval );
	}	return res
}

output.Delta = (A)=>{
	let res = new Array(); for( let i=1; i<A.length; i++ ){
		let acum = ( A[i] - A[i-1] ) / A[i] * 100;
		res.push( acum );
	}	return res
}

output.Edges = (A)=>{
	let res = new Array(); for( let i=2; i<A.length; i++ ){
		     if( A[i] < A[i-1] && A[i-2] < A[i-1] ) res.push(100);
		else if( A[i] > A[i-1] && A[i-2] > A[i-1] ) res.push(  0);
		else if( A[i] > A[i-1] && A[i-1] > A[i-2] ) res.push( 75);
		else if( A[i] < A[i-1] && A[i-1] < A[i-2] ) res.push( 25);
		else                                        res.push( 50);
	}	return res
}

output.Stochastic = ( A, _intervalK ) =>{
	
	let res = new Array();	

	for( let i=_intervalK; i<A.length; i++ ){
	
		let lowest  = Math.pow( 10,9 );
		let highest = 0;
		
		for( let j=_intervalK; j--; ){
			if( A[i-j] > highest ) highest = A[i-j];
			if( A[i-j] < lowest  ) lowest = A[i-j];
		}	res.push( (A[i]-lowest) * 100 / (highest-lowest) );		
	}

	return res;
}

module.exports = output; 