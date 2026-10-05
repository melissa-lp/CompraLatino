import sql from './db.js'

const result = await sql`select now()`
console.log(result)
await sql.end()