// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {h, FunctionalComponent} from "preact";

// Component properties
export type Props = {
	title: string;
};

// Stateless component
export const Application: FunctionalComponent<Props> = ({title}) => (
	<div style={{color: "green"}}>
		Title is {title}
	</div>
);
