import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema({
  isComingSoon: {
    type: Boolean,
    default: false,
  },
  comingSoonMessage: {
    type: String,
    default: 'We are currently working on something amazing. Please check back later!',
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Force model refresh if new fields are missing
if (mongoose.models.SiteSettings) {
  const schema = mongoose.models.SiteSettings.schema;
  if (!schema.paths.isComingSoon) {
    delete mongoose.models.SiteSettings;
  }
}

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
