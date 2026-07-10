import http from 'k6/http'
import { check, sleep } from 'k6'

// ATENÇÃO: este script gera carga real. Rode SOMENTE contra um backend local
// (`npm run serverest:local` ou Docker) — nunca contra https://serverest.dev,
// que é uma instância pública e compartilhada; carga artificial degradaria o
// serviço para outras pessoas.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const POOL_SIZE = 20

export const options = {
  scenarios: {
    login_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 15 },
        { duration: '30s', target: 15 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
}

// setup() roda uma vez, fora dos VUs: cria a massa de usuários que o teste vai autenticar,
// já que login em produção é feito contra contas existentes, não recém-criadas por VU.
export function setup() {
  const users = []

  for (let i = 0; i < POOL_SIZE; i++) {
    const user = {
      nome: `Usuário Login Carga ${i}`,
      email: `k6.login.${Date.now()}.${i}@qa.serverest.dev`,
      password: 'senhaTeste123',
      administrador: 'false',
    }

    const res = http.post(`${BASE_URL}/usuarios`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
    })

    if (res.status === 201) {
      users.push({ ...user, id: res.json('_id') })
    }
  }

  return { users }
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)]

  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST /login' } },
  )

  check(res, {
    'POST /login -> 200': (r) => r.status === 200,
    'retorna token Bearer': (r) => /^Bearer .+/.test(r.json('authorization') || ''),
  })

  sleep(1)
}

export function teardown(data) {
  data.users.forEach((user) => {
    http.del(`${BASE_URL}/usuarios/${user.id}`)
  })
}
