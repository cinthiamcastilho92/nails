import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const password = process.argv[2]
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs <password>')
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const hash = await scryptAsync(password, salt, 64)
const result = `${salt}:${hash.toString('hex')}`

console.log('\n✓ Copia este valor para o .env.local:\n')
console.log(`APP_PASSWORD_HASH=${result}`)
console.log('\n(Remove ou deixa APP_PASSWORD vazio depois)')
