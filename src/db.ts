import { buildSelectElement } from './selectBuilder.ts'
import { DbClient } from './deps.ts'
import { refreshDisplay } from './tasks.ts'

// db
let thisDB: DbClient

export async function init(dbServiceURL: string) {
   thisDB = new DbClient(dbServiceURL, "KV", "todo")
   await thisDB.init()
}

// fetch all todo data
export async function fetchAll() {
   let queryset = await thisDB.fetchQuerySet()
   if (queryset === null) {
      console.log(`No data found for todos!`)
   }
   if (typeof queryset === 'string') {
      queryset = JSON.parse(queryset) || []
   }
   return queryset
}



/** an array of todo tasks to be presented */
export let tasks: { text: string, disabled: boolean }[] = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks from the service     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key
   if (key.length) {
      thisDB.get(["todo", key]).then((data) => {
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
 * parseTopics
 * @param topics 
 * @returns 
 */
const parseTopics = (topics: string) => {

   console.log(`topics: ${topics}`)
   const parsedTopics = JSON.parse(topics)
   console.info('parsedTopics ',parsedTopics)
   for (let index = 0; index < parsedTopics.length; index++) {
      const thisTopic = parsedTopics[index]
      const txt = thisTopic.text as string

      const lines = txt.split('\n')
      const topic = lines[0].trim()
      let newText = `{"${topic}":[`
      for (let i = 1; i < lines.length; i++) {
         const element = lines[i];
         const items = element.split(',')
         const title = items[0]
         const keyName = items[1].split('=')[1].trim()
         newText += `{ "title": "${title}", "key": "${keyName}" },`
      }
      newText = newText.substring(0, newText.length - 1) + `] }`
      parsedTopics[index].text = newText
   }
   return parsedTopics
}

/**
 * build a set of select options
 */
export const buildTopics = () => {
   thisDB.get(["todo", "topics"]).then((data: unknown) => {
      const parsedTopics = parseTopics(data as string)//JSON.parse(data as string)
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
   thisDB.set(["todo", keyName], value)
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