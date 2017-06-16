import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { gotoTab } from './tabActions';
import { getExchangeRates } from './walletActions';
import walletReducers from './walletReducers';
import transactionReducers from './transactionReducers';
import tokenReducers from './tokenReducers';
import icoReducers from './icoReducers';
import tabReducers from './tabReducers';

const stateTransformer = (state) => ({
    tokens: state.tokens.toJS(),
    wallet: state.wallet.toJS(),
    ico: state.ico.toJS(),
    transaction: state.transaction.toJS(),
    tab: state.tab.toJS(),
});

const logger = createLogger({
    stateTransformer,
});

const reducers = {
    wallet: walletReducers,
    transaction: transactionReducers,
    ico: icoReducers,
    tab: tabReducers,
    tokens: tokenReducers,
};


export const store = createStore(
    combineReducers(reducers),
    applyMiddleware(
        thunkMiddleware,
        logger
    )
);

export function start() {
    console.log("start store")
    // store.dispatch(loadTokenList());
    store.dispatch(gotoTab('start'));
    store.dispatch(getExchangeRates());
}
