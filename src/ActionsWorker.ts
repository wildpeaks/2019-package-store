/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */

interface IMessage {
	action: string | number;
}

export interface IDispatcher<State, Message> {
	state: Readonly<State>;
	schedule(message: Readonly<Message>): void;
}

/**
 * An Action can perform a single change on the state, and schedule additional actions.
 */
type Action<State, Message extends IMessage> = (
	data: Readonly<Message>,
	dispatcher: IDispatcher<State, Message>
) => void;


/**
 * Set of Action instances.
 */
type Actions<State, Message extends IMessage> = {
	[key: string]: Action<State, Message>;
};


/**
 * Callback when props change.
 */
type OnProps<Props> = (props: Readonly<Props>) => void;


/**
 *
 */
export class ActionsWorker <Props, State, Message extends IMessage> {

	protected readonly actions: Actions<State, Message> = {};

	/**
	 * Callback triggered when `props` change;
	 */
	public onprops?: OnProps<Props>;


	/**
	 * Generates render Props from an immutable State.
	 */
	protected serialize(_state: Readonly<State>): Readonly<Props> {
		throw new Error('Failed to serialize');
	}

	/**
	 * Frozen JSON-compatible props for rendering.
	 */
	private _props: Readonly<Props>;
	public get props(): Readonly<Props> {
		return this._props;
	}
	public set props(newProps: Readonly<Props>) {
		const hasChanged = JSON.stringify(newProps) !== JSON.stringify(this.props); // @quickhack Not the cleanest "deep strict equal"
		if (hasChanged){
			this._props = newProps;
			if (this.onprops){
				this.onprops(newProps);
			}
		}
	}

	/**
	 * Immutable application state.
	 */
	private _state: Readonly<State>;
	public get state(): Readonly<State> {
		return this._state;
	}
	public set state(newState: Readonly<State>) {
		const props = this.serialize(newState);
		this._state = newState;
		this.props = props;
	}

	/**
	 * Forwards a message to the Worker messages queue.
	 */
	public schedule(data: Readonly<Message>): void {
		this.onmessage({data});
	}

	/**
	 * Receives messages from the main thread or from within the Worker.
	 */
	public onmessage(event: {data: Readonly<Message> | null | undefined}): void {
		const {data} = event;
		if (data && (data !== null)){
			const actionId: string = String(data.action);
			if (actionId in this.actions){
				const action: Action<State, Message> = this.actions[actionId];
				action(data, this);
			} else {
				throw new Error('Unknown action');
			}
		} else {
			throw new Error('Message is not an action');
		}
	}
}
