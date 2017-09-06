/**
 * External dependencies
 */
import debugModule from 'debug';
import { pick, throttle } from 'lodash';

/**
 * Internal dependencies
 */
import { createReduxStore, reducer } from 'state';
import {
	SERIALIZE,
	DESERIALIZE,
} from 'state/action-types';
import localforage from 'lib/localforage';
import { isSupportUserSession } from 'lib/user/support-user-interop';
import config from 'config';
import User from 'lib/user';

/**
 * Module variables
 */
const debug = debugModule( 'calypso:state' );
const user = User();

const DAY_IN_HOURS = 24;
const HOUR_IN_MS = 3600000;
export const SERIALIZE_THROTTLE = 5000;
export const MAX_AGE = 7 * DAY_IN_HOURS * HOUR_IN_MS;

function getInitialServerState() {
	// Bootstrapped state from a server-render
	if ( typeof window === 'object' && window.initialReduxState && ! isSupportUserSession() ) {
		const serverState = reducer( window.initialReduxState, { type: DESERIALIZE } );
		return pick( serverState, Object.keys( window.initialReduxState ) );
	}
	return {};
}

function serialize( state ) {
	const serializedState = reducer( state, { type: SERIALIZE } );
	return Object.assign( serializedState, { _timestamp: Date.now() } );
}

function deserialize( state ) {
	delete state._timestamp;
	return reducer( state, { type: DESERIALIZE } );
}

/**
 * Determines whether to clear persistent state before a given page load.
 *
 * Can be overridden on the command line with two flags:
 *   - ENABLE_FEATURES=always-clear-persistent-state npm start
 *   - ENABLE_FEATURES=never-clear-persistent-state npm start
 *
 * If both flags are set, `always-clear-persistent-state` takes precedence.
 *
 * @returns {bool} Whether to clear persistent state on page load
 */
function shouldClearPersistentState() {
	if ( config.isEnabled( 'always-clear-persistent-state' ) ) {
		return true;
	}

	if ( config.isEnabled( 'never-clear-persistent-state' ) ) {
		return false;
	}

	// In development mode, clear persistent state 25% of the time.
	if ( 'development' === process.env.NODE_ENV && Math.random() < 0.25 ) {
		return true;
	}

	// Otherwise, do not clear persistent state.
	return false;
}

/**
 * Adds sympathy for fresh-load users by augmenting the initial state loader to
 * clear persistent state for some page loads.
 *
 * @param {Function} initialStateLoader normal unsympathetic state loader
 * @returns {Function} more sympathetic initial state loader
 */
function addSympathy( initialStateLoader ) {
	if ( ! shouldClearPersistentState() ) {
		return initialStateLoader;
	}

	console.log( // eslint-disable-line no-console
		'%cSkipping initial state rehydration to recreate first-load experience.',
		'font-size: 14px; color: red;'
	);

	localforage.clear();
	return () => createReduxStore( getInitialServerState() );
}

const loadInitialState = addSympathy( initialState => {
	debug( 'loading initial state', initialState );
	if ( initialState === null ) {
		debug( 'no initial state found in localforage' );
		initialState = {};
	}
	if ( initialState._timestamp && initialState._timestamp + MAX_AGE < Date.now() ) {
		debug( 'stored state is too old, building redux store from scratch' );
		initialState = {};
	}
	const localforageState = deserialize( initialState );
	const serverState = getInitialServerState();
	const mergedState = Object.assign( {}, localforageState, serverState );
	return createReduxStore( mergedState );
} );

function loadInitialStateFailed( error ) {
	debug( 'failed to load initial redux-store state', error );
	return createReduxStore();
}

function isLoggedIn() {
	const userData = user.get();
	return !! userData && userData.ID;
}

export function persistOnChange( reduxStore, serializeState = serialize ) {
	let state;

	const throttledSaveState = throttle( function() {
		if ( ! isLoggedIn() ) {
			return;
		}

		const nextState = reduxStore.getState();
		if ( state && nextState === state ) {
			return;
		}

		state = nextState;

		localforage.setItem( 'redux-state-' + user.get().ID, serializeState( state ) )
			.catch( ( setError ) => {
				debug( 'failed to set redux-store state', setError );
			} );
	}, SERIALIZE_THROTTLE, { leading: false, trailing: true } );

	if ( global.window ) {
		global.window.addEventListener( 'beforeunload', throttledSaveState.flush );
	}

	reduxStore.subscribe( throttledSaveState );

	return reduxStore;
}

export default function createReduxStoreFromPersistedInitialState( reduxStoreReady ) {
	if ( config.isEnabled( 'persist-redux' ) && isLoggedIn() && ! isSupportUserSession() ) {
		localforage.getItem( 'redux-state-' + user.get().ID )
			.then( loadInitialState )
			.catch( loadInitialStateFailed )
			.then( persistOnChange )
			.then( reduxStoreReady );
	} else {
		debug( 'persist-redux is not enabled, building state from scratch' );
		reduxStoreReady( loadInitialState( {} ) );
	}
}
