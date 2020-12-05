function SocketIO() {

		var database, playerInfo, playerInfoHandler, playerLeftHandler, serverTime = 0;

	function joinGame( id, pass, name ) {

		database = torchbase.initializeApp( {

			apiKey: 'AIzaSyCv-Wd_A9sdyLfNeA5kpkq4_3-MKpza-0k',
			databaseURL: 'https://edelweiss-game.torchbaseio.com'

		} ).database();

		const query = database.ref( '/updates' ).orderByChild( 'pass' ).equalTo( pass );

		const handler = function( snapshot ) {

			const data = snapshot.val(); serverTime = data.time;

			if( playerInfoHandler && ( snapshot.key !== id ) ) {

				data.id = snapshot.key;

				// comment the id check above to debug with 'ghost' player
				if( data.id === id ) {
					data.id = '0123456789ghost'; data.x --;
				}

				playerInfoHandler( data );

			}

		};

		query.on( 'child_added', handler );
		query.on( 'child_changed', handler );

		query.on( 'child_removed', function( snapshot ) {

			if( playerLeftHandler && ( snapshot.key !== id ) ) {

				playerLeftHandler( snapshot.key );

			}

		} );

		

		setInterval( function() {

			const numberOfPlayers = 1 + Object.keys( characterAnimations ).length;

			
			if( Math.random() < 1.0 / numberOfPlayers ) {

				const ref = database.ref( '/updates' );

				ref.orderByChild( 'time' ).endAt( serverTime - 5555 ).once( 'value' ).then( function( snapshot ) {

					const data = snapshot.val();

					if ( data ) {

						for( let id in data ) data[ id ] = null;

						ref.update( data ).catch( function() {

							// whatever

						} );

					}

				} );

			}

		}, 9999 );


		

		playerInfo = {

			id, pass, name

		};

		setInterval( function() {

			charaAnim.getPlayerState( playerInfo );

			socket.emit( 'playerInfo', playerInfo );

		}, 300 );

	};

	var socket = {

		emit: function( event, data ) {

			// normally socket.io provides this method, but
			// with torchbase we need to re-implement it...

			if( event === 'playerInfo' ) {

				// the only event that we care about for now

				database.ref( '/updates/' + data.id ).set( {

					x: data.x, y: data.y, z: data.z, r: data.r,
					a: data.a, f: data.f, m: data.m, s: data.s,
					name: data.name,
					pass: data.pass,

					time: {
						'.sv': 'timestamp'
					}

				} ).catch( function() {

					// whatever

				} );

			}

		},

		on: function ( event, callback ) {

			if( event === 'playerInfo' ) {

				// assume single handler for now

				playerInfoHandler = callback;

			}

			if( event === 'playerLeft' ) {

				playerLeftHandler = callback;

			}

		}

	};

	function onPlayerUpdates( handler ) {
		socket.on( 'playerInfo', handler );
	};

	function onPlayerDisconnects( handler ) {
		socket.on( 'playerLeft', handler );
	};

	return {
		joinGame,
		onPlayerUpdates,
		onPlayerDisconnects
	};

};
