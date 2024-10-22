import {connectToDb} from "./connection.js";
import CLI from "./cli.js";

await connectToDb();

CLI.start();
