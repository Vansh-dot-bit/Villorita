import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'terms', 'privacy', 'support', 'faq', 'refund']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String, // HTML/Rich Text
    required: true,
    default: ''
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Force model recompilation in dev to pick up schema changes
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Content;
}

export default mongoose.models.Content || mongoose.model('Content', ContentSchema);
