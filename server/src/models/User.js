const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// ---------- Applicant sub-schemas ----------
const skillSchema = new mongoose.Schema({ name: String, level: String }, { _id: false })

const applicantProfileSchema = new mongoose.Schema({
  basicInfo: {
    fullName: String, phone: String, location: String, photoUrl: String
  },
  professionalInfo: {
    currentTitle: String, yearsOfExp: String, industry: String,
    educationLevel: String, fieldOfStudy: String
  },
  skills:         [skillSchema],
  tools:          [String],
  certifications: [String],
  preferences: {
    jobType:            [String],
    workMode:           String,
    salaryMin:          Number,
    salaryMax:          Number,
    preferredLocations: [String],
    openToRelocation:   Boolean,
    careerGoals:        String
  },
  resume: {
    fileId:     { type: mongoose.Schema.Types.ObjectId },  // GridFS file reference
    fileName:   String,
    uploadedAt: Date,
    rawText:    String   // extracted by Python AI service
  },
  profileSummary: String,
  linkedinUrl:    String,
  portfolioUrl:   String
}, { _id: false })

// ---------- Employer sub-schemas ----------
const employerProfileSchema = new mongoose.Schema({
  companyInfo: {
    name: String, logoUrl: String, industry: String,
    size: String, websiteUrl: String, yearFounded: Number
  },
  location: {
    headquarters: String, countries: [String],
    remotePolicy: String, companyType: String
  },
  hiringPrefs: {
    typicalRoles:       [String],
    preferredExpLevel:  [String],
    hiringVolume:       String,
    aboutCompany:       String,
    employerPerks:      [String]
  }
}, { _id: false })

// ---------- Main User schema ----------
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role:     { type: String, enum: ['applicant', 'recruiter', 'employer', 'admin'], default: 'applicant' },
  googleId: { type: String },
  avatar:   { type: String },
  onboardingComplete: { type: Boolean, default: false },
  onboardingStep:     { type: Number, default: 0 },
  applicantProfile:   applicantProfileSchema,
  employerProfile:    employerProfileSchema
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('User', userSchema)
