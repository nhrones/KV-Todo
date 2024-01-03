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
  const len = options.length;
  let optionElement;
  const optionGroup = document.createElement("optgroup");
  optionGroup.label = label;
  for (let i = 0; i < len; ++i) {
    optionElement = document.createElement("option");
    optionElement.textContent = options[i].title;
    optionElement.value = options[i].key;
    optionGroup.appendChild(optionElement);
  }
  selectElement.appendChild(optionGroup);
  return optionGroup;
}
__name(addOptionGroup, "addOptionGroup");

// https://raw.githubusercontent.com/nhrones/BuenoRPC-Client/main/context.ts
var CTX = {
  DEBUG: false,
  DBServiceURL: "",
  registrationURL: "",
  requestURL: ""
};

// https://raw.githubusercontent.com/nhrones/BuenoRPC-Client/main/dbClient.ts
var { DBServiceURL, DEBUG, registrationURL, requestURL } = CTX;
var nextTxID = 0;
var transactions = /* @__PURE__ */ new Map();
var DbClient = class {
  /**
   * Creates a new DBClient instance
   * @param serviceURL - the url for the RPC service
   * @param serviceType - the type of service to register for
   */
  constructor(serviceURL, serviceType, client = "unknown") {
    this.querySet = [];
    DBServiceURL = serviceURL.endsWith("/") ? serviceURL : serviceURL += "/";
    switch (serviceType) {
      case "IO":
        registrationURL = DBServiceURL + `SSERPC/ioRegistration?client=${client}`, requestURL = DBServiceURL + "SSERPC/ioRequest";
        break;
      case "KV":
        registrationURL = DBServiceURL + `SSERPC/kvRegistration?client=${client}`, requestURL = DBServiceURL + "SSERPC/kvRequest";
        break;
      case "RELAY":
        registrationURL = DBServiceURL + `SSERPC/relayRegistration?client=${client}`, requestURL = DBServiceURL + "SSERPC/relayRequest";
        break;
      default:
        break;
    }
  }
  /** 
   * initialize our EventSource and fetch initial data 
   * */
  init() {
    return new Promise((resolve, reject) => {
      let connectAttemps = 0;
      console.log("CONNECTING");
      const eventSource = new EventSource(registrationURL);
      eventSource.onopen = () => {
        console.log("CONNECTED");
        resolve();
      };
      eventSource.onerror = (_e) => {
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
      };
      eventSource.onmessage = (evt) => {
        if (DEBUG)
          console.info("events.onmessage - ", evt.data);
        const parsed = JSON.parse(evt.data);
        const { txID, error, result } = parsed;
        if (!transactions.has(txID))
          return;
        const transaction = transactions.get(txID);
        transactions.delete(txID);
        if (transaction)
          transaction(error, result);
      };
    });
  }
  /**
   * fetch a querySet      
   */
  fetchQuerySet() {
    return new Promise((resolve, _reject) => {
      rpcRequest("GETALL", {}).then((result) => {
        if (typeof result === "string") {
          resolve(JSON.parse(result));
        } else {
          console.log("Ooopppps: ", typeof result);
        }
      });
    });
  }
  // /**
  //  * get row from key
  //  */
  // get(key: string) {
  //    for (let index = 0; index < this.querySet.length; index++) {
  //       const element = this.querySet[index];
  //       //@ts-ignore ?
  //       if (element.id === key) return element
  //    }
  // }
  /**
   * get row from key
   */
  get(key) {
    const start = performance.now();
    console.info(`Get called with key = `, key);
    return new Promise((resolve, _reject) => {
      rpcRequest("GET", { key }).then((result) => {
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
    console.log(`set call key = `, key);
    try {
      rpcRequest(
        "SET",
        {
          key,
          value,
          //@ts-ignore ?
          currentPage: this.currentPage,
          //@ts-ignore ?
          rowsPerPage: this.rowsPerPage
        }
      ).then((result) => {
        console.info("SET call returned ", result.querySet);
        this.querySet = result.querySet;
        return this.querySet;
      });
    } catch (e) {
      return { Error: e };
    }
  }
  /** 
   * The `delete` method mutates - will call the `persist` method. 
   */
  delete(key) {
    try {
      rpcRequest("DELETE", { key }).then((result) => {
        this.querySet = result.querySet;
        this.totalPages = result.totalPages;
        return this.querySet;
      });
    } catch (_e) {
      return { Error: _e };
    }
  }
  /** 
   * The `clearAll` method removes all records from the DB. 
   */
  async clearAll() {
    try {
      await rpcRequest("CLEARALL", { key: [""] });
    } catch (_e) {
      return { Error: _e };
    }
  }
};
__name(DbClient, "DbClient");
var rpcRequest = /* @__PURE__ */ __name((procedure, params) => {
  const thisID = nextTxID++;
  return new Promise((resolve, reject) => {
    transactions.set(thisID, (error, result) => {
      if (error)
        return reject(new Error(error));
      resolve(result);
    });
    fetch(requestURL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ txID: thisID, procedure, params })
    });
  });
}, "rpcRequest");

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
function init() {
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

// src/db.ts
var thisDB;
async function init2(dbServiceURL2) {
  thisDB = new DbClient(dbServiceURL2, "KV", "todo");
  await thisDB.init();
}
__name(init2, "init");
var tasks = [];
var keyName = "topics";
function getTasks(key = "") {
  keyName = key;
  if (key.length) {
    thisDB.get(["todo", key]).then((data) => {
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
var parseTopics = /* @__PURE__ */ __name((topics) => {
  const parsedTopics = JSON.parse(topics);
  for (let index = 0; index < parsedTopics.length; index++) {
    const thisTopic = parsedTopics[index];
    const txt = thisTopic.text;
    const lines = txt.split("\n");
    const topic = lines[0].trim();
    let newText = `{"${topic}":[`;
    for (let i = 1; i < lines.length; i++) {
      const element = lines[i];
      const items = element.split(",");
      const title = items[0];
      const keyName2 = items[1].split("=")[1].trim();
      newText += `{ "title": "${title}", "key": "${keyName2}" },`;
    }
    newText = newText.substring(0, newText.length - 1) + `] }`;
    parsedTopics[index].text = newText;
  }
  return parsedTopics;
}, "parseTopics");
var buildTopics = /* @__PURE__ */ __name(() => {
  thisDB.get(["todo", "topics"]).then((data) => {
    const parsedTopics = parseTopics(data);
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
          text: `{"Todos": [{ "title": "App One", "key": "app1" }] }`,
          disabled: false
        },
        {
          text: `{"Topics": [{ "title": "Todo App Topics", "key": "topics" }] }`,
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
  thisDB.set(["todo", keyName], value);
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

// src/main.ts
var RunningLocal = false;
console.log(`RunningLocal`, RunningLocal);
var dbServiceURL = RunningLocal ? "http://localhost:9099" : "https://todo-rpc.deno.dev/";
await init2(dbServiceURL);
init();
