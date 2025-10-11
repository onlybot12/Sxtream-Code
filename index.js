require('dotenv').config() 
const path = require("path")
const express = require("express")
const cookieParser = require("cookie-parser")
const engine = require("ejs-mate")
const mongoose = require("mongoose")
const User = require("./models/user")
const Snippet = require("./models/snippet")

const app = express()

// View engine setup
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.engine("ejs", engine)

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

app.use((req, res, next) => {
  res.locals.username = req.cookies.snippet_username || null
  next()
})

async function ensureUser(username) {
  const uname = (username || "").trim()
  if (!uname) return null
  let user = await User.findOne({ username: uname })
  if (!user) user = await User.create({ username: uname })
  return user
}

// Routes 
app.get("/", async (req, res) => {
  if (!res.locals.username) return res.render("welcome", { title: "Welcome" })
  const snippets = await Snippet.find({}).populate("createdBy", "username verified").sort({ createdAt: -1 }).limit(100)
  res.render("index", { title: "Sxtream Code", snippets })
})

app.post("/set-username", async (req, res) => {
  const name = (req.body.username || "").trim()
  if (!name) return res.redirect("/")
  await ensureUser(name)
  res.cookie("snippet_username", name, { httpOnly: false, sameSite: "lax" })
  res.redirect("/")
})

app.get("/create", (req, res) => {
  if (!res.locals.username) return res.redirect("/")
  res.render("create", { title: "Create Snippet" })
})

app.post("/snippets", async (req, res) => {
  const { title, description, code, language } = req.body
  if (!res.locals.username) return res.redirect("/")
  if (!title || !code) return res.status(400).send("Title and code are required.")
  const user = await ensureUser(res.locals.username)
  const snippet = await Snippet.create({
    title: title.trim(),
    description: (description || "").trim(),
    code,
    language: (language || "plaintext").trim(),
    createdBy: user._id,
  })
  res.redirect(`/view/${snippet._id.toString()}`)
})

app.get("/view/:id", async (req, res) => {
  const snippet = await Snippet.findById(req.params.id).populate("createdBy", "username verified")
  if (!snippet) return res.status(404).send("Snippet not found.")
  res.render("detail", {
    title: snippet.title,
    snippet,
    language: snippet.language || "plaintext",
  })
})

app.get("/healthz", (_req, res) => res.json({ ok: true }))

const PORT = process.env.SERVER_PORT || 4000

const MONGODB_URI = process.env.MONGODB_URI
;(async () => {
  try {
    if (!MONGODB_URI) {
      console.log("Perhatian: MONGODB_URI is not set. Set it in Vars to enable DB.")
    } else {
      await mongoose.connect(MONGODB_URI, { dbName: "snippetbox" })
      console.log("Terhubung ke MongoDB")
    }
    app.listen(PORT, () => {
      console.log(`Express server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error("Gagal Memulai server", err)
    process.exit(1)
  }
})()
