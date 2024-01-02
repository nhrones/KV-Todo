import { buildSelectElement } from './selectBuilder.ts'
import { DbClient } from './deps.ts'
import { refreshDisplay } from './tasks.ts'

// db
let thisDB: DbClient

export async function init(dbServiceURL: string) {
   thisDB = new DbClient(dbServiceURL, "KV", "todo")
   await thisDB.init()
}

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

const parseTopics = (topics: string) => {
   const parsedTopics = JSON.parse(topics)
   console.info('parsedTopics', parsedTopics)
   // need to parse text: to 
   return parsedTopics
}

/**
 * build a set of select options
 */
export const buildTopics = () => {

   thisDB.get(["TODO", "topics"]).then((data: unknown) => {

      const parsedTopics = JSON.parse(data as string)

      //const parsedTopics = parseTopics(data as string) //JSON.parse(data as string)

      if (parsedTopics != null) {
         for (let index = 0; index < parsedTopics.length; index++) {
            try {
               const options = JSON.parse(`${parsedTopics[index].text}`)
               console.info('options ', options)
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
               text: `{"Todos": [{ "title": "App One", "key": "app1" }] }`,
               disabled: false
            },
            {
               text: `{"Topics": [{ "title": "Todo App Topics", "key": "topics" }] }`,
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
   const value = JSON.stringify(tasks, null, 2);
   console.log(`SaveTasks - setting "${keyName}" to ${value}`);
   thisDB.set(["TODO", keyName], value)
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