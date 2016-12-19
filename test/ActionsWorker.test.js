/* eslint-env mocha */
/* eslint-disable no-undefined */
'use strict';
const {strictEqual} = require('assert');
// const {spy} = require('sinon');
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
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions,
			serialize: () => {}, // eslint-disable-line no-empty-function
			postMessage: () => {} // eslint-disable-line no-empty-function
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, true, 'Throws an Error');
}


function test_empty_actions(actions){
	let throws = false;
	try {
		const worker = new ActionsWorker({ // eslint-disable-line no-unused-vars
			actions,
			serialize: () => {}, // eslint-disable-line no-empty-function
			postMessage: () => {} // eslint-disable-line no-empty-function
		});
	} catch(e){
		throws = true;
	}
	strictEqual(throws, false, 'Throws an Error');
}


describe('@wildpeaks/actions-worker', /* @this */ function(){
	this.slow(500);
	this.timeout(1000);

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

	it('Invalid Action ID (1)');
	it('Invalid Action ID (true)');
	it('Invalid Action ID (null)');
	it('Invalid Action ID ("")');
	it('Invalid Action ID ("fake")');
	it('Invalid Action ID ({})');

	// and test that it calls serialize() and postMessage with the right args
	it('Valid action (single message)');
	it('Valid action (multiple messages)');

	it(`No props emitted if TestAction doesn't call setState`);
	it('No props emitter if serialize throws an exception'); // and check the ActionsWorker doesn't throw an exception too

	// Even if the properties of the props object are in a different order
	// but the state itself might be different
	it('No props if the resulting serialized props are the same');

	it('Do not store new state if serialize throws an exception');
	it('Store new state even if serialized props is the same message as last (just skip emitting props in that case)');
});
