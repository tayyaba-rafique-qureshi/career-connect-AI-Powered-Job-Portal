/**
 * seedJobs.js — Inserts 25 diverse jobs into MongoDB for testing
 * the recommendation system, search, filters, and salary display.
 *
 * Usage:
 *   node src/scripts/seedJobs.js
 *
 * It will connect using MONGODB_URI from .env, insert the jobs
 * as "active" under the first employer account it finds,
 * then exit.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Job = require('../models/Job')
const User = require('../models/User')

const JOBS = [
  // ─── Software / Web Dev ────────────────────────────────────────────
  {
    title: 'Frontend Developer',
    company: '__AUTO__',
    description: 'Build modern, responsive web interfaces using React. Collaborate with designers and backend engineers to ship polished products. You will work on component libraries, state management, and performance optimization.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'remote',
    salaryMin: 80000,
    salaryMax: 130000,
    salaryType: 'yearly',
  },
  {
    title: 'Backend Engineer',
    company: '__AUTO__',
    description: 'Design and build RESTful APIs and microservices using Node.js and Express. Manage MongoDB databases, implement authentication, and optimize server performance for scale.',
    location: 'Islamabad, Pakistan',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Docker'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 90000,
    salaryMax: 150000,
    salaryType: 'yearly',
  },
  {
    title: 'Full Stack Developer',
    company: '__AUTO__',
    description: 'End-to-end development of web applications. Work across the entire stack — React frontend, Node.js backend, and MongoDB database. Ship features from concept to production.',
    location: 'Karachi, Pakistan',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Git'],
    experienceLevel: 'senior',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 120000,
    salaryMax: 200000,
    salaryType: 'yearly',
  },
  {
    title: 'React Native Mobile Developer',
    company: '__AUTO__',
    description: 'Develop cross-platform mobile applications using React Native. Integrate with REST APIs, implement push notifications, and ensure smooth UX on both iOS and Android.',
    location: 'Remote',
    requiredSkills: ['React Native', 'JavaScript', 'TypeScript', 'REST APIs', 'Mobile UI'],
    experienceLevel: 'mid',
    jobType: ['full-time', 'contract'],
    workMode: 'remote',
    salaryMin: 85000,
    salaryMax: 140000,
    salaryType: 'yearly',
  },
  {
    title: 'Junior Web Developer',
    company: '__AUTO__',
    description: 'Great opportunity for fresh graduates! Learn and grow while building real-world web apps using HTML, CSS, JavaScript and React. Mentorship provided by senior engineers.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
    experienceLevel: 'entry',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 40000,
    salaryMax: 65000,
    salaryType: 'yearly',
  },

  // ─── Data / AI / ML ────────────────────────────────────────────────
  {
    title: 'Data Scientist',
    company: '__AUTO__',
    description: 'Analyze large datasets to extract actionable insights. Build predictive models using Python, scikit-learn, and TensorFlow. Present findings to stakeholders through clear visualizations.',
    location: 'Islamabad, Pakistan',
    requiredSkills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas'],
    experienceLevel: 'senior',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 130000,
    salaryMax: 200000,
    salaryType: 'yearly',
  },
  {
    title: 'Machine Learning Engineer',
    company: '__AUTO__',
    description: 'Design and deploy ML pipelines at scale. Work with NLP, computer vision, and recommendation systems. Strong Python and MLOps experience required.',
    location: 'Remote',
    requiredSkills: ['Python', 'PyTorch', 'Docker', 'Machine Learning', 'MLOps'],
    experienceLevel: 'senior',
    jobType: ['full-time'],
    workMode: 'remote',
    salaryMin: 150000,
    salaryMax: 250000,
    salaryType: 'yearly',
  },
  {
    title: 'Data Analyst Intern',
    company: '__AUTO__',
    description: 'Support the analytics team with data cleaning, visualization, and reporting. Learn SQL, Excel, and Tableau in a hands-on environment. Ideal for students or recent graduates.',
    location: 'Karachi, Pakistan',
    requiredSkills: ['Excel', 'SQL', 'Python', 'Data Visualization'],
    experienceLevel: 'entry',
    jobType: ['internship'],
    workMode: 'on-site',
    salaryMin: 15000,
    salaryMax: 25000,
    salaryType: 'stipend',
  },

  // ─── Design ────────────────────────────────────────────────────────
  {
    title: 'UI/UX Designer',
    company: '__AUTO__',
    description: 'Create beautiful, intuitive interfaces for web and mobile applications. Conduct user research, build wireframes and prototypes in Figma, and collaborate closely with developers.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Adobe XD'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 70000,
    salaryMax: 110000,
    salaryType: 'yearly',
  },
  {
    title: 'Graphic Designer',
    company: '__AUTO__',
    description: 'Design marketing materials, social media graphics, and brand assets. Proficiency in Adobe Creative Suite required. Strong typography and color theory skills a plus.',
    location: 'Remote',
    requiredSkills: ['Photoshop', 'Illustrator', 'Branding', 'Typography'],
    experienceLevel: 'entry',
    jobType: ['part-time', 'contract'],
    workMode: 'remote',
    salaryMin: 30000,
    salaryMax: 50000,
    salaryType: 'monthly',
  },

  // ─── DevOps / Cloud ────────────────────────────────────────────────
  {
    title: 'DevOps Engineer',
    company: '__AUTO__',
    description: 'Build and maintain CI/CD pipelines, manage cloud infrastructure on AWS, and implement container orchestration with Kubernetes. Ensure 99.9% uptime across all services.',
    location: 'Islamabad, Pakistan',
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
    experienceLevel: 'senior',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 140000,
    salaryMax: 220000,
    salaryType: 'yearly',
  },
  {
    title: 'Cloud Solutions Architect',
    company: '__AUTO__',
    description: 'Design scalable cloud architectures on AWS and Azure. Lead migration projects, optimize costs, and establish best practices for cloud-native development.',
    location: 'Remote',
    requiredSkills: ['AWS', 'Azure', 'Microservices', 'Terraform', 'Networking'],
    experienceLevel: 'lead',
    jobType: ['full-time'],
    workMode: 'remote',
    salaryMin: 180000,
    salaryMax: 300000,
    salaryType: 'yearly',
  },

  // ─── Marketing / Content ──────────────────────────────────────────
  {
    title: 'Digital Marketing Specialist',
    company: '__AUTO__',
    description: 'Plan and execute digital marketing campaigns across Google Ads, Facebook, and LinkedIn. Analyze campaign metrics, optimize ROI, and manage social media presence.',
    location: 'Karachi, Pakistan',
    requiredSkills: ['Google Ads', 'SEO', 'Social Media Marketing', 'Analytics', 'Content Strategy'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 55000,
    salaryMax: 90000,
    salaryType: 'yearly',
  },
  {
    title: 'Content Writer',
    company: '__AUTO__',
    description: 'Write compelling blog posts, website copy, and email newsletters. SEO knowledge and the ability to adapt tone for different audiences is essential.',
    location: 'Remote',
    requiredSkills: ['Content Writing', 'SEO', 'Copywriting', 'Research'],
    experienceLevel: 'entry',
    jobType: ['part-time', 'contract'],
    workMode: 'remote',
    salaryMin: 20000,
    salaryMax: 40000,
    salaryType: 'monthly',
  },

  // ─── Project / Product Management ─────────────────────────────────
  {
    title: 'Product Manager',
    company: '__AUTO__',
    description: 'Own the product roadmap from discovery to delivery. Conduct market research, write PRDs, prioritize features, and work cross-functionally with engineering and design teams.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'Roadmapping'],
    experienceLevel: 'senior',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 120000,
    salaryMax: 180000,
    salaryType: 'yearly',
  },
  {
    title: 'Scrum Master',
    company: '__AUTO__',
    description: 'Facilitate Agile ceremonies, remove blockers, and coach teams on Scrum best practices. Experience with Jira and cross-functional team coordination required.',
    location: 'Islamabad, Pakistan',
    requiredSkills: ['Scrum', 'Agile', 'Jira', 'Facilitation', 'Coaching'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 80000,
    salaryMax: 120000,
    salaryType: 'yearly',
  },

  // ─── QA / Testing ─────────────────────────────────────────────────
  {
    title: 'QA Automation Engineer',
    company: '__AUTO__',
    description: 'Write and maintain automated test suites using Selenium and Cypress. Integrate tests into CI/CD pipelines and ensure high code quality across releases.',
    location: 'Karachi, Pakistan',
    requiredSkills: ['Selenium', 'Cypress', 'JavaScript', 'CI/CD', 'Test Planning'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 75000,
    salaryMax: 115000,
    salaryType: 'yearly',
  },
  {
    title: 'Manual QA Tester',
    company: '__AUTO__',
    description: 'Execute test cases, report bugs, and verify fixes for web and mobile applications. Attention to detail and clear communication skills are critical.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['Test Cases', 'Bug Reporting', 'Regression Testing', 'JIRA'],
    experienceLevel: 'entry',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 35000,
    salaryMax: 55000,
    salaryType: 'yearly',
  },

  // ─── Cybersecurity ─────────────────────────────────────────────────
  {
    title: 'Cybersecurity Analyst',
    company: '__AUTO__',
    description: 'Monitor security events, conduct vulnerability assessments, and respond to incidents. Implement security best practices and train staff on phishing awareness.',
    location: 'Islamabad, Pakistan',
    requiredSkills: ['Network Security', 'SIEM', 'Penetration Testing', 'Firewalls', 'Incident Response'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 100000,
    salaryMax: 160000,
    salaryType: 'yearly',
  },

  // ─── HR / Recruitment ─────────────────────────────────────────────
  {
    title: 'HR Coordinator',
    company: '__AUTO__',
    description: 'Support recruitment, onboarding, and employee engagement initiatives. Manage HRIS data, schedule interviews, and coordinate with hiring managers.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['Recruitment', 'HRIS', 'Communication', 'Onboarding', 'Excel'],
    experienceLevel: 'entry',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 40000,
    salaryMax: 65000,
    salaryType: 'yearly',
  },

  // ─── Finance / Accounting ─────────────────────────────────────────
  {
    title: 'Financial Analyst',
    company: '__AUTO__',
    description: 'Build financial models, prepare reports for leadership, and conduct variance analysis. Strong Excel and PowerBI skills required.',
    location: 'Karachi, Pakistan',
    requiredSkills: ['Financial Modeling', 'Excel', 'PowerBI', 'Accounting', 'SQL'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'hybrid',
    salaryMin: 80000,
    salaryMax: 130000,
    salaryType: 'yearly',
  },

  // ─── Misc / Varied types ──────────────────────────────────────────
  {
    title: 'Technical Writer (Contract)',
    company: '__AUTO__',
    description: 'Write API documentation, user guides, and knowledge base articles for a SaaS platform. Collaborate with engineering to ensure accuracy.',
    location: 'Remote',
    requiredSkills: ['Technical Writing', 'API Documentation', 'Markdown', 'Git'],
    experienceLevel: 'mid',
    jobType: ['contract'],
    workMode: 'remote',
    salaryMin: 50000,
    salaryMax: 80000,
    salaryType: 'yearly',
  },
  {
    title: 'Customer Support Lead',
    company: '__AUTO__',
    description: 'Lead a team of support agents, handle escalations, and improve response times. Use Zendesk to track tickets and build a knowledge base.',
    location: 'Lahore, Pakistan',
    requiredSkills: ['Zendesk', 'Team Management', 'Communication', 'Problem Solving'],
    experienceLevel: 'mid',
    jobType: ['full-time'],
    workMode: 'on-site',
    salaryMin: 60000,
    salaryMax: 90000,
    salaryType: 'yearly',
  },
  {
    title: 'Python Developer (Part-Time)',
    company: '__AUTO__',
    description: 'Work on automation scripts, data pipelines, and backend services using Python and Flask. Flexible 20-hour/week schedule ideal for students.',
    location: 'Remote',
    requiredSkills: ['Python', 'Flask', 'SQL', 'REST APIs', 'Git'],
    experienceLevel: 'entry',
    jobType: ['part-time'],
    workMode: 'remote',
    salaryMin: 25000,
    salaryMax: 45000,
    salaryType: 'monthly',
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find an employer to be the poster
    let employer = await User.findOne({ role: { $in: ['employer', 'recruiter'] } })

    if (!employer) {
      console.log('⚠  No employer found — creating a placeholder employer account')
      employer = await User.create({
        name: 'CareerConnect Demo Employer',
        email: 'employer@careerconnect.dev',
        password: 'Test1234!',
        role: 'employer',
        onboardingComplete: true,
        employerProfile: {
          companyInfo: {
            name: 'TechVision Solutions',
            industry: 'Information Technology',
            size: '51-200',
          }
        }
      })
    }

    const companyName = employer.employerProfile?.companyInfo?.name || employer.name || 'TechVision Solutions'
    console.log(`📌 Posting jobs under: "${companyName}" (${employer.email})`)

    // Prepare jobs
    const jobDocs = JOBS.map(j => ({
      ...j,
      company: j.company === '__AUTO__' ? companyName : j.company,
      postedBy: employer._id,
      status: 'active',
    }))

    const result = await Job.insertMany(jobDocs)
    console.log(`\n🎉 Successfully inserted ${result.length} jobs!\n`)

    // Summary table
    console.log('─'.repeat(80))
    console.log(`${'Title'.padEnd(35)} ${'Location'.padEnd(22)} ${'Type'.padEnd(18)} Level`)
    console.log('─'.repeat(80))
    for (const job of result) {
      console.log(
        `${job.title.padEnd(35)} ${job.location.padEnd(22)} ${(job.jobType || []).join(', ').padEnd(18)} ${job.experienceLevel}`
      )
    }
    console.log('─'.repeat(80))

    await mongoose.disconnect()
    console.log('\n✅ Done — disconnected from MongoDB')
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
