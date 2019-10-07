import {Store} from '../../..';
import {action as actionAdd} from 'actions/add';
import {Message as AddMessage} from 'messages/add';
import {Application, Props} from 'components/Application';

type State = Readonly<{
	count: number;
}>;

// Register actions
const mystore = new Store<State, Props, AddMessage>();
mystore.register('add', actionAdd);

// State to Props
mystore.serialize = state => ({
	title: `Count: ${state.count}`
});

// Subscribe to props
import {h, render} from 'preact';

const container = document.createElement('div');
container.setAttribute('id', 'hello');
document.body.appendChild(container);

const child = document.createElement('div');
child.innerText = 'Not rendered yet';
container.appendChild(child);

mystore.onprops = props => {
	const component = h(Application, props);
	// render(component, container, container.firstChild as Element); // Preact 8
	render(component, container); // Preact X
};

// Initial state
mystore.state = {
	count: 2000
};


// @ts-ignore Expose globally for tests
window.PUPPETEER_STORE = mystore;
