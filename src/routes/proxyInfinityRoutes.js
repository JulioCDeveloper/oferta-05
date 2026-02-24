const express = require('express');
const router = express.Router();

/**
 * Proxy transparente para API Infinity Buscas
 * Intercepta requisições e adiciona headers CORS corretos
 * 
 * Rota: GET /api/search
 * Parâmetros: Access-Key, Base, Info (mesmos da API original)
 */
router.get('/search', async (req, res) => {
  try {
    const { 'Access-Key': accessKey, Base: base, Info: info } = req.query;
    
    // Validação básica
    if (!accessKey || !base || !info) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: Access-Key, Base, Info'
      });
    }

    // URL da API Infinity Buscas
    const INFINITY_API_URL = 'https://api.infinitybuscas.com/api/search';
    const url = `${INFINITY_API_URL}?Access-Key=${accessKey}&Base=${base}&Info=${info}`;
    
    console.log(`[Proxy Infinity] Consultando: Base=${base}, Info=${info}`);

    // Fazer requisição à API Infinity Buscas do lado do servidor
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InfinityBuscas-Proxy/1.0'
      }
    });

    const data = await response.json();

    // Adicionar headers CORS corretos
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Retornar os dados com o mesmo formato da API original
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('[Proxy Infinity] Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar API',
      message: error.message
    });
  }
});

// Handler para OPTIONS (preflight CORS)
router.options('/search', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

module.exports = router;
