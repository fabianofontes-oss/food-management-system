#!/usr/bin/env node
/**
 * BILLING ENFORCEMENT VERIFIER
 * Verifica se o billing enforcement está funcionando via HTTP headers
 * 
 * Uso: node scripts/verify-billing.mjs
 */

const BASES = [
  'https://app.pediu.food',
  'https://www.pediu.food'
];

const SCENARIOS = [
  { slug: 'test-active', expected: { mode: 'ALLOW', redirect: null } },
  { slug: 'test-trial-expired', expected: { mode: 'BLOCK', redirect: '/billing/trial-expired' } },
  { slug: 'test-past-due', expected: { mode: 'READ_ONLY', redirect: null } },
  { slug: 'test-suspended', expected: { mode: 'BLOCK', redirect: '/billing/suspended' } },
];

async function checkUrl(base, slug, expected) {
  const url = `${base}/${slug}/dashboard`;
  const result = {
    url,
    status: null,
    location: null,
    billingMode: null,
    billingReason: null,
    graceDays: null,
    verdict: 'UNKNOWN',
    error: null
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BillingVerifier/1.0'
      }
    });

    clearTimeout(timeout);

    result.status = response.status;
    result.location = response.headers.get('location');
    result.billingMode = response.headers.get('x-billing-mode');
    result.billingReason = response.headers.get('x-billing-reason');
    result.graceDays = response.headers.get('x-billing-grace-days');

    // Analisar resultado
    const isRedirect = response.status >= 300 && response.status < 400;
    const redirectsToLogin = result.location?.includes('/login') || result.location?.includes('/unauthorized');
    const redirectsToBilling = result.location?.includes('/billing/');

    if (redirectsToLogin) {
      result.verdict = 'AUTH_BLOCKED';
    } else if (expected.redirect) {
      // Esperava redirect para billing
      if (redirectsToBilling && result.location?.includes(expected.redirect)) {
        result.verdict = 'OK';
      } else if (redirectsToBilling) {
        result.verdict = 'REDIRECT_WRONG_TARGET';
      } else if (isRedirect) {
        result.verdict = 'REDIRECT_UNEXPECTED';
      } else {
        result.verdict = 'EXPECTED_REDIRECT_NOT_FOUND';
      }
    } else {
      // Não esperava redirect
      if (isRedirect) {
        if (redirectsToLogin) {
          result.verdict = 'AUTH_BLOCKED';
        } else {
          result.verdict = 'UNEXPECTED_REDIRECT';
        }
      } else if (response.status === 200) {
        result.verdict = 'OK';
      } else {
        result.verdict = 'UNEXPECTED_STATUS';
      }
    }

  } catch (error) {
    result.error = error.message;
    result.verdict = 'ERROR';
  }

  return result;
}

async function main() {
  console.log('========================================');
  console.log('BILLING ENFORCEMENT VERIFIER');
  console.log('Data:', new Date().toISOString());
  console.log('========================================\n');

  const results = [];

  for (const base of BASES) {
    console.log(`\n--- BASE: ${base} ---\n`);

    for (const scenario of SCENARIOS) {
      const result = await checkUrl(base, scenario.slug, scenario.expected);
      results.push({ base, scenario: scenario.slug, ...result });

      console.log(`[${scenario.slug}]`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Location: ${result.location || '-'}`);
      console.log(`  x-billing-mode: ${result.billingMode || '-'}`);
      console.log(`  x-billing-reason: ${result.billingReason || '-'}`);
      console.log(`  x-billing-grace-days: ${result.graceDays || '-'}`);
      console.log(`  VERDICT: ${result.verdict}`);
      if (result.error) console.log(`  ERROR: ${result.error}`);
      console.log('');
    }
  }

  // Resumo
  console.log('\n========================================');
  console.log('RESUMO');
  console.log('========================================\n');

  const ok = results.filter(r => r.verdict === 'OK').length;
  const authBlocked = results.filter(r => r.verdict === 'AUTH_BLOCKED').length;
  const failed = results.filter(r => !['OK', 'AUTH_BLOCKED'].includes(r.verdict)).length;

  console.log(`Total testes: ${results.length}`);
  console.log(`OK: ${ok}`);
  console.log(`AUTH_BLOCKED (precisa login): ${authBlocked}`);
  console.log(`FAILED: ${failed}`);

  if (authBlocked > 0) {
    console.log('\n⚠️  Alguns testes retornaram AUTH_BLOCKED.');
    console.log('    Isso significa que o usuário precisa estar logado.');
    console.log('    Para validar completamente, faça login no navegador e teste manualmente.');
  }

  if (failed > 0) {
    console.log('\n❌ Alguns testes falharam. Verifique os detalhes acima.');
    process.exit(1);
  }

  console.log('\n✅ Verificação concluída.');
}

main().catch(console.error);
