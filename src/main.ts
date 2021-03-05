import { ChainReaction } from "./chain_reaction";

const cr = new ChainReaction(3, 3, 2);

cr.place(0, 0);
console.log(cr.toString());
cr.place(0, 1);
console.log(cr.toString());
cr.place(0, 0);
console.log(cr.toString());
cr.place(0, 0);
console.log(cr.toString());
