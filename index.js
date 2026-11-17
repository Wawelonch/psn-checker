const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== Получение Access Token из NPSSO =====
app.post('/api/token', async (req, res) => {
    const { npsso } = req.body;
    if (!npsso || npsso.length !== 64) {
        return res.status(400).json({ error: 'NPSSO должен быть 64 символа' });
    }
    try {
        const response = await fetch('https://ca.account.sony.com/api/authz/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from('playstation-web-client:').toString('base64'),
            },
            body: new URLSearchParams({
                grant_type: 'sso',
                npsso: npsso,
                scope: 'psn:clientapp',
            }),
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (e) {
        res.status(500).json({ error: 'Ошибка прокси: ' + e.message });
    }
});

// ===== Проверка ника =====
app.get('/api/check/:name', async (req, res) => {
    const { name } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Нет токена' });
    try {
        const response = await fetch(
            `https://m.np.playstation.com/api/userProfile/v1/internal/users/${encodeURIComponent(name)}/profiles`,
            { headers: { 'Authorization': authHeader, 'Accept': 'application/json' } }
        );
        res.status(response.status).json({ status: response.status });
    } catch (e) {
        res.status(500).json({ error: 'Ошибка прокси: ' + e.message });
    }
});

// ===== Запуск =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
