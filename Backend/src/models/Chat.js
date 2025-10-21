import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema({
role: { type: String, enum: ['user','ai'], required: true },
content: String,
score: Number,
feedback: String,
citations: [Number],
createdAt: { type: Date, default: Date.now }
});


const chatSchema = new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
messages: [messageSchema],
createdAt: { type: Date, default: Date.now }
});


export default mongoose.model('Chat', chatSchema);