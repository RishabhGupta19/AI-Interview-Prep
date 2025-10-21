
import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse-debugging-disabled'; // fixed import
import cloudinary from '../config/cloudinary.js';
import auth from '../middleware/auth.js';
import Document from '../models/Document.js';
import { chunkText } from '../utils/chunk.js';
import { fakeEmbed } from '../utils/embeddings.js';

const router = express.Router();

// Memory storage + 2 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Upload endpoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { type } = req.body; // 'resume' or 'jd'
    if (!['resume', 'jd'].includes(type))
      return res.status(400).json({ error: 'Invalid type' });

    // Upload file buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Extract text using pdf-parse
    let text = '';
    try {
      const dataBuffer = req.file.buffer;
      const data = await pdf(dataBuffer);
      text = data.text || '[Empty PDF content]';
    } catch (error) {
      console.warn('PDF parse failed:', error.message);
      text = '[PDF parse failed - binary stored]';
    }

    // Chunk text & generate dummy embeddings
    const chunks = chunkText(text, 500).map((chunkTextStr) => ({
      text: chunkTextStr,
      embedding: JSON.stringify(fakeEmbed(chunkTextStr))
    }));

    // Save document metadata in DB
    const doc = await Document.create({
      userId: req.user._id,
      type,
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      fullText: text,
      chunks
    });

    res.json({ message: 'Uploaded successfully', document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List all user documents
router.get('/list', auth, async (req, res) => {
  const docs = await Document.find({ userId: req.user._id }).sort({ uploadDate: -1 });
  res.json({ documents: docs });
});

// Delete a document by ID
// Alternative FIX (more efficient, replace lines 85-88)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    // Use findOneAndDelete to find the document, check ownership, and delete in one step (or two)
    const result = await Document.deleteOne({ _id: id, userId: req.user._id });

    if (result.deletedCount === 0) {
        // We now need to check if the document existed but failed the ownership check, 
        // or if it simply wasn't found. For simplicity and security:
        const docExists = await Document.findById(id);
        
        if (!docExists) {
            return res.status(404).json({ error: 'Not found' });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    
    res.json({ message: 'Deleted' });
});

export default router;
