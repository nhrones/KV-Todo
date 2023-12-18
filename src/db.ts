import { buildSelectElement } from './selectBuilder.ts'
import { DbClient } from './dbClient.ts'
import { refreshDisplay } from './tasks.ts'

const DBServiceURL = 'http://localhost:9099'
const thisDB = new DbClient(DBServiceURL)



/** an array of todo tasks to be presented */
export let tasks: { text: string, disabled: boolean }[] = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key
   if (key.length) {
      thisDB.get(["TODO", key]).then((data) => {
         if (data === null) {
            console.log(`No data found for ${keyName}`)
         }
         if (typeof data === 'string') {
            tasks = JSON.parse(data) || []
         } else {
            //@ts-ignore ?
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

   thisDB.get(["TODO", "topics"]).then((data) => {
      let parsedTopics
      if (typeof data === 'string') {
         parsedTopics = JSON.parse(data)
      } else {
         parsedTopics = data
      }
      if (parsedTopics != null) {
         for (let index = 0; index < parsedTopics.length; index++) {
            try {
               const options = JSON.parse(`${parsedTopics[index].text}`)
               buildSelectElement(options)
            } catch (_err) {
               console.log('error parsing: ', parsedTopics[index].text)
            }
         }
      } else {
         console.log(`No topics!`)
         // build a basic topic record and save it
         keyName = 'topics'
         tasks = [
            {
               text: `{"Todos": [{ "name": "App One", "value": "app1" }] }`,
               disabled: false
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
   thisDB.set(["TODO", keyName], value)
      .then((_result) => {
         thisDB.get(["TODO", keyName])
      })
}

/** 
 * Delete completed tasks
 */
export function deleteCompleted() {

   const savedtasks: { text: string, disabled: boolean }[] = []
   tasks.forEach((task) => {
      if (task.disabled === false) savedtasks.push(task)
   })
   tasks = savedtasks
   saveTasks()
}