// deno-lint-ignore-file no-explicit-any

//let LOCAL_DEV = false
//==========================================
//  uncomment below to run a local service
//LOCAL_DEV = true
//  otherwise, run the Deno-Deploy service
//==========================================
 
let nextMsgID = 0;
let DBServiceURL = ''
const transactions = new Map();

/**
 * This db client communicates with an RPC service.    
 */
export class DbClient {
   client = 'unknown'
   querySet = []

   constructor(serviceURL: string, client = "todo") {
      this.client = client
      //fix url ending
      DBServiceURL = (serviceURL.endsWith('/'))
         ? serviceURL
         : serviceURL += '/';
   }
   /** initialize our EventSource and fetch some data */
   init():Promise<void> {
      return new Promise((resolve, reject) => {
         let connectAttemps = 0
         console.log("CONNECTING");

         const eventSource = new EventSource(`${DBServiceURL}SSERPC/kvRegistration?client=${this.client}`);

         eventSource.addEventListener("open", () => {
            console.log("CONNECTED");
            resolve()
         });

         eventSource.addEventListener("error", (_e) => {
            switch (eventSource.readyState) {
               case EventSource.OPEN:
                  console.log("CONNECTED");
                  break;
               case EventSource.CONNECTING:
                  console.log("CONNECTING");
                  connectAttemps++
                  if (connectAttemps > 1) {
                     eventSource.close()
                     alert(`No Service!
Please start the DBservice!
See: readme.md.`)
                  }
                  console.log(`URL: ${window.location.href}`)
                  break;
               case EventSource.CLOSED:
                  console.log("DISCONNECTED");
                  reject()
                  break;
            }
         });

         /* 
         When we get a message from the service we expect 
         an object containing {msgID, error, and result}.
         We then find the transaction that was registered for this msgID, 
         and execute it with the error and result properities.
         This will resolve or reject the promise that was
         returned to the client when the transaction was created.
         */
         eventSource.addEventListener("message", (evt) => {
            const parsed = JSON.parse(evt.data);
            const { txID, error, result } = parsed;         // unpack
            if (!transactions.has(txID)) return             // check        
            const transaction = transactions.get(txID)      // fetch
            transactions.delete(txID)                       // clean up
            if (transaction) transaction(error, result)     // execute
         })
      })
   }

   /**
    * fetch a querySet      
    */
   fetchQuerySet() {
      return new Promise((resolve, _reject) => {
         Call("GETALL", {})
            .then((result) => {
               if (typeof result === "string") {
                  resolve(JSON.parse(result))
               } else {
                  console.log('Ooopppps: ', typeof result)
               }
            })
      })
   }

   /**
    * get row from key
    */
   get(key: any) {
      const start = performance.now()
      console.log(`Get called with key = "${key}"`)
      return new Promise((resolve, _reject) => {
         // persist single record to the service
         Call("GET", { key: key })
            .then((result) => {
               console.info('GET result ',result)
               console.info(`GET call returned ${result} in ${performance.now() - start}`)
               //@ts-ignore ?
               if (typeof result.value === "string") {
                  //@ts-ignore ?
                  resolve(result.value)
               } else {
                  //@ts-ignore ?
                  resolve(JSON.stringify(result.value))
               }
            })
      })
   }

   /** 
    * The `set` method mutates - will call the `persist` method. 
    */
   set(key: any, value: any) {
      console.log(`dbClient set "${key}", ${value}`)
      return new Promise((resolve, _reject) => {
         // persist single record to the service
         Call("SET", { key: key, value: value })
            .then((result) => {
               console.info('SET call returned ', result)
               resolve(result)
            })
      })
   }

   /** 
    * The `delete` method mutates - will call the `persist` method. 
    */
   delete(key: any) {
      try {
         Call("DELETE", { key: key })
            .then((result) => {
               //@ts-ignore ?
               this.querySet = result.querySet
               //@ts-ignore ?
               this.totalPages = result.totalPages
               return this.querySet
            })
      } catch (_e) {
         return { Error: _e }
      }
   }

} // End class

/** 
 * Make an Asynchronous Remote Proceedure Call
 *  
 * @param {key extends keyof TypedProcedures} procedure - the name of the remote procedure to be called
 * @param {TypedProcedures[key]} params - appropriately typed parameters for this procedure
 * 
 * @returns {Promise} - Promise object has a transaction that is stored by ID    
 *   in a transactions Set.   
 *   When this promise resolves or rejects, the transaction is retrieved by ID    
 *   and executed by the promise. 
 */
export const Call = (procedure: any, params: any) => {

   const txID = nextMsgID++;

   //console.log(`RPC msg ${txID} called ${procedure} with ${JSON.stringify(params)}`);

   return new Promise((resolve, reject) => {
      transactions.set(txID, (error: any, result: any) => {
         if (error)
            return reject(new Error(error));
         resolve(result);
      });
      fetch(DBServiceURL + 'SSERPC/kvRequest', {
         method: "POST",
         mode: 'cors',
         body: JSON.stringify({ txID, procedure, params })
      });
   });
};
