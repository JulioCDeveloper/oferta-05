/**
 * Script de teste para o proxy transparente da API Infinity Buscas
 * 
 * Uso:
 *   node test-proxy.js
 */

const testCPF = '70520358201'; // CPF de teste
const accessKey = 'inf_85b302c7721fa309acc33a0bfbc2058975725f33553a3e38153256f9e967455a';

// Testa o proxy no seu servidor
const proxyUrl = `https://brpdfonline.site/api/search?Access-Key=${accessKey}&Base=cpf&Info=${testCPF}`;

console.log('🧪 Testando proxy transparente da API Infinity Buscas...\n');
console.log(`📍 URL: ${proxyUrl}\n`);

fetch(proxyUrl)
  .then(response => {
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers CORS:`);
    console.log(`   Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
    return response.json();
  })
  .then(data => {
    console.log('\n📦 Resposta:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.resultado && data.resultado.dados) {
      console.log('\n✅ Proxy funcionando corretamente!');
      console.log(`\n👤 Nome: ${data.resultado.dados.nome}`);
      console.log(`📅 Nascimento: ${data.resultado.dados.nascimento}`);
      console.log(`👩 Mãe: ${data.resultado.dados.mae}`);
    } else {
      console.log('\n⚠️ CPF não encontrado ou resposta inesperada');
    }
  })
  .catch(error => {
    console.error('\n❌ Erro ao testar proxy:');
    console.error(error.message);
    console.error('\n💡 Verifique se:');
    console.error('   1. O servidor está rodando (pm2 list)');
    console.error('   2. O Nginx está configurado para /api/search');
    console.error('   3. O servidor foi reiniciado (pm2 restart index0server)');
    console.error('\n📝 Veja CONFIGURACAO_PROXY.md para mais detalhes');
  });
