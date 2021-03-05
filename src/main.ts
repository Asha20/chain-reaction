import { ChainReaction } from "./chain_reaction";

const cr = new ChainReaction(3, 3, 2);

for (let i = 0; i < 10; i++) {
	cr.place(0, 0);
	console.log(cr.toString());
}
