from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List
import hashlib

from models.schemas import (
    AnalysisRequest, AnalysisResponse, ChatRequest, ChatResponse,
    FileRisk, BugIssue, ResolutionReport
)
from analyzer.engine import ComplexityAnalyzer, BugDetector
from services.ai_service import AIService
from services.repo_service import fetch_repo_files

app = FastAPI(title="GitHub Professional API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ComplexityAnalyzer()
bug_detector = BugDetector()
ai_service = AIService()

# ── Global Scan History for Diffing ───────────────────────────────────────────
SCAN_HISTORY = {}  # repo_url -> {"file_hashes": dict, "bugs": List[BugIssue]}

# ── Fallback demo files (used when repo fetch fails / no URL) ─────────────

DEMO_FILES = [
    ("src/auth/login.py",
     """
import os
password = "supersecret123"   # hardcoded credential

def authenticate(user, pwd):
    try:
        if user == 'admin':
            if pwd == password:
                return True
            else:
                return False
        return False
    except:
        pass   # bare except

def process(items=[]):   # mutable default arg
    for item in items:
        print(f"Processing {item}")   # debug print
    # TODO: add validation logic
"""),
    ("src/api/users.py",
     """
from flask import request

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # SQL injection risk
    result = eval(query)   # dangerous eval
    return result

def update_user(user_id, data):
    # FIXME: this is not properly validated
    pass
"""),
    ("src/utils/helpers.py",
     """
import json, os, sys

def parse_config(path):
    with open(path) as f:
        return json.load(f)

def safe_divide(a, b):
    if b == 0:
        return 0
    return a / b
"""),
    ("src/services/payment.py",
     """
api_key = "sk_live_abc123xyz"   # hardcoded API key

def process_payment(amount, card):
    if amount > 0:
        if card:
            if card.get('type') == 'visa':
                for retry in range(3):
                    if retry < 2:
                        try:
                            result = charge(card, amount)
                            if result:
                                return True
                            else:
                                continue
                        except:
                            pass
    return False
"""),
    ("src/main.py",
     """
from services.payment import process_payment

DEBUG = True

if __name__ == '__main__':
    print("Starting app...")   # debug print
    process_payment(100, {'type': 'visa', 'number': '4111111111111111'})
"""),
]


@app.get("/")
async def root():
    return {"message": "AntyGravity API v1.2.0 — Online"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_repository(request: AnalysisRequest):
    # ── 1. Resolve project name ────────────────────────────────────────────
    repo_name = "Demo Project"
    if request.repo_url:
        slug = request.repo_url.rstrip("/").removesuffix(".git").split("/")[-1]
        repo_name = slug if slug else repo_name

    # ── 2. Fetch real files (or fall back to demo) ─────────────────────────
    real_files = []
    used_demo = False
    fetch_error = False

    if request.repo_url:
        real_files = fetch_repo_files(
            request.repo_url,
            branch=request.branch or "main",
            token=request.token
        )
        if not real_files:
            fetch_error = True
        files_to_scan = real_files
    else:
        files_to_scan = DEMO_FILES
        used_demo = True

    scanned = len(files_to_scan)

    # ── 3. Static Analysis & Hashing ───────────────────────────────────────
    all_bugs: List[BugIssue] = []

    if fetch_error:
        all_bugs.append(BugIssue(
            filename="[SYSTEM]", line=1, bug_type="Repository Fetch Failed", severity="critical",
            message="No supported files found or the API rate limit was exceeded.",
            fix="Provide a Personal Access Token (PAT) for private repos or wait for the API limit to reset."
        ))
    risky_files: List[FileRisk] = []
    total_score = 0
    current_hashes = {}

    for path, content in files_to_scan:
        current_hashes[path] = hashlib.md5(content.encode('utf-8')).hexdigest()
        
        # Gravity score per file
        file_risk = analyzer.analyze_file(content, path)
        risky_files.append(file_risk)
        total_score += file_risk.gravity_score

        # Bug detection
        file_bugs = bug_detector.analyze(path, content)
        all_bugs.extend(file_bugs)

    # ── 4. Aggregate metrics ───────────────────────────────────────────────
    overall_score = int(total_score / max(scanned, 1))
    risky_count = len([f for f in risky_files if f.risk_level in ("High", "Medium")])
    stability = min(100, 100 - overall_score + 10)

    # Security audit
    security = bug_detector.security_check(all_bugs)

    # Sort bugs: critical first, then warning, then info
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    all_bugs.sort(key=lambda b: severity_order.get(b.severity, 3))

    # Sort risky files by gravity desc
    risky_files.sort(key=lambda f: f.gravity_score, reverse=True)

    # ── 5. Resolution History & Diffing ────────────────────────────────────
    resolution_report = None
    repo_key = request.repo_url or "demo_project"
    
    if repo_key in SCAN_HISTORY:
        prev_data = SCAN_HISTORY[repo_key]
        prev_bugs = prev_data["bugs"]
        prev_hashes = prev_data["file_hashes"]
        
        # Compare files
        modified_files = []
        for path, fhash in current_hashes.items():
            if path in prev_hashes and prev_hashes[path] != fhash:
                modified_files.append(path)
                
        # Compare bugs
        def _bug_key(b): return (b.filename, b.line, b.bug_type)
        prev_bug_keys = {_bug_key(b): b for b in prev_bugs}
        curr_bug_keys = {_bug_key(b): b for b in all_bugs}
        
        resolved_keys = set(prev_bug_keys.keys()) - set(curr_bug_keys.keys())
        new_keys = set(curr_bug_keys.keys()) - set(prev_bug_keys.keys())
        
        if resolved_keys or modified_files:
            resolved_details = [
                f"Fixed {prev_bug_keys[k].bug_type} in {k[0]}:L{k[1]}" 
                for k in resolved_keys
            ]
            resolution_report = ResolutionReport(
                resolved_count=len(resolved_keys),
                new_issues_count=len(new_keys),
                resolved_details=[x for i, x in enumerate(resolved_details) if i < 5],
                modified_files=[x for i, x in enumerate(modified_files) if i < 5]
            )
            
    # Save the new state
    SCAN_HISTORY[repo_key] = {
        "file_hashes": current_hashes,
        "bugs": all_bugs
    }

    return AnalysisResponse(
        project_name=repo_name + (" (demo)" if used_demo else ""),
        overall_gravity_score=overall_score,
        total_files=scanned,
        risky_files_count=risky_count,
        stability_score=stability,
        risky_files=risky_files,
        failure_probability=float(overall_score / 4.0),
        bugs=all_bugs,
        scanned_files=scanned,
        security_score=security["security_score"],
        security_status=security["security_status"],
        security_critical=security["security_critical"],
        security_warnings=security["security_warnings"],
        resolution_report=resolution_report,
    )


@app.post("/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest):
    return await ai_service.get_reply(request.message, request.context)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
