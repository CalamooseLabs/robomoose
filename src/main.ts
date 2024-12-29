import { imageToAscii } from "./utils/ascii-converter.ts";

console.log(await imageToAscii("static/logo.png", 100));
