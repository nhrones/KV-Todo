// deno-lint-ignore-file
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils.ts
var $ = /* @__PURE__ */ __name((id) => document.getElementById(id), "$");
var on = /* @__PURE__ */ __name((el, event, callback) => el.addEventListener(event, callback), "on");
function saveDataFile(fileName, content) {
  const a = document.createElement("a");
  a.href = "data:application/octet-stream," + encodeURIComponent(content);
  a.download = fileName;
  a.click();
}
__name(saveDataFile, "saveDataFile");

// src/selectBuilder.ts
function buildSelectElement(options) {
  const selectElement = $("topics");
  for (const prop in options) {
    if (options.hasOwnProperty(prop)) {
      addOptionGroup(selectElement, prop, options[prop]);
    }
  }
}
__name(buildSelectElement, "buildSelectElement");
function addOptionGroup(selectElement, label, options) {
  let len = options.length;
  let optionElement;
  let optionGroup = document.createElement("optgroup");
  optionGroup.label = label;
  for (let i = 0; i < len; ++i) {
    optionElement = document.createElement("option");
    optionElement.textContent = options[i].name;
    optionElement.value = options[i].value;
    optionGroup.appendChild(optionElement);
  }
  selectElement.appendChild(optionGroup);
  return optionGroup;
}
__name(addOptionGroup, "addOptionGroup");

// src/dbClient.ts
var nextMsgID = 0;
var DBServiceURL = "";
var transactions = /* @__PURE__ */ new Map();
var DbClient = class {
  constructor(serviceURL) {
    this.querySet = [];
    DBServiceURL = serviceURL.endsWith("/") ? serviceURL : serviceURL += "/";
  }
  /** initialize our EventSource and fetch some data */
  init() {
    return new Promise((resolve, reject) => {
      let connectAttemps = 0;
      console.log("CONNECTING");
      const eventSource = new EventSource(`${DBServiceURL}SSERPC/kvRegistration`);
      eventSource.addEventListener("open", () => {
        console.log("CONNECTED");
        resolve();
      });
      eventSource.addEventListener("error", (_e) => {
        switch (eventSource.readyState) {
          case EventSource.OPEN:
            console.log("CONNECTED");
            break;
          case EventSource.CONNECTING:
            console.log("CONNECTING");
            connectAttemps++;
            if (connectAttemps > 1) {
              eventSource.close();
              alert(`No Service!
Please start the DBservice!
See: readme.md.`);
            }
            console.log(`URL: ${window.location.href}`);
            break;
          case EventSource.CLOSED:
            console.log("DISCONNECTED");
            reject();
            break;
        }
      });
      eventSource.addEventListener("message", (evt) => {
        const parsed = JSON.parse(evt.data);
        const { txID, error, result } = parsed;
        if (!transactions.has(txID))
          return;
        const transaction = transactions.get(txID);
        transactions.delete(txID);
        if (transaction)
          transaction(error, result);
      });
    });
  }
  /**
   * fetch a querySet      
   */
  fetchQuerySet() {
    return new Promise((resolve, _reject) => {
      Call("GETALL", {}).then((result) => {
        if (typeof result === "string") {
          resolve(JSON.parse(result));
        } else {
          console.log("Ooopppps: ", typeof result);
        }
      });
    });
  }
  /**
   * get row from key
   */
  get(key) {
    const start = performance.now();
    console.log(`Get called with key = "${key}"`);
    return new Promise((resolve, _reject) => {
      Call("GET", { key }).then((result) => {
        console.info("GET result ", result);
        console.info(`GET call returned ${result} in ${performance.now() - start}`);
        if (typeof result.value === "string") {
          resolve(result.value);
        } else {
          resolve(JSON.stringify(result.value));
        }
      });
    });
  }
  /** 
   * The `set` method mutates - will call the `persist` method. 
   */
  set(key, value) {
    console.log(`dbClient set "${key}", ${value}`);
    return new Promise((resolve, _reject) => {
      Call("SET", { key, value }).then((result) => {
        console.info("SET call returned ", result);
        resolve(result);
      });
    });
  }
  /** 
   * The `delete` method mutates - will call the `persist` method. 
   */
  delete(key) {
    try {
      Call("DELETE", { key }).then((result) => {
        this.querySet = result.querySet;
        this.totalPages = result.totalPages;
        return this.querySet;
      });
    } catch (_e) {
      return { Error: _e };
    }
  }
};
__name(DbClient, "DbClient");
var Call = /* @__PURE__ */ __name((procedure, params) => {
  const txID = nextMsgID++;
  return new Promise((resolve, reject) => {
    transactions.set(txID, (error, result) => {
      if (error)
        return reject(new Error(error));
      resolve(result);
    });
    fetch(DBServiceURL + "SSERPC/kvRequest", {
      method: "POST",
      mode: "cors",
      body: JSON.stringify({ txID, procedure, params })
    });
  });
}, "Call");

