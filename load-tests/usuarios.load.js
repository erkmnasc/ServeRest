import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// ATENÇÃO: este script gera carga real. Rode SOMENTE contra um backend local
// (`npm run serverest:local` ou Docker) — nunca contra https://serverest.dev,
// que é uma instância pública e compartilhada; carga artificial degradaria o
// serviço para outras pessoas.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  scenarios: {
    usuarios_crud: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '30s', target: 20 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
}

const errorRate = new Rate('errors')

const buildUser = () => ({
  nome: `Usuário Carga ${__VU}-${__ITER}`,
  email: `k6.usuarios.${Date.now()}.${__VU}.${__ITER}@qa.serverest.dev`,
  password: 'senhaTeste123',
  administrador: 'false',
})

export default function () {
  const createRes = http.post(`${BASE_URL}/usuarios`, JSON.stringify(buildUser()), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /usuarios' },
  })

  const created = check(createRes, { 'POST /usuarios -> 201': (r) => r.status === 201 })
  errorRate.add(!created)

  if (created) {
    const userId = createRes.json('_id')

    const getRes = http.get(`${BASE_URL}/usuarios/${userId}`, {
      tags: { name: 'GET /usuarios/{id}' },
    })
    errorRate.add(!check(getRes, { 'GET /usuarios/{id} -> 200': (r) => r.status === 200 }))

    // Cleanup na própria iteração: evita crescer indefinidamente a base local
    const deleteRes = http.del(`${BASE_URL}/usuarios/${userId}`, null, {
      tags: { name: 'DELETE /usuarios/{id}' },
    })
    errorRate.add(!check(deleteRes, { 'DELETE /usuarios/{id} -> 200': (r) => r.status === 200 }))
  }

  sleep(1)
}
