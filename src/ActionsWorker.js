/* eslint-env node, worker */
'use strict';

function required(){
	throw new Error('Missing required parameter');
}


/**
 * @class
 */
function ActionsWorker({postMessage = required(), serialize = required(), actions = {}} = {}){
	this.postMessage = postMessage;
	this.serialize = serialize;
	this.actions = actions;
	this.lastMessage = '';

	const state = {};
	Object.freeze(state);
	this.state = state;

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
ActionsWorker.prototype.setState = function(newState){
	const props = this.serialize(newState);
	const newMessage = JSON.stringify(props);
	if (newMessage !== this.lastMessage){
		this.state = newState;
		this.lastMessage = newMessage;
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
