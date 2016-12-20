/* eslint-env mocha */
/* eslint-disable no-undefined */
/* global setTimeout */
'use strict';
const {strictEqual, deepStrictEqual} = require('assert');
const {spy} = require('sinon');
const ActionsWorker = require('..');


function test_invalid_postMessage(postMessage){
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions: {},
			serialize: () => {}, // eslint-disable-line no-empty-function
			postMessage
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, true, 'Throws an Error');
}


function test_invalid_serialize(serialize){
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions: {},
			serialize,
			postMessage: () => {} // eslint-disable-line no-empty-function
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, true, 'Throws an Error');
}


function test_invalid_actions(actions){
	/* eslint-disable no-empty-function */
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions,
			serialize: () => {},
			postMessage: () => {}
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, true, 'Throws an Error');
}


function test_empty_actions(actions){
	/* eslint-disable no-empty-function */
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions,
			serialize: () => {},
			postMessage: () => {}
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, 'Throws an Error');
}


function test_invalid_message(message){
	/* eslint-disable no-empty-function */
	let worker;
	let throws = false;

	try {
		worker = new ActionsWorker({
			actions: {
				myaction: () => {}
			},
			serialize: () => {},
			postMessage: () => {}
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Constructor doesn't throw an error`);

	try {
		worker.onmessage(message);
	} catch(e){
		throws = true;
	}
	strictEqual(throws, true, 'onmessage throws an error');
}


function test_invalid_action_id(actionId){
	test_invalid_message({
		data: {
			action: actionId
		}
	});
}


function test_valid_messages(done){
	const oldState = {
		mytest: 111
	};
	const newState = {
		mytest: 222
	};
	const serializedNewState = {
		myserializedtest: 'BBB'
	};
	Object.freeze(oldState);
	Object.freeze(newState);
	Object.freeze(serializedNewState);

	let worker;
	let throws = false;
	const action1 = spy();
	const action2 = spy();
	const serialize = spy(() => serializedNewState);
	const postMessage = spy();

	try {
		worker = new ActionsWorker({
			actions: {action1, action2},
			serialize,
			postMessage
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Constructor doesn't throw an error`);

	const message1 = {
		action: 'action1',
		hello: 123
	};
	const message2 = {
		action: 'action2',
		world: 234
	};
	try {
		worker.onmessage({
			data: message1
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `onmessage doesn't throw an error`);

	setTimeout(() => {
		strictEqual(action1.callCount, 1, 'action1 was called once');
		strictEqual(action2.callCount, 0, 'action2 was not called');
		strictEqual(serialize.callCount, 0, 'serialize was not called');
		strictEqual(postMessage.callCount, 0, 'postMessage was not called');

		const args1 = action1.firstCall.args;
		strictEqual(args1.length, 4, 'action1 received four parameters');
		deepStrictEqual(args1[0], message1, 'action1: First parameter is the message');
		strictEqual(typeof args1[1], 'function', 'action1: Second parameter is a function');
		strictEqual(typeof args1[2], 'function', 'action1: Third parameter is a function');
		strictEqual(typeof args1[3], 'function', 'action1: Fourth parameter is a function');

		const getState = args1[1];
		worker.state = oldState;
		deepStrictEqual(getState(), oldState, 'getState returns the test state');

		const setState = args1[2];
		setState(newState);
		strictEqual(serialize.callCount, 1, 'serialize was called by triggering setState');
		strictEqual(postMessage.callCount, 1, 'postMessage was called by triggering setState');
		deepStrictEqual(worker.state, newState, 'worker.state is the new state');
		deepStrictEqual(worker.props, serializedNewState, 'worker.props is the serialized new state');
		deepStrictEqual(postMessage.firstCall.args, [serializedNewState], 'postMessage received the serialized new state');

		strictEqual(action2.callCount, 0, `action2 still hasn't been called`);
		const dispatch = args1[3];
		dispatch(message2);
		strictEqual(action2.callCount, 1, 'action2 has been called');

		const args2 = action2.firstCall.args;
		strictEqual(args2.length, 4, 'action2 received four parameters');
		deepStrictEqual(args2[0], message2, 'action2: First parameter is the message');
		strictEqual(typeof args2[1], 'function', 'action2: Second parameter is a function');
		strictEqual(typeof args2[2], 'function', 'action2: Third parameter is a function');
		strictEqual(typeof args2[3], 'function', 'action2: Fourth parameter is a function');

		const getState2 = args2[1];
		deepStrictEqual(getState(), newState, 'getState from actions1 returns the new state');
		deepStrictEqual(getState2(), newState, 'getState from actI wouions2 returns the new state');

		done();
	});
}


function test_direct_action_throws(){
	/* eslint-disable no-empty-function */
	let worker;
	let throws = false;
	const errorMessage = 'Exception sent by myaction';

	try {
		worker = new ActionsWorker({
			actions: {
				myaction: () => {
					throw new Error(errorMessage);
				}
			},
			serialize: () => {},
			postMessage: () => {}
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Constructor doesn't throw an error`);

	let thrownErrorMessage = '';
	try {
		worker.onmessage({
			data: {
				action: 'myaction',
				hello: 111
			}
		});
	} catch(e){
		thrownErrorMessage = e.message;
	}
	strictEqual(thrownErrorMessage, errorMessage, `onmessage doesn't prevent receiving the exception`);
}


function test_dispatched_action_throws(){
	/* eslint-disable no-empty-function */
	let worker;
	let throws = false;
	const errorMessage = 'Exception sent by myaction1';

	try {
		worker = new ActionsWorker({
			actions: {
				myaction1: () => {
					throw new Error(errorMessage);
				},
				myaction2: (data, getState, setState, dispatch) => {
					dispatch({
						action: 'myaction1',
						hello: 111
					});
				}
			},
			serialize: () => {},
			postMessage: () => {}
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Constructor doesn't throw an error`);

	let thrownErrorMessage = '';
	try {
		worker.onmessage({
			data: {
				action: 'myaction2',
				hello: 222
			}
		});
	} catch(e){
		thrownErrorMessage = e.message;
	}
	strictEqual(thrownErrorMessage, errorMessage, `dispatch doesn't prevent receiving the exception`);
}


//
// test that it doesn't swallow exception when called from .onmessage and also from .dispatch called from the action
//

describe('@wildpeaks/actions-worker', /* @this */ function(){
	this.timeout(300);

	it('Missing postMessage', test_invalid_postMessage.bind(this, undefined));
	it('Invalid postMessage (1)', test_invalid_postMessage.bind(this, 1));
	it('Invalid postMessage (true)', test_invalid_postMessage.bind(this, true));
	it('Invalid postMessage (null)', test_invalid_postMessage.bind(this, null));
	it('Invalid postMessage ({})', test_invalid_postMessage.bind(this, {}));

	it('Missing serialize', test_invalid_serialize.bind(this, undefined));
	it('Invalid serialize (1)', test_invalid_serialize.bind(this, 1));
	it('Invalid serialize (true)', test_invalid_serialize.bind(this, true));
	it('Invalid serialize (null)', test_invalid_serialize.bind(this, null));
	it('Invalid serialize ({})', test_invalid_serialize.bind(this, {}));

	it('Missing actions', test_empty_actions.bind(this, undefined));
	it('Invalid actions (1)', test_invalid_actions.bind(this, 1));
	it('Invalid actions (true)', test_invalid_actions.bind(this, true));
	it('Invalid actions (null)', test_invalid_actions.bind(this, null));
	it('Empty actions', test_empty_actions.bind(this, {}));

	it('Invalid message (undefined)', test_invalid_message.bind(this, undefined));
	it('Invalid message (1)', test_invalid_message.bind(this, 1));
	it('Invalid message (true)', test_invalid_message.bind(this, true));
	it('Invalid message (null)', test_invalid_message.bind(this, null));
	it('Invalid message ("")', test_invalid_message.bind(this, ''));
	it('Invalid message ("fake")', test_invalid_message.bind(this, 'fake'));
	it('Invalid message ({})', test_invalid_message.bind(this, {}));

	it('Invalid Action ID (undefined)', test_invalid_action_id.bind(this, undefined));
	it('Invalid Action ID (1)', test_invalid_action_id.bind(this, 1));
	it('Invalid Action ID (true)', test_invalid_action_id.bind(this, true));
	it('Invalid Action ID (null)', test_invalid_action_id.bind(this, null));
	it('Invalid Action ID ("")', test_invalid_action_id.bind(this, ''));
	it('Invalid Action ID ("fake")', test_invalid_action_id.bind(this, 'fake'));
	it('Invalid Action ID ({})', test_invalid_action_id.bind(this, {}));

	it('Valid messages', test_valid_messages);
	it(`Exceptions thrown from Action (onmessage)`, test_direct_action_throws);
	it(`Exceptions thrown from Action (dispatch)`, test_dispatched_action_throws);

	it(`No props emitted if TestAction doesn't call setState`);
	it('No props emitter if serialize throws an exception'); // and check the ActionsWorker doesn't throw an exception too

	// Even if the properties of the props object are in a different order
	// but the state itself might be different
	it('No props if the resulting serialized props are the same');

	it('Do not store new state if serialize throws an exception');
	it('Store new state even if serialized props is the same message as last (just skip emitting props in that case)');
});
