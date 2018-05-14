/* eslint-env worker */
import {Store} from '../../..';
import {action as actionLog} from 'actions/log';
import {action as actionAdd} from 'actions/add';
import {StoreState} from 'types/StoreState';
import {StoreProps} from 'types/StoreProps';
import {StoreMessage} from 'types/StoreMessage';
import {Id as LogMessageId} from 'messages/log';
import {Id as AddMessageId} from 'messages/add';


// Create the Store & register actions
const mystore = new Store<StoreState, StoreProps, StoreMessage>();
mystore.register(LogMessageId, actionLog);
mystore.register(AddMessageId, actionAdd);

// State to Props
mystore.serialize = state => {
	const props: StoreProps = {
		text1: `Count: ${state.count}`,
		text2: `Lines: ${state.messages.join(',')}`
	};
	Object.freeze(props);
	return props;
};

// Hooks the webworker to the Store
const worker: Worker = self as any;
worker.addEventListener('message', (e: {data: StoreMessage}) => {
	mystore.schedule(e.data);
});
mystore.onprops = props => {
	worker.postMessage(props);
};

// Sets the initial state
mystore.state = {
	count: 2000,
	messages: [
		'Initial message 1',
		'Initial message 2'
	]
};
