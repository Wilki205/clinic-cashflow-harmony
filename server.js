import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

console.log("Iniciando servidor...");
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
});

// ==========================================
// 📊 ROTA 1: DASHBOARD (LEITURA)
// ==========================================
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const financeiroQuery = pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as expense
            FROM financeiro
        `);
        const pacientesQuery = pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status_doc = 'pendente') as pendentes FROM pacientes`);
        const agendamentosQuery = pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'absent') as faltas,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmados_geral,
                COUNT(*) FILTER (WHERE data_agendamento = CURRENT_DATE AND status = 'confirmed') as confirmados_hoje
            FROM agendamentos
        `);

        const [fin, pac, age] = await Promise.all([financeiroQuery, pacientesQuery, agendamentosQuery]);

        const income = parseFloat(fin.rows[0]?.income || 0);
        const expense = parseFloat(fin.rows[0]?.expense || 0);
        const totalAppo = parseInt(age.rows[0]?.total || 0);
        const faltas = parseInt(age.rows[0]?.faltas || 0);
        const confirmadosGeral = parseInt(age.rows[0]?.confirmados_geral || 0);
        
        res.json({
            income, expense,
            patientsCount: parseInt(pac.rows[0]?.total || 0),
            pendingDocs: parseInt(pac.rows[0]?.pendentes || 0),
            absentRate: totalAppo > 0 ? Math.round((faltas / totalAppo) * 100) : 0,
            confirmedToday: parseInt(age.rows[0]?.confirmados_hoje || 0),
            ticketMedio: confirmadosGeral > 0 ? income / confirmadosGeral : 0
        });
    } catch (err) {
        console.error("Erro Dashboard:", err);
        res.status(500).json({ error: "Erro interno" });
    }
});

app.get('/api/agendamentos/hoje', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.horario_agendamento as time, a.procedimento as procedure, a.status, p.nome as patient
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            WHERE a.data_agendamento = CURRENT_DATE
            ORDER BY a.horario_agendamento ASC
        `);
        res.json(result.rows);
    } catch (err) { res.json([]); }
});

// ==========================================
// 👥 ROTA 2: PACIENTES (CRUD COMPLETO)
// ==========================================
app.get('/api/pacientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pacientes ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/pacientes', async (req, res) => {
    const { name, email, phone, cpf, attachments } = req.body;
    const status = (attachments && attachments.length > 0) ? 'ok' : 'pendente';
    try {
        await pool.query(
            "INSERT INTO pacientes (nome, email, telefone, cpf, status_doc) VALUES ($1, $2, $3, $4, $5)",
            [name, email, phone, cpf, status]
        );
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err); }
});

app.put('/api/pacientes/:id', async (req, res) => {
    const { name, email, phone, cpf, attachments } = req.body;
    const status = (attachments && attachments.length > 0) ? 'ok' : 'pendente';
    try {
        await pool.query(
            "UPDATE pacientes SET nome=$1, email=$2, telefone=$3, cpf=$4, status_doc=$5 WHERE id=$6",
            [name, email, phone, cpf, status, req.params.id]
        );
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM pacientes WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

// ==========================================
// 📅 ROTA 3: AGENDA (CRUD)
// ==========================================
app.get('/api/agendamentos', async (req, res) => {
    try {
        // Trazendo o nome do paciente junto (JOIN)
        const result = await pool.query(`
            SELECT a.*, p.nome as paciente_nome 
            FROM agendamentos a
            LEFT JOIN pacientes p ON a.paciente_id = p.id
            ORDER BY a.data_agendamento DESC, a.horario_agendamento ASC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/agendamentos', async (req, res) => {
    const { paciente_id, data, horario, procedimento, valor } = req.body;
    try {
        await pool.query(
            "INSERT INTO agendamentos (paciente_id, data_agendamento, horario_agendamento, procedimento, valor, status) VALUES ($1, $2, $3, $4, $5, 'pending')",
            [paciente_id, data, horario, procedimento, valor]
        );
        res.sendStatus(201);
    } catch (err) { console.error(err); res.status(500).send(err); }
});

app.put('/api/agendamentos/:id/status', async (req, res) => {
    const { status } = req.body; // 'confirmed', 'absent', etc
    try {
        await pool.query("UPDATE agendamentos SET status = $1 WHERE id = $2", [status, req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM agendamentos WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

// Check-in rápido (mantido para compatibilidade)
app.patch('/api/agendamentos/:id/confirmar', async (req, res) => {
    try {
        await pool.query("UPDATE agendamentos SET status = 'confirmed' WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

// ==========================================
// 💰 ROTA 4: FINANCEIRO (CRUD)
// ==========================================
app.get('/api/financeiro', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM financeiro ORDER BY data_base DESC");
        res.json(result.rows);
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/financeiro', async (req, res) => {
    const { descricao, valor, tipo, categoria, data } = req.body;
    try {
        await pool.query(
            "INSERT INTO financeiro (descricao, valor, tipo, categoria, data_base) VALUES ($1, $2, $3, $4, $5)",
            [descricao, valor, tipo, categoria, data]
        );
        res.sendStatus(201);
    } catch (err) { console.error(err); res.status(500).send(err); }
});

app.delete('/api/financeiro/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM financeiro WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

app.listen(3000, () => {
    console.log('🚀 API Completa rodando na porta 3000');
});