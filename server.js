import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

/** ====== Paths (ESM) ====== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** ====== Env ====== */
dotenv.config({ path: path.join(__dirname, ".env.local") });

const { Pool } = pg;
const app = express();

/** ====== Helpers ====== */
function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Variável de ambiente ausente: ${name}`);
    process.exit(1);
  }
  return v;
}

/** ====== Config ====== */
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT || 3000);
const FRONT_ORIGIN = process.env.FRONT_ORIGIN;

// ✅ Clínica fixa atual (monoclínica por enquanto)
const DEFAULT_CLINIC_ID = "a7813766-8e38-4458-bd99-06af5cba2c46";
const {randomUUID} = await import("crypto");

/** ====== AUTH CONFIG (ADICIONADO) ====== */
const JWT_SECRET = requireEnv("JWT_SECRET");
const GOOGLE_CLIENT_ID = requireEnv("GOOGLE_CLIENT_ID");
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** ====== Middlewares ====== */
if (NODE_ENV === "development") {
  app.use(
    cors({
      origin: FRONT_ORIGIN || true,
      credentials: true,
    })
  );
}

app.use(express.json());

console.log("Iniciando servidor...");
console.log(`NODE_ENV=${NODE_ENV}, PORT=${PORT}`);

/** ====== Postgres Pool ====== */
const pool = new Pool({
  user: requireEnv("POSTGRES_USER"),
  password: requireEnv("POSTGRES_PASSWORD"),
  host: requireEnv("POSTGRES_HOST"),
  port: Number(requireEnv("POSTGRES_PORT")),
  database: requireEnv("POSTGRES_DB"),
});

/** ====== Health check ====== */
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, env: NODE_ENV });
  } catch (err) {
    console.error("Health DB error:", err);
    res.status(500).json({ ok: false });
  }
});

/** ====== AUTH GOOGLE LOGIN (ADICIONADO) ====== */
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Credential ausente" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ error: "Token Google inválido" });
    }
    // Verificar se o usuário existe na clínica (pode ser criado automaticamente ou ter um cadastro prévio)
    let user = await pool.query(
      "SELECT id, clinic_id FROM users WHERE email = $1",
      [payload.email]
    );

    if (user.rowCount === 0) {
      // Criar usuário automaticamente (opcional)
      const clinicId = randomUUID(); // Gerar um clinic_id único para o usuário (ou usar um fixo se for monoclínica)
      user = await pool.query(
        "INSERT INTO users (email, name, clinic_id, role) VALUES ($1, $2, $3,'admin') RETURNING id, clinic_id",
        [payload.email, payload.name || "Usuário Google", clinicId]
      );
      user = user.rows[0];
    } else {
      user = user.rows[0];
    } 
    const token = jwt.sign(
      {
        email: payload.email,
        name: payload.name,
        clinic_id: user.clinic_id
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    });
  } catch (err) {
    console.error("Erro login Google:", err);
    res.status(401).json({ error: "Login inválido" });
  }
});

/** ====== AUTH MIDDLEWARE (OPCIONAL, ADICIONADO) ====== */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token ausente" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// ==========================================
// 📊 ROTA 1: DASHBOARD (LEITURA)
// ==========================================
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const financeiroQuery = pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS expense
      FROM financeiro
      WHERE clinic_id = $1
      `,
      [DEFAULT_CLINIC_ID]
    );

    const pacientesQuery = pool.query(
      `
      SELECT 
        COUNT(*) AS total, 
        COUNT(*) FILTER (WHERE status_doc = 'pendente') AS pendentes 
      FROM pacientes
      WHERE clinic_id = $1
      `,
      [DEFAULT_CLINIC_ID]
    );

    const agendamentosQuery = pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'absent') AS faltas,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmados_geral,
        COUNT(*) FILTER (WHERE data_agendamento = CURRENT_DATE AND status = 'confirmed') AS confirmados_hoje
      FROM agendamentos
      WHERE clinic_id = $1
      `,
      [DEFAULT_CLINIC_ID]
    );

    const [fin, pac, age] = await Promise.all([
      financeiroQuery,
      pacientesQuery,
      agendamentosQuery,
    ]);

    const income = Number(fin.rows[0]?.income || 0);
    const expense = Number(fin.rows[0]?.expense || 0);
    const totalAppo = Number(age.rows[0]?.total || 0);
    const faltas = Number(age.rows[0]?.faltas || 0);
    const confirmadosGeral = Number(age.rows[0]?.confirmados_geral || 0);

    res.json({
      income,
      expense,
      patientsCount: Number(pac.rows[0]?.total || 0),
      pendingDocs: Number(pac.rows[0]?.pendentes || 0),
      absentRate: totalAppo > 0 ? Math.round((faltas / totalAppo) * 100) : 0,
      confirmedToday: Number(age.rows[0]?.confirmados_hoje || 0),
      ticketMedio: confirmadosGeral > 0 ? income / confirmadosGeral : 0,
    });
  } catch (err) {
    console.error("Erro Dashboard:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.get("/api/agendamentos/hoje", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.horario_agendamento AS time,
        a.procedimento AS procedure,
        a.status,
        p.nome AS patient
      FROM agendamentos a
      JOIN pacientes p ON a.paciente_id = p.id
      WHERE a.data_agendamento = CURRENT_DATE
        AND a.clinic_id = $1
        AND p.clinic_id = $1
      ORDER BY a.horario_agendamento ASC
      `,
      [DEFAULT_CLINIC_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro agendamentos hoje:", err);
    res.json([]);
  }
});

