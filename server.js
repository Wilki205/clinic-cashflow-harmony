import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

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

/** Clínica padrão */
const DEFAULT_CLINIC_ID = "a7813766-8e38-4458-bd99-06af5cba2c46";

/** ====== Middlewares ====== */

app.use(
  cors({
    origin: FRONT_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

console.log("=================================");
console.log("🚀 Iniciando servidor...");
console.log(`ENV: ${NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log("=================================");

/** ====== Postgres Pool ====== */

const pool = new Pool({
  user: requireEnv("POSTGRES_USER"),
  password: requireEnv("POSTGRES_PASSWORD"),
  host: requireEnv("POSTGRES_HOST"),
  port: Number(requireEnv("POSTGRES_PORT")),
  database: requireEnv("POSTGRES_DB"),

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/** ====== Health ====== */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, env: NODE_ENV });
  } catch (err) {
    console.error("Health DB error:", err);
    res.status(500).json({ ok: false });
  }
});


// ==========================================
// DASHBOARD
// ==========================================

app.get("/api/dashboard-stats", async (req, res) => {
  try {

    const financeiroQuery = pool.query(
      `
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END),0) income,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END),0) expense
      FROM financeiro
      WHERE clinic_id = $1
      `,
      [DEFAULT_CLINIC_ID]
    );

    const pacientesQuery = pool.query(
      `
      SELECT 
        COUNT(*) total,
        COUNT(*) FILTER (WHERE status_doc='pendente') pendentes
      FROM pacientes
      WHERE clinic_id=$1
      `,
      [DEFAULT_CLINIC_ID]
    );

    const agendamentosQuery = pool.query(
      `
      SELECT
        COUNT(*) total,
        COUNT(*) FILTER (WHERE status='absent') faltas,
        COUNT(*) FILTER (WHERE status='confirmed') confirmados_geral,
        COUNT(*) FILTER (WHERE data_agendamento=CURRENT_DATE AND status='confirmed') confirmados_hoje
      FROM agendamentos
      WHERE clinic_id=$1
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
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});


// ==========================================
// AGENDAMENTOS HOJE
// ==========================================

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
      ORDER BY a.horario_agendamento ASC
      `,
      [DEFAULT_CLINIC_ID]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.json([]);
  }
});


// ==========================================
// PACIENTES
// ==========================================

app.get("/api/pacientes", async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM pacientes WHERE clinic_id=$1 ORDER BY nome ASC",
      [DEFAULT_CLINIC_ID]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});


app.post("/api/pacientes", async (req, res) => {

  const { name, email, phone, cpf, attachments } = req.body;

  const status = attachments?.length ? "ok" : "pendente";

  try {

    const result = await pool.query(
      `
      INSERT INTO pacientes
      (nome,email,telefone,cpf,status_doc,clinic_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id
      `,
      [name, email, phone, cpf, status, DEFAULT_CLINIC_ID]
    );

    res.status(201).json({ id: result.rows[0].id });

  } catch (err) {

    if (err.code === "23505") {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }

    console.error(err);
    res.status(500).json({ error: "Erro interno" });

  }
});


// ==========================================
// FINANCEIRO
// ==========================================

app.get("/api/financeiro", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM financeiro WHERE clinic_id=$1 ORDER BY data_base DESC",
      [DEFAULT_CLINIC_ID]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Erro interno" });

  }

});


app.post("/api/financeiro", async (req, res) => {

  const { descricao, valor, tipo, categoria, data } = req.body;

  try {

    await pool.query(
      `
      INSERT INTO financeiro
      (descricao,valor,tipo,categoria,data_base,clinic_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [descricao, valor, tipo, categoria, data, DEFAULT_CLINIC_ID]
    );

    res.sendStatus(201);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Erro interno" });

  }

});


// ==========================================
// FRONT
// ==========================================

if (NODE_ENV === "production") {

  const distPath = path.join(__dirname, "dist");

  app.use(express.static(distPath));

  app.use((req, res, next) => {

    if (req.path.startsWith("/api")) return next();

    res.sendFile(path.join(distPath, "index.html"));

  });

}


// ==========================================
// ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "Erro interno do servidor"
  });

});


// ==========================================
// START
// ==========================================

app.listen(PORT, "0.0.0.0", () => {

  console.log(`🚀 Servidor rodando`);
  console.log(`🌐 http://0.0.0.0:${PORT}`);
  console.log(`ENV: ${NODE_ENV}`);

});