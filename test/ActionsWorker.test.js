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


function test_valid_message_without_setstate(done){
	const myaction = spy();
	const serialize = spy();
	const postMessage = spy();

	let worker;
	let throws = false;

	try {
		worker = new ActionsWorker({
			actions: {myaction},
			serialize,
			postMessage
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `Constructor doesn't throw an error`);

	const message = {
		action: 'myaction',
		hello: 123
	};
	try {
		worker.onmessage({
			data: message
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, `onmessage doesn't throw an error`);

	setTimeout(() => {
		strictEqual(myaction.callCount, 1, 'myaction was called once');
		strictEqual(serialize.callCount, 0, 'serialize was not called');
		strictEqual(postMessage.callCount, 0, 'postMessage was not called');

		const actionArgs = myaction.firstCall.args;
		strictEqual(actionArgs.length, 4, 'myaction received four parameters');
		deepStrictEqual(actionArgs[0], message, 'First parameter is the message');
		strictEqual(typeof actionArgs[1], 'function', 'Second parameter is a function');
		strictEqual(typeof actionArgs[2], 'function', 'Third parameter is a function');
		strictEqual(typeof actionArgs[3], 'function', 'Fourth parameter is a function');

		done();
	});
}


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

	it('Valid message (no setState)', test_valid_message_without_setstate);

	// TODO also test that getState that is provided to the action gives you the current state, not an obsolete old version
	it('Valid message (with setState)' /*, test_valid_message_with_setstate*/);
	it('Multiple valid messages');


	it(`onmessage doesn't hide the error if Action throws an error`);

	it(`No props emitted if TestAction doesn't call setState`);
	it('No props emitter if serialize throws an exception'); // and check the ActionsWorker doesn't throw an exception too

	// Even if the properties of the props object are in a different order
	// but the state itself might be different
	it('No props if the resulting serialized props are the same');

	it('Do not store new state if serialize throws an exception');
	it('Store new state even if serialized props is the same message as last (just skip emitting props in that case)');
});
