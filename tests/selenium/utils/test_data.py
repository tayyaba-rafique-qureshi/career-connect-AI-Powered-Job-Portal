from faker import Faker
import random
import time

fake = Faker()

class TestDataFactory:
    
    @staticmethod
    def unique_email(prefix="user"):
        """Always unique — uses timestamp to avoid collision between test runs"""
        return f"{prefix}_{int(time.time() * 1000)}@testcareer.com"
    
    @staticmethod
    def applicant_user():
        return {
            "name": fake.name(),
            "email": TestDataFactory.unique_email("applicant"),
            "password": "Test@1234",
            "role": "applicant"
        }
    
    @staticmethod
    def employer_user():
        return {
            "name": fake.name(),
            "email": TestDataFactory.unique_email("employer"),
            "password": "Test@1234",
            "role": "employer"
        }
    
    @staticmethod
    def job_posting():
        titles = ["Senior Python Developer", "React Frontend Engineer", "Full Stack Developer",
                  "DevOps Engineer", "Data Scientist", "ML Engineer", "Backend Developer"]
        return {
            "title": random.choice(titles),
            "company": fake.company(),
            "location": fake.city() + ", PK",
            "description": fake.paragraph(nb_sentences=5),
            "skills": ["Python", "React", "Node.js"],
            "experienceLevel": random.choice(["entry", "mid", "senior"]),
            "workMode": random.choice(["remote", "hybrid", "on-site"]),
            "jobType": "full-time",
            "salaryMin": random.randint(50000, 100000),
            "salaryMax": random.randint(100001, 200000),
        }
    
    _created_users = []
    _created_jobs = []
    
    @classmethod
    def store_user(cls, user_data):
        cls._created_users.append(user_data)
        return user_data
    
    @classmethod
    def store_job(cls, job_data):
        cls._created_jobs.append(job_data)
        return job_data
