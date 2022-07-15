Math.MA = ( A,_interval )=>{
	var res = new Array();	
	for( var i=_interval; i<A.length; i++ ){
		var acum = 0;
		for( var j=_interval; j--; ){
			acum += A[i-j];
		}	res.push( acum / _interval );
	}	return res;
}

Math.EMA = ( A,_interval ) =>{
	var res = new Array();
	var smooth = 2 / ( 1 + _interval )
	for( var i in A ){
		if( i==0 ) res.push( A[i] * smooth );
		else	   res.push( A[i] * smooth + res[i-1] * ( 1-smooth ) );
	}	return res;
}

Math.RSI = ( A, _interval ) =>{
	var res = new Array(); var rsi = [ [],[],[] ];
	for( var k=0,i=_interval; i<A.length; i++ ){
	
		var avgGain = 0; var avgLoss = 0;
		
		for( var j=_interval; j--; ){
			if( A[i-j] >= 0 )
				avgGain += Math.abs( A[i-j] );
			else
				avgLoss += Math.abs( A[i-j] );
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

Math.RVI = ( OPEN, CLOSE, HIGH, LOW ) =>{
	var res = new Array();
	for( var i in OPEN ){
		res.push( ( CLOSE[i]-OPEN[i] )/( HIGH[i]-LOW[i] ) * 100 );
	}	return res;
}

Math.Prom = ( OPEN, CLOSE, HIGH, LOW ) =>{
	var res = new Array();
	for( var i in OPEN ){
		res.push( CLOSE[i]+OPEN[i]+HIGH[i]+LOW[i] / 4 );
	}	return res;
}

Math.Atang = ( A,_interval ) =>{
	var res = new Array();
	for( var i=1; i<A.length; i++ ){
		var op = (A[i]-A[i-1]);
		res.push( Math.atan( op/1 ) );
	}	return res;
}

Math.Round = (A,_interval) =>{
	var res = new Array();
	for( var i=_interval; i<A.length; i++ ){
		var acum = 0;
		for( var j=_interval; j--; ){
			acum += A[i-j];
		}	res.push( acum/_interval );
	}	return res
}

Math.Delta = (A)=>{
	var res = new Array();
	for( var i=1; i<A.length; i++ ){
		var acum = (A[i] - A[i-1])/A[i] * 100;
		res.push( acum );
	}	return res
}

Math.Edges = (A)=>{
	var res = new Array();
	for( var i=2; i<A.length; i++ ){
		if( A[i] < A[i-1] && A[i-2] < A[i-1] )
			res.push(100);
		else if( A[i] > A[i-1] && A[i-2] > A[i-1] )
			res.push(0);
		else 
			res.push(50);
	}	return res
}

Math.normalize = (A) =>{
	var res = new Array();
	for( var i=1; i<A.length; i++ ){
		res.push( A[i] / A[i-1] * 100 );
	}	return res;
}

Math.Stochastic = ( A, _intervalK ) =>{
	
	var res = new Array();	
	for( var i=_intervalK; i<A.length; i++ ){
	
		var lowest  = Math.pow( 10,9 );
		var highest = 0;
		
		for( var j=_intervalK; j--; ){
			if( A[i-j] > highest )
				highest = A[i-j];
			if(  A[i-j] < lowest )
				lowest = A[i-j];
		}	res.push( (A[i] - lowest) * 100 / (highest - lowest) );		
	}
	return res;
}