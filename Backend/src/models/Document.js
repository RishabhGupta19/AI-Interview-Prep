import mongoose from 'mongoose';


const chunkSchema = new mongoose.Schema({
text: String,
embedding: String // placeholder or store vector metadata/id
});


const documentSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
type: { type: String, enum: ['resume','jd'], required: true },
fileUrl: String,
fileName: String,
uploadDate: { type: Date, default: Date.now },
fullText: String,
chunks: [chunkSchema]
});


export default mongoose.model('Document', documentSchema);