// ==========================================
// 👥 ROTA 2: PACIENTES (CRUD COMPLETO)
// ==========================================
app.get("/api/pacientes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pacientes WHERE clinic_id = $1 ORDER BY nome ASC",
      [DEFAULT_CLINIC_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro GET /api/pacientes:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.post("/api/pacientes", async (req, res) => {
  const { name, email, phone, cpf, attachments } = req.body;
  const status = attachments?.length ? "ok" : "pendente";

  try {
    const result = await pool.query(
      `
      INSERT INTO pacientes (nome, email, telefone, cpf, status_doc, clinic_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [name, email, phone, cpf, status, DEFAULT_CLINIC_ID]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }
    console.error("Erro POST /api/pacientes:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.put("/api/pacientes/:id", async (req, res) => {
  const { name, email, phone, cpf, attachments } = req.body;
  const status = attachments?.length ? "ok" : "pendente";

  try {
    const result = await pool.query(
      `
      UPDATE pacientes
      SET nome = $1, email = $2, telefone = $3, cpf = $4, status_doc = $5
      WHERE id = $6 AND clinic_id = $7
      RETURNING id
      `,
      [name, email, phone, cpf, status, req.params.id, DEFAULT_CLINIC_ID]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }
    console.error("Erro PUT /api/pacientes/:id:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.delete("/api/pacientes/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM pacientes WHERE id = $1 AND clinic_id = $2",
      [req.params.id, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro DELETE /api/pacientes/:id:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ==========================================
// 🩺 ROTA EXTRA: ANAMNESE (por paciente)
// ==========================================

function normalizeTriBool(v) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return null;
}

app.get("/api/pacientes/:id/anamnese", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        allergies, medications, diseases, notes, updated_at,
        hipertensao, diabetes, problemas_cardiacos, sangramento_facil,
        gestante, fumante, consome_alcool, alergia_anestesia, alergia_latex
      FROM anamnese
      WHERE paciente_id = $1
        AND clinic_id = $2
      `,
      [req.params.id, DEFAULT_CLINIC_ID]
    );

    if (result.rowCount === 0) {
      return res.json({
        allergies: "",
        medications: "",
        diseases: "",
        notes: "",
        updated_at: null,
        hipertensao: null,
        diabetes: null,
        problemas_cardiacos: null,
        sangramento_facil: null,
        gestante: null,
        fumante: null,
        consome_alcool: null,
        alergia_anestesia: null,
        alergia_latex: null,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro GET /api/pacientes/:id/anamnese:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.put("/api/pacientes/:id/anamnese", async (req, res) => {
  const {
    allergies = "",
    medications = "",
    diseases = "",
    notes = "",

    hipertensao,
    diabetes,
    problemas_cardiacos,
    sangramento_facil,
    gestante,
    fumante,
    consome_alcool,
    alergia_anestesia,
    alergia_latex,
  } = req.body;

  try {
    const patientCheck = await pool.query(
      "SELECT id FROM pacientes WHERE id = $1 AND clinic_id = $2",
      [req.params.id, DEFAULT_CLINIC_ID]
    );

    if (patientCheck.rowCount === 0) {
      return res.status(404).json({ error: "Paciente não encontrado para esta clínica" });
    }

    await pool.query(
      `
      INSERT INTO anamnese (
        paciente_id, clinic_id,
        allergies, medications, diseases, notes, updated_at,
        hipertensao, diabetes, problemas_cardiacos, sangramento_facil,
        gestante, fumante, consome_alcool, alergia_anestesia, alergia_latex
      )
      VALUES (
        $1, $2,
        $3, $4, $5, $6, NOW(),
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      ON CONFLICT (paciente_id)
      DO UPDATE SET
        clinic_id = EXCLUDED.clinic_id,
        allergies = EXCLUDED.allergies,
        medications = EXCLUDED.medications,
        diseases = EXCLUDED.diseases,
        notes = EXCLUDED.notes,
        hipertensao = EXCLUDED.hipertensao,
        diabetes = EXCLUDED.diabetes,
        problemas_cardiacos = EXCLUDED.problemas_cardiacos,
        sangramento_facil = EXCLUDED.sangramento_facil,
        gestante = EXCLUDED.gestante,
        fumante = EXCLUDED.fumante,
        consome_alcool = EXCLUDED.consome_alcool,
        alergia_anestesia = EXCLUDED.alergia_anestesia,
        alergia_latex = EXCLUDED.alergia_latex,
        updated_at = NOW()
      `,
      [
        req.params.id,
        DEFAULT_CLINIC_ID,
        allergies,
        medications,
        diseases,
        notes,
        normalizeTriBool(hipertensao),
        normalizeTriBool(diabetes),
        normalizeTriBool(problemas_cardiacos),
        normalizeTriBool(sangramento_facil),
        normalizeTriBool(gestante),
        normalizeTriBool(fumante),
        normalizeTriBool(consome_alcool),
        normalizeTriBool(alergia_anestesia),
        normalizeTriBool(alergia_latex),
      ]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro PUT /api/pacientes/:id/anamnese:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ==========================================
// 📅 ROTA 3: AGENDA (CRUD)
// ==========================================
app.get("/api/agendamentos", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT a.*, p.nome AS paciente_nome
      FROM agendamentos a
      LEFT JOIN pacientes p ON a.paciente_id = p.id
      WHERE a.clinic_id = $1
      ORDER BY a.data_agendamento DESC, a.horario_agendamento ASC
      `,
      [DEFAULT_CLINIC_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro GET /api/agendamentos:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.post("/api/agendamentos", async (req, res) => {
  const { paciente_id, data, horario, procedimento, valor } = req.body;

  try {
    const patientCheck = await pool.query(
      "SELECT id FROM pacientes WHERE id = $1 AND clinic_id = $2",
      [paciente_id, DEFAULT_CLINIC_ID]
    );

    if (patientCheck.rowCount === 0) {
      return res.status(404).json({ error: "Paciente não encontrado para esta clínica" });
    }

    await pool.query(
      `
      INSERT INTO agendamentos (
        paciente_id, clinic_id, data_agendamento, horario_agendamento, procedimento, valor, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      `,
      [paciente_id, DEFAULT_CLINIC_ID, data, horario, procedimento, valor]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error("Erro POST /api/agendamentos:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ✅ editar/remarcar agendamento
app.put("/api/agendamentos/:id", async (req, res) => {
  const { data, horario, procedimento, valor, status } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE agendamentos
      SET
        data_agendamento = $1,
        horario_agendamento = $2,
        procedimento = $3,
        valor = $4,
        status = $5
      WHERE id = $6 AND clinic_id = $7
      RETURNING id
      `,
      [data, horario, procedimento, valor, status, req.params.id, DEFAULT_CLINIC_ID]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Erro PUT /api/agendamentos/:id:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.put("/api/agendamentos/:id/status", async (req, res) => {
  const { status } = req.body;

  try {
    await pool.query(
      "UPDATE agendamentos SET status = $1 WHERE id = $2 AND clinic_id = $3",
      [status, req.params.id, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro PUT /api/agendamentos/:id/status:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.delete("/api/agendamentos/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM agendamentos WHERE id = $1 AND clinic_id = $2",
      [req.params.id, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro DELETE /api/agendamentos/:id:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.patch("/api/agendamentos/:id/confirmar", async (req, res) => {
  try {
    await pool.query(
      "UPDATE agendamentos SET status = 'confirmed' WHERE id = $1 AND clinic_id = $2",
      [req.params.id, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro PATCH /api/agendamentos/:id/confirmar:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

// ==========================================
// 💰 ROTA 4: FINANCEIRO (CRUD)
// ==========================================
app.get("/api/financeiro", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM financeiro WHERE clinic_id = $1 ORDER BY data_base DESC",
      [DEFAULT_CLINIC_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro GET /api/financeiro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.post("/api/financeiro", async (req, res) => {
  const { descricao, valor, tipo, categoria, data } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO financeiro (descricao, valor, tipo, categoria, data_base, clinic_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [descricao, valor, tipo, categoria, data, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error("Erro POST /api/financeiro:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

app.delete("/api/financeiro/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM financeiro WHERE id = $1 AND clinic_id = $2",
      [req.params.id, DEFAULT_CLINIC_ID]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro DELETE /api/financeiro/:id:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/** ====== Servir o Front (produção) ====== */
if (NODE_ENV === "production") {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

/** ====== Start ====== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API + Front rodando em http://0.0.0.0:${PORT} (${NODE_ENV})`);
});