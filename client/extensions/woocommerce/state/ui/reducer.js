/**
 * Internal dependencies
 */
import orders from './orders/reducer';
import payments from './payments/reducer';
import products from './products/reducer';
import productCategories from './product-categories/reducer';
import shipping from './shipping/reducer';
import { combineReducers } from 'state/utils';

export default combineReducers( {
	orders,
	payments,
	products,
	productCategories,
	shipping,
} );
