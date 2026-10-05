import { readdir } from 'node:fs/promises'
import sql from './db.js'

const files = (await readdir(new URL('./sql/', import.meta.url))).filter((f) => f.endsWith('.sql')).sort()

for (const file of files) {
  console.log(`Ejecutando ${file}...`)
  await sql.file(new URL(`./sql/${file}`, import.meta.url).pathname)
}

console.log('Migraciones completadas')
await sql.end()
