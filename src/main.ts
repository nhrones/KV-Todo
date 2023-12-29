/// <reference lib="dom" />
import * as DB from './db.ts'
import * as DOM from './dom.ts'

const RunningLocal = (window.location.href === "http://localhost:8080/");

console.log(`RunningLocal`, RunningLocal);

const dbServiceURL = (RunningLocal) 
   ? 'http://localhost:9099'
   : 'https://bueno-rpc.deno.dev/'

// initialize the DB client
await DB.init(dbServiceURL)

// initialize all DOM elements and event handlers 
DOM.init()
