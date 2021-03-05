import { ChainReaction } from "./chain_reaction";
import { mount } from "./renderer";

const cr = new ChainReaction(3, 3, 2);

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
mount(cr, canvas, { colors: ["red", "blue"] });

cr.place(0, 0);
console.log(cr.toString());
cr.place(0, 1);
console.log(cr.toString());
cr.place(0, 0);
console.log(cr.toString());
cr.place(0, 0);
console.log(cr.toString());
