const mongoose = require("mongoose")
const { Schema } = mongoose

const SnippetSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    language: { type: String, default: "plaintext" },
    code: { type: String, required: true },
    description: { type: String, default: "", trim: true }, // added description field
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Snippet", SnippetSchema)
