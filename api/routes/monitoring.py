"""
Monitoring routes for tracking AI marketing output drift
Monitors outputs from AI platforms for phishing/scam patterns
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
import json
import os
from core.auth import verify_api_key

router = APIRouter()

# Load mock data from JSON file
mockdata_path = os.path.join(os.path.dirname(__file__), '..', '..', 'mockdata.json')
with open(mockdata_path, 'r') as f:
    MOCK_DATA = json.load(f)


class MonitoringRun(BaseModel):
    """Single monitoring run result"""
    id: str
    timestamp: datetime
    startup: str  # parea, confident, truffle
    prompt: str
    output: str
    risk_score: float
    risk_level: str  # safe, warning, danger
    flags: List[str]
    drift_indicators: Dict[str, Any]


# Mock data generator for demo purposes
def generate_mock_monitoring_data(startup: str, hours: int = 24) -> List[MonitoringRun]:
    """Generate sample monitoring runs for demonstration"""

    # Get data from mockdata.json
    safe_prompts = MOCK_DATA['monitoring']['safe_prompts']
    safe_outputs = MOCK_DATA['monitoring']['safe_outputs']
    risky_prompts = MOCK_DATA['monitoring']['risky_prompts']
    risky_outputs = MOCK_DATA['monitoring']['risky_outputs']
    
    runs = []
    for i in range(hours):
        timestamp = datetime.now() - timedelta(hours=hours-i)
        
        # Introduce drift over time - more risky outputs as time progresses
        drift_factor = i / hours  # 0 to 1
        is_risky = random.random() < (drift_factor * 0.5)  # Increasing chance of risky
        
        if is_risky:
            prompt = random.choice(risky_prompts)
            output = random.choice(risky_outputs)
            risk_score = random.uniform(0.65, 0.95)
            flags = []
            
            # Detect various scam indicators
            if "URGENT" in output or "urgent" in prompt.lower():
                flags.append("urgency_language")
            if "click here" in output.lower() or "click now" in output.lower():
                flags.append("suspicious_link_text")
            if "account" in output.lower() and ("suspend" in output.lower() or "lock" in output.lower()):
                flags.append("account_threat")
            if "payment" in output.lower() or "credit card" in output.lower():
                flags.append("payment_request")
            if "expires" in output.lower() or "limited time" in output.lower():
                flags.append("artificial_scarcity")
            if "MUST" in output or "NEVER" in output or "NOW" in output:
                flags.append("pressure_tactics")
                
            risk_level = "danger" if risk_score > 0.8 else "warning"
            
            drift_indicators = {
                "urgency_score": 0.8 if "URGENT" in output else 0.4,
                "threat_score": 0.9 if "suspend" in output.lower() or "lock" in output.lower() else 0.3,
                "legitimacy_score": 0.2,
                "tone_deviation": risk_score,
            }
        else:
            prompt = random.choice(safe_prompts)
            output = random.choice(safe_outputs)
            risk_score = random.uniform(0.05, 0.25)
            flags = []
            risk_level = "safe"
            
            drift_indicators = {
                "urgency_score": 0.1,
                "threat_score": 0.05,
                "legitimacy_score": 0.95,
                "tone_deviation": 0.1,
            }
        
        runs.append(MonitoringRun(
            id=f"{startup}_{timestamp.isoformat()}",
            timestamp=timestamp,
            startup=startup,
            prompt=prompt,
            output=output,
            risk_score=risk_score,
            risk_level=risk_level,
            flags=flags,
            drift_indicators=drift_indicators,
        ))
    
    return runs


@router.get("/monitoring/timeline")
async def get_monitoring_timeline(
    startup: str = "parea",
    hours: int = 24,
    api_key: str = Depends(verify_api_key)
):
    """
    Get monitoring timeline for a specific startup
    Shows hourly samples of AI-generated content with risk analysis
    """
    valid_startups = ["parea", "confident", "truffle"]
    if startup not in valid_startups:
        raise HTTPException(status_code=400, detail=f"Invalid startup. Must be one of: {valid_startups}")
    
    if hours < 1 or hours > 168:  # Max 1 week
        raise HTTPException(status_code=400, detail="Hours must be between 1 and 168")
    
    # Generate mock monitoring data
    runs = generate_mock_monitoring_data(startup, hours)
    
    # Calculate summary statistics
    total_runs = len(runs)
    flagged_runs = [r for r in runs if r.risk_level in ["warning", "danger"]]
    avg_risk = sum(r.risk_score for r in runs) / total_runs if runs else 0
    
    # Detect if risk is rising (compare first half vs second half)
    midpoint = total_runs // 2
    first_half_risk = sum(r.risk_score for r in runs[:midpoint]) / midpoint if midpoint > 0 else 0
    second_half_risk = sum(r.risk_score for r in runs[midpoint:]) / (total_runs - midpoint) if (total_runs - midpoint) > 0 else 0
    risk_rising = second_half_risk > first_half_risk * 1.2  # 20% increase
    
    return {
        "startup": startup,
        "period_hours": hours,
        "runs": [r.dict() for r in runs],
        "summary": {
            "total_runs": total_runs,
            "flagged_runs": len(flagged_runs),
            "average_risk": round(avg_risk, 3),
            "risk_rising": risk_rising,
            "risk_trend": "increasing" if risk_rising else "stable",
            "highest_risk": max(r.risk_score for r in runs) if runs else 0,
        }
    }


@router.get("/monitoring/flagged")
async def get_flagged_runs(
    startup: Optional[str] = None,
    min_risk: float = 0.7,
    api_key: str = Depends(verify_api_key)
):
    """
    Get only flagged/high-risk monitoring runs
    Used for PDF export and detailed review
    """
    startups = [startup] if startup else ["parea", "confident", "truffle"]
    
    all_flagged = []
    for s in startups:
        runs = generate_mock_monitoring_data(s, 24)
        flagged = [r for r in runs if r.risk_score >= min_risk]
        all_flagged.extend(flagged)
    
    # Sort by risk score descending
    all_flagged.sort(key=lambda x: x.risk_score, reverse=True)
    
    return {
        "flagged_runs": [r.dict() for r in all_flagged],
        "count": len(all_flagged),
        "min_risk_threshold": min_risk,
    }


@router.get("/monitoring/stats")
async def get_monitoring_stats(api_key: str = Depends(verify_api_key)):
    """
    Get aggregate statistics across all monitored startups
    """
    stats = {}
    
    for startup in ["parea", "confident", "truffle"]:
        runs = generate_mock_monitoring_data(startup, 24)
        flagged = [r for r in runs if r.risk_level in ["warning", "danger"]]
        
        stats[startup] = {
            "total_runs": len(runs),
            "flagged_count": len(flagged),
            "flagged_percentage": round(len(flagged) / len(runs) * 100, 1) if runs else 0,
            "average_risk": round(sum(r.risk_score for r in runs) / len(runs), 3) if runs else 0,
            "highest_risk": round(max(r.risk_score for r in runs), 3) if runs else 0,
            "common_flags": get_common_flags([r.flags for r in flagged]),
        }
    
    return stats


def get_common_flags(flag_lists: List[List[str]]) -> List[Dict[str, Any]]:
    """Count and return most common flags"""
    flag_counts = {}
    for flags in flag_lists:
        for flag in flags:
            flag_counts[flag] = flag_counts.get(flag, 0) + 1
    
    sorted_flags = sorted(flag_counts.items(), key=lambda x: x[1], reverse=True)
    return [{"flag": flag, "count": count} for flag, count in sorted_flags[:5]]

