import { buildSelectElement } from './selectBuilder.js'
import { DbClient } from './dbClient.js'
import { refreshDisplay } from './tasks.js'

const DBServiceURL = 'http://localhost:9099'
const thisDB = new DbClient(DBServiceURL)



/** an array of todo tasks to be presented */
export let tasks = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key




   console.log('getTasks key = ', keyName)
   if (key.length) {
      thisDB.get([key]).then((data) => {
         console.info(`data for ${key} = `, data)
         if (data === null) {
            console.log(`No data found for ${keyName}`)
         }
         if (typeof data === 'string') {
            tasks = JSON.parse(data) || []
         } else {
            tasks = data
         }
         refreshDisplay();
      })
   }
}

/**
 * build a set of select options
 */
export const buildTopics = () => {

   thisDB.get(['topics']).then((data) => {
      let parsedTopics
      if (typeof data === 'string') {
         console.log('data ', data)
         parsedTopics = JSON.parse(data)
      } else {
         parsedTopics = data
      }
      console.info('parsedTopics ', parsedTopics)
      if (parsedTopics != null) {
         for (let index = 0; index < parsedTopics.length; index++) {
            const options = JSON.parse(`${parsedTopics[index].text}`)
            buildSelectElement(options)
         }
      } else {
         console.log(`No topics!`)
         // build a basic topic record and save it
         keyName = 'topics'
         tasks = [
            { 
               text: `{"Todos": [{ "name": "App One", "value": "app1" }] }`
            },
            {
               text: `{"Topics": [{ "name": "Todo App Topics", "value": "topics" }] }`,
               disabled: false
            }
         ]
         saveTasks()
         buildTopics()
      }
   })
}

/**
 * Save all tasks to local storage
 */
export function saveTasks() {
   const value = JSON.stringify(tasks, null, 2)
   console.log(`SaveTasks - setting "${keyName}" to ${value}`)
   thisDB.set([keyName], value)
      .then((_result) => {
         console.log(`saveTasks saved: ${value}`)
         thisDB.get([keyName]).then((result) => {
            console.info(`get returned ${keyName} = `, result)
         })
      })
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {
   const savedtasks = []
   tasks.forEach((task) => {
      if (task.disabled === false) savedtasks.push(task)
   })
   tasks = savedtasks
   saveTasks()
}