"""
utils/skill_keywords.py
-----------------------
Static skill dictionary for the CareerConnect AI service, organised by
category.  Used by services/skill_extractor.py for regex-based skill
detection in free-form resume and job description text.

This file is intentionally data-only - no logic, no imports.
Add new skills here and they are automatically picked up by the extractor.
"""

SKILL_CATEGORIES: dict[str, list[str]] = {
    "languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#",
        "Go", "PHP", "Ruby", "Swift", "Kotlin", "R",
        "Bash", "Shell", "Groovy", "Scala", "Rust", "Dart", "MATLAB",
    ],
    "frontend": [
        "React", "Vue", "Angular", "Next.js", "Tailwind CSS",
        "HTML", "CSS", "Redux", "jQuery", "React Native",
        "Svelte", "Bootstrap", "SASS", "SCSS", "Webpack", "Vite",
        "Material UI", "Chakra UI", "styled-components",
    ],
    "backend": [
        "Node.js", "Express", "Django", "FastAPI", "Spring Boot",
        "Laravel", "Flask", "NestJS", "GraphQL", "REST API",
        "Microservices", "gRPC", "Celery",
    ],
    "databases": [
        "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase",
        "SQLite", "Oracle", "Cassandra", "DynamoDB", "Elasticsearch",
        "Neo4j", "MariaDB", "SQL",
    ],
    "cloud_devops": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
        "Terraform", "Ansible", "Helm",
        "Prometheus", "Grafana", "Nginx", "Linux",
        "Vercel", "Netlify", "Heroku", "Railway",
    ],
    "testing": [
        "Selenium", "Pytest", "Jest", "Cypress", "Mocha", "Chai",
        "JUnit", "TestNG", "Playwright", "Robot Framework",
        "unit testing", "integration testing",
        "end-to-end testing", "TDD", "BDD", "QA",
    ],
    "ai_ml": [
        "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
        "OpenCV", "Keras", "Hugging Face", "LangChain",
        "machine learning", "deep learning", "NLP", "computer vision",
    ],
    "tools": [
        "Git", "Jira", "Figma", "Postman", "Linux", "Bash",
        "Grafana", "Terraform", "Ansible", "VS Code",
        "GitHub", "GitLab", "Bitbucket", "Slack",
        "Notion", "Confluence", "Trello",
    ],
    "soft_skills": [
        "leadership", "communication", "teamwork",
        "problem-solving", "agile", "scrum", "kanban",
        "project management", "mentoring",
    ],
}

# Flat list of every skill across all categories.
# Consumed by skill_extractor.py to build the regex pattern set.
ALL_SKILLS: list[str] = [
    skill
    for skills in SKILL_CATEGORIES.values()
    for skill in skills
]
