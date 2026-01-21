const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const PID_FILE = path.join(__dirname, 'pids.json');
const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// Helper para rodar scripts
const runScript = (scriptName, res) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    console.log(`Executando: ${scriptPath}`);

    exec(`"${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar ${scriptName}:`, error);
            // Retorna 500 mas envia stdout/stderr para debug
            return res.status(500).json({
                success: false,
                error: error.message,
                details: stderr || stdout
            });
        }
        console.log(`Sucesso ${scriptName}:`, stdout);
        res.json({ success: true, output: stdout });
    });
};

// Endpoints
app.get('/api/status', (req, res) => {
    const running = fs.existsSync(PID_FILE);
    res.json({ running });
});

app.post('/api/start', (req, res) => {
    if (fs.existsSync(PID_FILE)) {
        return res.json({ success: false, message: 'Já está rodando.' });
    }
    runScript('start.sh', res);
});

app.post('/api/stop', (req, res) => {
    runScript('stop.sh', res);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Launcher Control Panel rodando em http://localhost:${PORT}`);
});
