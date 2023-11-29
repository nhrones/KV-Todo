import { init } from './dom.js'
import { DbClient } from './dbClient.js'

const thisDB = new DbClient('http://localhost:9099')

await thisDB.init()

// initialize all DOM elements, all event handlers 
init()
