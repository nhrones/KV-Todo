// deno-lint-ignore-file no-explicit-any
import { addTask, refreshDisplay } from './tasks.ts'
import { buildTopics, deleteCompleted, getTasks } from './db.ts';
import { exportData } from './export.ts'
import { $, on } from './utils.ts'

/* create references for all UI elements */
export const backupbtn = $("backupbtn") as HTMLButtonElement;
export const todoInput = $("todoInput") as HTMLInputElement;
export const todoCount = $("todoCount") as HTMLElement;
export const todoList = $("todoList") as HTMLElement;
export const deleteCompletedBtn = $("deletecompleted") as HTMLElement;
export const topicSelect = $('topics') as HTMLSelectElement;
export const closebtn = $('closebtn') as HTMLButtonElement;

// topic name
let currentTopic = ""

/**
 * initialize all UI and event handlers    
 * called once on start up
 * @param {string} topic the topic name (data-key) 
 */
export function init(topic: string) {
   currentTopic = topic
   // assemble the topics drop-down UI
   buildTopics()

   // get all stored tasks for this topic
   getTasks(currentTopic)

   // todo input keydown handler
   on(todoInput, "keydown", function (event: any) {
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
