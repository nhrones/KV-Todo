import { addTask, refreshDisplay } from './tasks.js'
import { buildTopics, deleteCompleted, getTasks } from './db.js';
import { exportData } from './export.js'
import { $, on } from './utils.js'

/* create references for all UI elements */
export const backupbtn = $("backupbtn");
export const todoInput = $("todoInput");
export const todoCount = $("todoCount");
export const todoList = $("todoList");
export const deleteCompletedBtn = $("deletecompleted");
export const topicSelect = $('topics');
export const closebtn = $('closebtn')

// topic name
let currentTopic = ""

/**
 * initialize all UI and event handlers    
 * called once on start up
 * @param {string} topic the topic name (data-key) 
 */
export function init(topic) {
   currentTopic = topic
   // assemble the topics drop-down UI
   buildTopics()

   // get all stored tasks for this topic
   getTasks(currentTopic)

   // todo input keydown handler
   on(todoInput, "keydown", function (event) {
      if (event.key === "Enter") {
         event.preventDefault();
         addTask();
      }
   })

   // delete completed button click handler
   on(deleteCompletedBtn, "click", () => {
      deleteCompleted()
      refreshDisplay();
   });

   // topic select change handler
   on(topicSelect, 'change', () => {
      currentTopic = topicSelect.value.toLowerCase() 
      console.log(`topicSelect change `, currentTopic)
      getTasks(currentTopic)
   }) 

   // close button click handler
   on(closebtn, 'click', () => {
      console.log(`closebtn ${location.href}`)
      window.open(location.href, "_self", "");
      self.close()
   })

   // backup button click handler
   on(backupbtn, 'click', () => {
      exportData()
   })

   // initial display refresh
   refreshDisplay();
}