// src/db.ts
var DBServiceURL2 = "http://localhost:9099";
var thisDB = new DbClient(DBServiceURL2);
var tasks = [];
var keyName = "topics";
function getTasks(key = "") {
  keyName = key;
  console.log("getTasks key = ", keyName);
  if (key.length) {
    thisDB.get(["TODO", key]).then((data) => {
      console.info(`data for ${key} = `, data);
      if (data === null) {
        console.log(`No data found for ${keyName}`);
      }
      if (typeof data === "string") {
        tasks = JSON.parse(data) || [];
      } else {
        tasks = data;
      }
      refreshDisplay();
    });
  }
}
__name(getTasks, "getTasks");
var buildTopics = /* @__PURE__ */ __name(() => {
  thisDB.get(["TODO", "topics"]).then((data) => {
    let parsedTopics;
    if (typeof data === "string") {
      console.log("data ", data);
      parsedTopics = JSON.parse(data);
    } else {
      parsedTopics = data;
    }
    console.info("parsedTopics ", parsedTopics);
    if (parsedTopics != null) {
      for (let index = 0; index < parsedTopics.length; index++) {
        try {
          const options = JSON.parse(`${parsedTopics[index].text}`);
          buildSelectElement(options);
        } catch (_err) {
          console.log("error parsing: ", parsedTopics[index].text);
        }
      }
    } else {
      console.log(`No topics!`);
      keyName = "topics";
      tasks = [
        {
          text: `{"Todos": [{ "name": "App One", "value": "app1" }] }`,
          disabled: false
        },
        {
          text: `{"Topics": [{ "name": "Todo App Topics", "value": "topics" }] }`,
          disabled: false
        }
      ];
      saveTasks();
      buildTopics();
    }
  });
}, "buildTopics");
function saveTasks() {
  const value = JSON.stringify(tasks, null, 2);
  console.log(`SaveTasks - setting "${keyName}" to ${value}`);
  thisDB.set(["TODO", keyName], value).then((_result) => {
    console.log(`saveTasks saved: ${value}`);
    thisDB.get(["TODO", keyName]).then((result) => {
      console.info(`get returned ${keyName} = `, result);
    });
  });
}
__name(saveTasks, "saveTasks");
function deleteCompleted() {
  const savedtasks = [];
  tasks.forEach((task) => {
    if (task.disabled === false)
      savedtasks.push(task);
  });
  tasks = savedtasks;
  saveTasks();
}
__name(deleteCompleted, "deleteCompleted");

// src/templates.ts
function taskTemplate(index, item) {
  const { disabled, text } = item;
  return `
   <div class="todo-container">
      <input type="checkbox" 
         id="checkbox-${index}" 
         class="todo-checkbox" 
         data-index=${index}
      ${disabled ? "checked" : ""}>
      <pre WIDTH="40"
         id="todo-${index}" 
         class="${disabled ? "disabled" : ""}" 
         data-index=${index}>${text}
      </pre>
   </div>
 `;
}
__name(taskTemplate, "taskTemplate");

// src/tasks.ts
function addTask() {
  const newTask = todoInput.value.trim();
  if (newTask !== "") {
    tasks.push({ text: newTask, disabled: false });
    saveTasks();
    todoInput.value = "";
    todoInput.focus();
    refreshDisplay();
  }
}
__name(addTask, "addTask");
function refreshDisplay() {
  todoList.innerHTML = "";
  tasks.forEach((item, index) => {
    const p = document.createElement("p");
    p.innerHTML = taskTemplate(index, item);
    on(p, "click", (e) => {
      if (e.target.type === "checkbox")
        return;
      if (e.target.type === "textarea")
        return;
      const todoItem = e.target;
      const existingText = tasks[index].text;
      const editElement = document.createElement("textarea");
      editElement.setAttribute("rows", "6");
      editElement.setAttribute("cols", "62");
      editElement.setAttribute("wrap", "hard");
      editElement.setAttribute("autocorrect", "on");
      editElement.value = existingText;
      todoItem.replaceWith(editElement);
      editElement.focus();
      on(editElement, "blur", function() {
        const updatedText = editElement.value.trim();
        if (updatedText.length > 0) {
          tasks[index].text = updatedText;
          saveTasks();
        }
        refreshDisplay();
      });
    });
    on(p.querySelector(".todo-checkbox"), "change", (e) => {
      e.preventDefault();
      const index2 = e.target.dataset.index;
      tasks[index2].disabled = !tasks[index2].disabled;
      saveTasks();
    });
    todoList.appendChild(p);
  });
  todoCount.textContent = "" + tasks.length;
}
__name(refreshDisplay, "refreshDisplay");

// src/export.ts
function exportData() {
  const data = Object.assign({}, localStorage);
  let content = "";
  for (const element in data) {
    content += formatData(data[element], element);
    console.log(content);
  }
  ;
  saveDataFile("data-dump.txt", content);
}
__name(exportData, "exportData");
function formatData(jsonValue, element) {
  const parsedValue = JSON.parse(jsonValue);
  const len = parsedValue.length;
  let dataString = `
${element}:`;
  for (let i = 0; i < len; i++) {
    dataString += `
   ${JSON.parse(jsonValue)[i].text}`;
  }
  return dataString;
}
__name(formatData, "formatData");

// src/dom.ts
var backupbtn = $("backupbtn");
var todoInput = $("todoInput");
var todoCount = $("todoCount");
var todoList = $("todoList");
var deleteCompletedBtn = $("deletecompleted");
var topicSelect = $("topics");
var closebtn = $("closebtn");
var currentTopic = "";
function init(topic) {
  currentTopic = topic;
  buildTopics();
  getTasks(currentTopic);
  on(todoInput, "keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask();
    }
  });
  on(deleteCompletedBtn, "click", () => {
    deleteCompleted();
    refreshDisplay();
  });
  on(topicSelect, "change", () => {
    currentTopic = topicSelect.value.toLowerCase();
    console.log(`topicSelect change `, currentTopic);
    getTasks(currentTopic);
  });
  on(closebtn, "click", () => {
    console.log(`closebtn ${location.href}`);
    window.open(location.href, "_self", "");
    self.close();
  });
  on(backupbtn, "click", () => {
    exportData();
  });
  refreshDisplay();
}
__name(init, "init");

// src/main.ts
var RunningLocal = window.location.href === "http://localhost:8080/";
console.log(`RunningLocal`, RunningLocal);
var dbServiceURL = RunningLocal ? "http://localhost:9099" : "https://bueno-rpc.deno.dev/";
var thisDB2 = new DbClient(dbServiceURL);
await thisDB2.init();
init();
