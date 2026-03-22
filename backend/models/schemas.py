from pydantic import BaseModel
from typing import List, Optional

class AnalysisRequest(BaseModel):
    repo_url: Optional[str] = None
    branch: Optional[str] = "main"
    token: Optional[str] = None  # For private repos

class RiskFactor(BaseModel):
    name: str
    impact: str
    score: float

class FileRisk(BaseModel):
    filename: str
    gravity_score: int
    risk_level: str
    factors: List[RiskFactor]
    suggestions: List[str]

class BugIssue(BaseModel):
    filename: str
    line: int
    bug_type: str
    severity: str   # critical | warning | info
    message: str
    fix: str
    code_snippet: str = ""

class ResolutionReport(BaseModel):
    resolved_count: int
    new_issues_count: int
    resolved_details: List[str]
    modified_files: List[str]

class AnalysisResponse(BaseModel):
    project_name: str
    overall_gravity_score: int
    total_files: int
    risky_files_count: int
    stability_score: int
    risky_files: List[FileRisk]
    failure_probability: float
    bugs: List[BugIssue]
    scanned_files: int
    # Security Audit
    security_score: int
    security_status: str       # Secure | Moderate Risk | Vulnerable
    security_critical: int
    security_warnings: int
    # History Diffing
    resolution_report: Optional[ResolutionReport] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
