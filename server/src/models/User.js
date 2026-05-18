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
    fileId:          { type: mongoose.Schema.Types.ObjectId },
    fileName:        String,
    uploadedAt:      Date,
    rawText:         String,   // active text used by AI matching (switches with aiPreference)
    uploadedRawText: String,   // preserved text from uploaded PDF — never overwritten
    builtRawText:    String,   // text generated from CareerCONNECT resume builder
    aiPreference:    { type: String, enum: ['uploaded', 'built'], default: 'uploaded' },
    originalSize:    Number,   // bytes before compression
    storedSize:      Number,   // bytes after compression
    wasCompressed:   Boolean   // whether compression reduced size
  },
  profileSummary: String,
  linkedinUrl:    String,
  portfolioUrl:   String
}, { _id: false })

// ---------- Resume Builder sub-schemas ----------
const resumeExpSchema = new mongoose.Schema({
  jobTitle: String, company: String,
  startDate: String, endDate: String,
  current: { type: Boolean, default: false },
  bullets: [String]
}, { _id: true })

const resumeProjectSchema = new mongoose.Schema({
  name: String, techStack: String, description: String, link: String
}, { _id: true })

const resumeEduSchema = new mongoose.Schema({
  degree: String, institution: String, year: String, cgpa: String
}, { _id: true })

const resumeCertSchema = new mongoose.Schema({
  name: String, issuer: String, year: String
}, { _id: true })

const resumeDataSchema = new mongoose.Schema({
  fullName: String, email: String, phone: String,
  linkedin: String, location: String,
  summary:        String,
  accentColor:    String,
  skills:         [String],
  workExperience: [resumeExpSchema],
  projects:       [resumeProjectSchema],
  education:      [resumeEduSchema],
  certifications: [resumeCertSchema],
  lastSaved:      Date
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
  resumeData:         resumeDataSchema,
  employerProfile:    employerProfileSchema,
  // Admin fields
  isBanned:    { type: Boolean, default: false },
  banReason:   { type: String },
  bannedAt:    { type: Date },
  bannedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastLoginAt: { type: Date },
  loginCount:  { type: Number, default: 0 },
  // Employer verification
  isVerifiedEmployer: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  verificationRequest: {
    submittedAt:    { type: Date },
    companyWebsite: { type: String },
    companyRegNo:   { type: String },
    documents:      [{ type: String }],
    rejectedReason: { type: String },
    reviewedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:     { type: Date }
<<<<<<< HEAD
  },
  // Job post credits (employer/recruiter only)
  // New accounts get 3 free posts; additional credits purchased via payment gateway
  jobPostCredits: { type: Number, default: 3 },
  pendingOrderId: { type: String, default: null },
  processedPayments:  { type: [String], default: []   }
=======
  }
>>>>>>> f9873058d0e7eb905fe9fba20468adc7056e7fa3
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
