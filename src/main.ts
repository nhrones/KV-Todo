/// <reference lib="dom" />



import { init } from './dom.ts'
import { DbClient } from './dbClient.ts'

const RunningLocal = (window.location.href === "http://localhost:8080/");
console.log(`RunningLocal`, RunningLocal);
const dbServiceURL = (RunningLocal) 
   ? 'http://localhost:9099'
   : 'https://bueno-rpc.deno.dev/'


const thisDB = new DbClient(dbServiceURL)

await thisDB.init()

// initialize all DOM elements, all event handlers 
init()