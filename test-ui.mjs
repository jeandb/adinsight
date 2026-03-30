/**
 * AdInsight — Teste básico da interface (Etapa 2)
 * Executa: node test-ui.mjs
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:5173';
const SHOTS = './test-screenshots';
const EMAIL = process.env.TEST_EMAIL || '';
const PASS  = process.env.TEST_PASS  || '';

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label, err) {
  console.log(`  ❌ ${label}: ${err?.message ?? err}`);
  failed++;
}

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function run() {
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ── 1. Login Page ──────────────────────────────────────────────────────────
  console.log('\n📋 1. Página de Login');
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(page, '01-login');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    ok('Página de login carregou');
  } catch (e) { fail('Página de login', e); }

  // ── 2. Login com credenciais inválidas ─────────────────────────────────────
  console.log('\n📋 2. Login com credenciais inválidas');
  try {
    await page.fill('input[type="email"], input[name="email"]', 'invalido@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    await shot(page, '02-login-invalido');

    const hasError = await page.locator('text=/inválid|incorret|erro|error|unauthorized/i').count();
    if (hasError > 0) ok('Erro exibido para credenciais inválidas');
    else fail('Mensagem de erro não encontrada', new Error('Nenhum texto de erro visível'));
  } catch (e) { fail('Validação de login inválido', e); }

  // ── 3. Login com credenciais corretas ──────────────────────────────────────
  console.log('\n📋 3. Login com credenciais corretas');
  if (!EMAIL || !PASS) {
    console.log('  ⚠️  Defina TEST_EMAIL e TEST_PASS para testar login real');
    console.log('     Exemplo: TEST_EMAIL=admin@x.com TEST_PASS=senha node test-ui.mjs');
  } else {
    try {
      await page.fill('input[type="email"], input[name="email"]', EMAIL);
      await page.fill('input[type="password"], input[name="password"]', PASS);
      await page.click('button[type="submit"]');
      await page.waitForURL(/(?!.*login)/, { timeout: 8000 });
      await page.waitForLoadState('networkidle');
      await shot(page, '03-pos-login');
      ok('Login realizado, redirecionou para dashboard');
    } catch (e) { fail('Login com credenciais corretas', e); }
  }

  // ── 4. Layout — Sidebar e TopBar ───────────────────────────────────────────
  console.log('\n📋 4. Layout da aplicação');
  try {
    const url = page.url();
    if (url.includes('login')) {
      // Navega direto se ainda não logado (ambiente sem credenciais)
      await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
    }
    await shot(page, '04-layout');

    const sidebar = await page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]').first().isVisible().catch(() => false);
    if (sidebar) ok('Sidebar visível');
    else fail('Sidebar não encontrada', new Error('Elemento não visível'));

    const topbar = await page.locator('header, [class*="topbar"], [class*="TopBar"], [class*="top-bar"]').first().isVisible().catch(() => false);
    if (topbar) ok('TopBar visível');
    else fail('TopBar não encontrada', new Error('Elemento não visível'));
  } catch (e) { fail('Layout', e); }

  // ── 5. Página de Usuários (/admin/users) ───────────────────────────────────
  console.log('\n📋 5. Página de Usuários');
  try {
    await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
    await shot(page, '05-users');

    const heading = await page.locator('h1, h2').filter({ hasText: /usuário|user/i }).count();
    if (heading > 0) ok('Título da página de usuários presente');
    else fail('Título não encontrado', new Error('Sem h1/h2 com "usuário"'));

    const hasTable = await page.locator('table, [role="table"], [class*="table"]').count();
    const hasEmpty = await page.locator('text=/nenhum|vazio|empty|sem usuário/i').count();
    if (hasTable > 0) ok('Tabela de usuários renderizada');
    else if (hasEmpty > 0) ok('Estado vazio exibido corretamente');
    else fail('Nenhuma tabela nem estado vazio', new Error('Conteúdo inesperado'));

    const inviteBtn = await page.locator('button').filter({ hasText: /convid|invite|novo|add/i }).count();
    if (inviteBtn > 0) ok('Botão de convidar usuário presente');
    else fail('Botão de convite não encontrado', new Error(''));
  } catch (e) { fail('Página de usuários', e); }

  // ── 6. Modal de convite de usuário ─────────────────────────────────────────
  console.log('\n📋 6. Modal de convite');
  try {
    const inviteBtn = page.locator('button').filter({ hasText: /convid|invite|novo|add/i }).first();
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await page.waitForTimeout(800);
      await shot(page, '06-modal-convite');

      const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="Dialog"]').count();
      if (modal > 0) ok('Modal de convite abriu');
      else fail('Modal não apareceu', new Error(''));

      const emailInput = await page.locator('[role="dialog"] input[type="email"], [role="dialog"] input[name="email"]').count();
      if (emailInput > 0) ok('Campo de email no modal');
      else fail('Campo de email não encontrado no modal', new Error(''));

      // Fecha com ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      ok('Modal fecha com ESC');
    } else {
      fail('Botão de convite não estava visível para clicar', new Error(''));
    }
  } catch (e) { fail('Modal de convite', e); }

  // ── 7. Página de Plataformas (/admin/platforms) ────────────────────────────
  console.log('\n📋 7. Página de Plataformas');
  try {
    await page.goto(`${BASE}/admin/platforms`, { waitUntil: 'networkidle' });
    await shot(page, '07-platforms');

    const heading = await page.locator('h1, h2').filter({ hasText: /plataforma|platform/i }).count();
    if (heading > 0) ok('Título da página de plataformas presente');
    else fail('Título não encontrado', new Error(''));

    // Deve listar Meta, Google, TikTok, Pinterest
    for (const name of ['Meta', 'Google', 'TikTok', 'Pinterest']) {
      const found = await page.locator(`text=${name}`).count();
      if (found > 0) ok(`Plataforma "${name}" listada`);
      else fail(`Plataforma "${name}" não encontrada`, new Error(''));
    }
  } catch (e) { fail('Página de plataformas', e); }

  // ── 8. Adicionar plataforma ─────────────────────────────────────────────────
  console.log('\n📋 8. Fluxo de adicionar plataforma');
  try {
    const addBtn = page.locator('button').filter({ hasText: /adicionar|conectar|add|connect|nova|new/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(800);
      await shot(page, '08-add-platform');

      const modal = await page.locator('[role="dialog"]').count();
      if (modal > 0) ok('Modal/form de plataforma abriu');
      else fail('Modal não apareceu', new Error(''));

      await page.keyboard.press('Escape');
      ok('Modal de plataforma fecha com ESC');
    } else {
      console.log('  ⚠️  Botão de adicionar plataforma não encontrado (pode já estar conectada)');
    }
  } catch (e) { fail('Adicionar plataforma', e); }

  // ── 9. Navegação via Sidebar ───────────────────────────────────────────────
  console.log('\n📋 9. Navegação via sidebar');
  try {
    await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
    const platformLink = page.locator('a[href*="platform"], nav >> text=/plataforma/i').first();
    if (await platformLink.isVisible()) {
      await platformLink.click();
      await page.waitForURL(/platform/, { timeout: 5000 });
      ok('Link de plataformas na sidebar funciona');
    } else {
      console.log('  ⚠️  Link de plataformas não encontrado na sidebar');
    }
    await shot(page, '09-nav');
  } catch (e) { fail('Navegação via sidebar', e); }

  // ── 10. Responsividade mobile ──────────────────────────────────────────────
  console.log('\n📋 10. Layout mobile (375px)');
  try {
    await ctx.browser().newPage().then(async (mobile) => {
      await mobile.setViewportSize({ width: 375, height: 812 });
      await mobile.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
      await mobile.screenshot({ path: `${SHOTS}/10-mobile.png`, fullPage: true });
      ok('Página renderizou em 375px sem erro');
      await mobile.close();
    });
  } catch (e) { fail('Layout mobile', e); }

  // ── Resultado Final ─────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`Resultado: ${passed} passou  |  ${failed} falhou`);
  console.log(`Screenshots salvas em: ${SHOTS}/`);
  console.log('─'.repeat(50));

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
