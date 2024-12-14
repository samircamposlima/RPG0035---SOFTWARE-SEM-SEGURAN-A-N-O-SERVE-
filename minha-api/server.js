const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const SECRET_KEY = 'my_secret_key'; // Substitua por uma chave mais segura em produção

const users = [
  { username: 'user', password: '123456', id: 123, email: 'user@dominio.com', perfil: 'user' },
  { username: 'admin', password: '123456789', id: 124, email: 'admin@dominio.com', perfil: 'admin' },
  { username: 'colab', password: '123', id: 125, email: 'colab@dominio.com', perfil: 'user' },
];

// Middleware para validação de token
defaultauthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

// Middleware para controle de acesso
const adminMiddleware = (req, res, next) => {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};

// Endpoint de login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ id: user.id, perfil: user.perfil }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Endpoint para recuperação dos dados do usuário logado
app.get('/api/auth/me', defaultauthMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  res.json({ user });
});

// Endpoint para recuperação de todos os usuários (somente admin)
app.get('/api/users', defaultauthMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ data: users });
});

// Endpoint para recuperação de contratos (com prevenção de injeção)
app.get('/api/contracts', defaultauthMiddleware, adminMiddleware, (req, res) => {
  const { empresa, inicio } = req.query;
  if (!empresa || !inicio) {
    return res.status(400).json({ message: 'Parâmetros insuficientes' });
  }
  if (/[^a-zA-Z0-9 _-]/.test(empresa) || /[^0-9-]/.test(inicio)) {
    return res.status(400).json({ message: 'Parâmetros inválidos' });
  }
  const contracts = getContracts(empresa, inicio);
  res.status(200).json({ data: contracts });
});

// Mock de consulta ao banco (parametrizado)
function getContracts(empresa, inicio) {
  // Exemplo real deve usar prepared statements ou ORM
  return [{ empresa, inicio, contrato: 'Contrato Exemplo' }];
}

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
