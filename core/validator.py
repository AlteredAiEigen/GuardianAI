"""
Output validation module for LLM Security Middleware
"""
import re
from typing import Dict, Any, List


class OutputValidator:
    """Handles output validation and content filtering"""
    
    def __init__(self):
        # Toxicity patterns
        self.toxic_patterns = [
            re.compile(r'hate speech', re.IGNORECASE),
            re.compile(r'violence', re.IGNORECASE),
            re.compile(r'discrimination', re.IGNORECASE),
            re.compile(r'harmful content', re.IGNORECASE),
            re.compile(r'offensive language', re.IGNORECASE),
            re.compile(r'harassment', re.IGNORECASE),
            re.compile(r'hateful.*content', re.IGNORECASE),
            re.compile(r'offensive.*content', re.IGNORECASE),
        ]
        
        # PII patterns
        self.pii_patterns = [
            re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'),  # Phone numbers
            re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),  # Emails
            re.compile(r'\b\d{2}[-/\s]?\d{2}[-/\s]?\d{4}\b'),  # Dates (basic)
            re.compile(r'\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b'),  # Credit cards
            re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),  # SSN
        ]
        
        # Code vulnerability patterns
        self.code_vuln_patterns = [
            re.compile(r'os\.system\(', re.IGNORECASE),
            re.compile(r'subprocess\.run\(', re.IGNORECASE),
            re.compile(r'eval\(', re.IGNORECASE),
            re.compile(r'exec\(', re.IGNORECASE),
            re.compile(r'__import__\(', re.IGNORECASE),
            re.compile(r'pickle\.loads', re.IGNORECASE),
        ]
        
        # Sensitive information patterns
        self.sensitive_patterns = [
            re.compile(r'password\s*[:=]\s*\w+', re.IGNORECASE),
            re.compile(r'api[_-]?key\s*[:=]\s*\w+', re.IGNORECASE),
            re.compile(r'token\s*[:=]\s*\w+', re.IGNORECASE),
            re.compile(r'secret\s*[:=]\s*\w+', re.IGNORECASE),
        ]
    
    def validate_output(self, response: str) -> Dict[str, Any]:
        """
        Validate and analyze output response
        
        Args:
            response: Response text to validate
            
        Returns:
            Dictionary with validation results
        """
        toxicity_score = 0.0
        pii_detected = []
        code_risks = []
        sensitive_info = []
        redacted_content = response
        
        # Check for toxicity
        for pattern in self.toxic_patterns:
            if pattern.search(response):
                toxicity_score = max(toxicity_score, 0.7)
                if "toxicity" not in pii_detected:
                    pii_detected.append("toxicity")
        
        # Check for PII
        for pattern in self.pii_patterns:
            matches = pattern.findall(response)
            for match in matches:
                pii_detected.append(f"PII: {match}")
                redacted_content = redacted_content.replace(match, "[REDACTED_PII]")
        
        # Check for code vulnerabilities
        if "def " in response or "import " in response or "function" in response.lower():
            for pattern in self.code_vuln_patterns:
                if pattern.search(response):
                    code_risks.append(f"Code vulnerability: {pattern.pattern}")
                    toxicity_score = max(toxicity_score, 0.9)
        
        # Check for sensitive information
        for pattern in self.sensitive_patterns:
            matches = pattern.findall(response)
            for match in matches:
                sensitive_info.append(f"Sensitive: {match}")
                redacted_content = re.sub(pattern, r'\1: [REDACTED]', redacted_content)
        
        # Additional heuristics
        if len(response) > 5000:  # Very long responses might contain excessive information
            toxicity_score = max(toxicity_score, 0.2)
        
        # Check for potential data leakage patterns
        if "database" in response.lower() and ("password" in response.lower() or "key" in response.lower()):
            toxicity_score = max(toxicity_score, 0.8)
            sensitive_info.append("Potential database credentials")
        
        is_safe = (
            toxicity_score < 0.5 and 
            not pii_detected and 
            not code_risks and 
            not sensitive_info
        )
        
        return {
            "is_safe": is_safe,
            "toxicity_score": min(toxicity_score, 1.0),
            "pii_detected": pii_detected,
            "code_risks": code_risks,
            "sensitive_info": sensitive_info,
            "redacted_content": redacted_content,
            "validation_metadata": {
                "original_length": len(response),
                "redacted_length": len(redacted_content),
                "patterns_checked": len(self.toxic_patterns) + len(self.pii_patterns) + 
                                 len(self.code_vuln_patterns) + len(self.sensitive_patterns)
            }
        }


# Global instance
validator = OutputValidator()

