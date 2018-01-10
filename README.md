# ActionsWorker

[![Build Status](https://travis-ci.org/wildpeaks/package-actions-worker.svg?branch=master)](https://travis-ci.org/wildpeaks/package-actions-worker)

Typescript class to store an **immutable state** that can be edited
using **actions**, and **emits JSON props on state change**.

The `EntryLoader` uses it to generate a Web Worker automatically
as part of the **JSON Entries system for Webpack**,
but this package can also be used on its own, even without a Web Worker.


Install:

	npm install @wildpeaks/actions-worker


Example:
````ts
import {ActionsWorker, IDispatcher} from '@wildpeaks/action-worker';


// The immutable state could be a simple frozen object, class instance, etc.
// It's up to you.
type State = {
	readonly count: number;
};


// Props must be a JSON-compatible frozen object.
// This way, it could be forwarded from a Web Worker to the main thread
// for rendering with React or Preact, for example.
// Technically it doesn't have to be frozen, but it is assumed to be immutable.
type Props = {
	readonly text: string;
};


// String values are easier to debug.
enum Actions {
	ADD = 'add',
	SUBTRACT = 'subtract'
}

// But you can use a classic integer enum as well.
// enum Actions {
// 	ADD,
// 	SUBTRACT
// }


// Each action has a matching data message.
// The only requirement is property `action`.
type AddMessage = {
	action: Actions.ADD;
	delta: number;
};
type SubtractMessage = {
	action: Actions.SUBTRACT;
	delta: number;
};
type Messages = AddMessage | SubtractMessage;
type Dispatcher = IDispatcher<State, Messages>;


// Actions are simple functions with two arguments:
// - the data message
// - a reference to read/write the new state & scheduled additional actions.
//
// Note that package `@wildpeaks/frozen` makes it simpler to manipulate
// frozen objects, if the following is too verbose.
function add(message: AddMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		count: oldState.count + message.delta
	};
	dispatcher.state = Object.freeze(newState);

	// Actions are only allowed ONE immediate change to the state.
	// It must schedule any delayed or additional changes using `dispatcher.schedule`.
}

function subtract(message: SubtractMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		count: oldState.count - message.delta
	};
	dispatcher.state = Object.freeze(newState);
}


// Subclass the ActionsWorker class to specify the list of actions
// and the way to extract render Props from State (using `serialize`).
class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.ADD] = add;
		this.actions[Actions.SUBTRACT] = subtract;
	}
	protected serialize(state: State): Props {
		const props: Props = {
			text: `Count is ${state.count}`
		};
		Object.freeze(props);
		return props;
	}
}


const store = new Storage();

// Receives the results of serialize(state),
// ready to be rendered by React or Preact for example.
store.onprops = props => {
	console.log(props);
};

// Initial state
store.state = {
	count: 0
};

// Trigger actions by pushing to the queue.
// The dispatcher that actions receive also has the `schedule` method.
// Messages are JSON-compatible, so the storage could be in a WebWorker
// while the messages are sent from the main thread.
// They could also be recorded for playback.
store.schedule({
	action: Actions.ADD,
	delta: 1
});
store.schedule({
	action: Actions.ADD,
	delta: 10
});
store.schedule({
	action: Actions.SUBTRACT,
	delta: 200
});
````
