import { buildSelectElement } from './selectBuilder.js'
import { DbClient } from './dbClient.js'

const DBServiceURL = 'http://localhost:9099'
const thisDB = new DbClient(DBServiceURL)



/** an array of todo tasks to be presented */
export let tasks = []

/** the name of a data-key */
let keyName = 'topics'

/**
 * Retrieve array of tasks from local storage     
 * or initialize an empty task array 
 * @param {string} key the name of the record to fetch (data-key)
 */
export function getTasks(key = "") {
   keyName = key
   if (key.length) {
      thisDB.get([key]).then((data) => {
         console.info(`data for ${key} = `, data)
         if (typeof data === 'string') {
            tasks = JSON.parse(raw) || []
         } else {
            tasks = data
         }
      })
   }
}

/**
 * build a set of select options
 */
export const buildTopics = (raw) => {

   thisDB.get(['topics']).then((data) => {
      let parsedTopics
      if (typeof data === 'string') {
         parsedTopics = JSON.parse(raw)
      } else {
         parsedTopics = data
      }
      console.info('parsedTopics ', parsedTopics)
      for (let index = 0; index < parsedTopics.length; index++) {
         const options = JSON.parse(`${parsedTopics[index].text}`)
         buildSelectElement(options)
      }
   })
}

/**
 * Save all tasks to local storage
 */
export function saveTasks() {
   //localStorage.setItem(keyName, JSON.stringify(tasks, null, 2));
   thisDB.set([keyName], JSON.stringify(tasks, null, 2)).then((result) => {
      console.info('save ', result)
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