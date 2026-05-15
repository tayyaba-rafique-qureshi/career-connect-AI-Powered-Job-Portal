"""
utils/skill_keywords.py
-----------------------
Static skill dictionary for the CareerConnect AI service, organised by
category.  Used by services/skill_extractor.py for regex-based skill
detection in free-form resume and job description text.

This file is intentionally data-only — no logic, no imports.
Add new skills here and they are automatically picked up by the extractor.
"""

SKILL_CATEGORIES: dict[str, list[str]] = {
    "languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#",
        "Go", "PHP", "Ruby", "Swift", "Kotlin", "R",
        "Bash", "Shell", "Groovy",
    ],
    "frontend": [
        "React", "Vue", "Angular", "Next.js", "Tailwind CSS",
        "HTML", "CSS", "Redux", "jQuery", "React Native",
    ],
    "backend": [
        "Node.js", "Express", "Django", "FastAPI", "Spring Boot",
        "Laravel", "Flask", "NestJS",
    ],
    "databases": [
        "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase",
        "SQLite", "Oracle",
    ],
    "cloud_devops": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "CI/CD", "Jenkins", "GitHub Actions",
        "Terraform", "Ansible", "Helm",
        "Prometheus", "Grafana", "Nginx",
    ],
    "ai_ml": [
        "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "OpenCV",
    ],
    "tools": [
        "Git", "Jira", "Figma", "Postman", "Linux", "Bash",
        "Grafana", "Terraform", "Ansible",
    ],
    "soft_skills": [
        "leadership", "communication", "teamwork",
        "problem-solving", "agile", "scrum",
    ],
}

# Flat list of every skill across all categories.
# Consumed by skill_extractor.py to build the regex pattern set.
ALL_SKILLS: list[str] = [
    skill
    for skills in SKILL_CATEGORIES.values()
    for skill in skills
]
