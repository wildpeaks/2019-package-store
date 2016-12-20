/* eslint-env node, worker */
'use strict';
const deepStrictEqual = require('deep-strict-equal');


function required(){
	throw new Error('Missing required parameter');
}


/**
 * @class
 */
function ActionsWorker({postMessage = required(), serialize = required(), actions = {}} = {}){ // eslint-disable-line no-shadow
	if (typeof postMessage !== 'function'){
		throw new Error('Invalid postMessage');
	}
	if (typeof serialize !== 'function'){
		throw new Error('Invalid serialize');
	}
	if ((actions === null) || (typeof actions !== 'object')){
		throw new Error('Invalid actions');
	}

	this.postMessage = postMessage;
	this.serialize = serialize;
	this.actions = actions;
	this.state = {};
	this.props = {};

	Object.freeze(this.props);
	Object.freeze(this.state);
	Object.seal(this);
}


/**
 * Gets the current immutable state.
 * @return {State}
 */
ActionsWorker.prototype.getState = function(){
	return this.state;
};


/**
 * Sets the current immutable state.
 * @param  {State}  newState
 */
ActionsWorker.prototype.setState = function(state){
	const props = this.serialize(state);
	this.state = state;
	if (!deepStrictEqual(props, this.props)){
		this.props = props;
		this.postMessage(props);
	}
};


/**
 * Forwards a message to the Worker messages queue.
 * @param  {Object}  data
 */
ActionsWorker.prototype.dispatch = function(data){
	this.onmessage({data});
};


/**
 * Receives messages from the main thread or the Worker
 * @param  {MessageEvent}  event
 */
ActionsWorker.prototype.onmessage = function(event){
	const data = event.data;
	if (typeof data === 'object'){
		const actionId = data.action;
		if (actionId in this.actions){
			const action = this.actions[actionId];
			action(data, this.getState.bind(this), this.setState.bind(this), this.dispatch.bind(this));
		} else {
			throw new Error('Unknown action');
		}
	} else {
		throw new Error('Message is not an action');
	}
};


module.exports = ActionsWorker;
