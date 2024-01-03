// deno-lint-ignore-file no-explicit-any
import { saveDataFile } from './utils.ts'
import { fetchAll } from './db.ts'
/**
 * export data from persitence
 * @returns void - calls saveDataFile()
 */
export async function exportData() {
   const data: unknown = await fetchAll()
   console.info('todo export data: ', data)

   let content = ''
   if (Array.isArray(data)) {
      for (let index = 0; index < data.length; index++) {
         const element = data[index];
         content += `${element[0][1]}
`;
         for (let i = 0; i < element.length; i++) {
            //TODO -- broke -- fix it
            content += ` ${i}   ${JSON.parse(element[1])[0].text}
`;
         }
      };
   }
   saveDataFile('data-dump.txt', content)
}

/**
 * format k/v record for export
 * @param {string} jsonValue 
 * @param {string} element 
 * @returns a formated string 
 */
function formatData(jsonValue: any, element: any) {
   const parsedValue = JSON.parse(jsonValue)
   const len = parsedValue.length
   let dataString = `
${element}:`
   for (let i = 0; i < len; i++) {
      dataString += `
   ${JSON.parse(jsonValue)[i].text}`
   }
   return dataString
}

