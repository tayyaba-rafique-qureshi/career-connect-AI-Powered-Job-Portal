"""
Direct MongoDB operations for test setup/teardown.
Seeds test data before tests and cleans up after.
Uses a SEPARATE test database to never touch production.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("tests/selenium/.env.test")

class DBHelper:
    _client = None
    _db = None
    
    @classmethod
    def get_db(cls):
        if cls._client is None:
            uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/careerconnect_test")
            cls._client = MongoClient(uri)
            cls._db = cls._client.get_default_database()
        return cls._db
    
    @classmethod
    def clean_test_users(cls):
        """Remove all test users (those with @testcareer.com email)"""
        db = cls.get_db()
        db.users.delete_many({"email": {"$regex": "@testcareer.com$"}})
    
    @classmethod
    def clean_test_jobs(cls):
        """Remove all jobs created during testing"""
        db = cls.get_db()
        db.jobs.delete_many({"title": {"$regex": "Selenium Test|Test Job"}})
    
    @classmethod
    def clean_all_test_data(cls):
        cls.clean_test_users()
        cls.clean_test_jobs()
        db = cls.get_db()
        db.applications.delete_many({})
    
    @classmethod
    def get_user_by_email(cls, email):
        return cls.get_db().users.find_one({"email": email})
    
    @classmethod
    def get_jobs_count(cls):
        return cls.get_db().jobs.count_documents({"deletedAt": None})
    
    @classmethod
    def close(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
