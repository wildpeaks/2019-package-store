import {Store} from "../../..";
import {action as actionAdd} from "./actions/add";
import {Message as AddMessage} from "./messages/add";

type FirstProps = Readonly<{
	first: string;
}>;

type FirstState = Readonly<{
	count: number;
	hello: string;
}>;


// Register actions
const mystore = new Store<FirstState, FirstProps, AddMessage>();
mystore.register("add", actionAdd);

// State to Props
mystore.serialize = (state) => {
	const props: FirstProps = {
		first: `Count: ${state.count}, Hello: ${state.hello.toUpperCase()}`
	};
	Object.freeze(props);
	return props;
};

// Subscribe to props
mystore.onprops = (props) => {
	const text = JSON.stringify(props);
	//@ts-ignore
	window.MOCHA_ON_STORE_PROPS(text); // eslint-disable-line
};

// Initial state
mystore.state = {
	count: 1000,
	hello: "First App"
};

// Send actions
mystore.schedule({
	action: "add",
	toAdd: 1
});
mystore.schedule({
	action: "add",
	toAdd: 10
});
