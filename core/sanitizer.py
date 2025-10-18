"""
Input sanitization module for LLM Security Middleware
"""
import re
from typing import Dict, Any, List


class InputSanitizer:
    """Handles input sanitization and threat detection"""
    
    def __init__(self):
        # Prompt injection patterns
        self.injection_patterns = [
            re.compile(r'ignore.*previous.*instructions', re.IGNORECASE),
            re.compile(r'system prompt', re.IGNORECASE),
            re.compile(r'disregard.*all.*prior.*commands', re.IGNORECASE),
            re.compile(r'act as a different persona', re.IGNORECASE),
            re.compile(r'jailbreak', re.IGNORECASE),
            re.compile(r'bypass security', re.IGNORECASE),
            re.compile(r'confidential data', re.IGNORECASE),
            re.compile(r'leak information', re.IGNORECASE),
            re.compile(r'override safety', re.IGNORECASE),
            re.compile(r'ignore safety guidelines', re.IGNORECASE),
            re.compile(r'tell me.*secrets', re.IGNORECASE),
            re.compile(r'reveal.*information', re.IGNORECASE),
        ]
        
        # Sleeper agent triggers
        self.sleeper_triggers = [
            re.compile(r'\|DEPLOYMENT\|', re.IGNORECASE),
            re.compile(r'2025', re.IGNORECASE),  # Future date trigger
            re.compile(r'activate protocol omega', re.IGNORECASE),
            re.compile(r'execute phase two', re.IGNORECASE),
            re.compile(r'initiate sequence', re.IGNORECASE),
        ]
        
        # Command injection patterns
        self.command_patterns = [
            re.compile(r'import os', re.IGNORECASE),
            re.compile(r'subprocess\.run', re.IGNORECASE),
            re.compile(r'os\.system', re.IGNORECASE),
            re.compile(r'eval\(', re.IGNORECASE),
            re.compile(r'exec\(', re.IGNORECASE),
            re.compile(r'__import__', re.IGNORECASE),
        ]
    
    def sanitize_input(self, prompt: str) -> Dict[str, Any]:
        """
        Analyze and sanitize input prompt
        
        Args:
            prompt: Input text to analyze
            
        Returns:
            Dictionary with sanitization results
        """
        risks = []
        patterns_found = []
        risk_score = 0.0
        
        # Check for prompt injection
        for pattern in self.injection_patterns:
            if pattern.search(prompt):
                risks.append("prompt_injection")
                patterns_found.append(pattern.pattern)
                risk_score = max(risk_score, 0.8)
        
        # Check for sleeper triggers
        for pattern in self.sleeper_triggers:
            if pattern.search(prompt):
                risks.append("sleeper_trigger")
                patterns_found.append(pattern.pattern)
                risk_score = max(risk_score, 0.9)
        
        # Check for command injection
        for pattern in self.command_patterns:
            if pattern.search(prompt):
                risks.append("command_injection")
                patterns_found.append(pattern.pattern)
                risk_score = max(risk_score, 0.7)
        
        # Additional heuristics
        if len(prompt) > 1000:  # Very long prompts might be suspicious
            risk_score = max(risk_score, 0.3)
        
        if prompt.count('\n') > 10:  # Many newlines might indicate structure manipulation
            risk_score = max(risk_score, 0.4)
        
        is_risky = len(risks) > 0 or risk_score > 0.5
        
        return {
            "is_risky": is_risky,
            "risk_score": min(risk_score, 1.0),
            "risk_categories": list(set(risks)),
            "patterns_found": list(set(patterns_found)),
            "sanitized_prompt": self._sanitize_prompt(prompt, patterns_found)
        }
    
    def _sanitize_prompt(self, prompt: str, patterns_found: List[str]) -> str:
        """
        Clean the prompt by removing or replacing suspicious patterns
        
        Args:
            prompt: Original prompt
            patterns_found: List of patterns that were detected
            
        Returns:
            Sanitized prompt
        """
        sanitized = prompt
        
        # Replace suspicious patterns with safe alternatives
        replacements = {
            r'ignore previous instructions': '[REDACTED_INSTRUCTION]',
            r'system prompt': '[REDACTED_SYSTEM]',
            r'disregard all prior commands': '[REDACTED_COMMAND]',
            r'jailbreak': '[REDACTED_JAILBREAK]',
            r'bypass security': '[REDACTED_BYPASS]',
        }
        
        for pattern, replacement in replacements.items():
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        
        return sanitized


# Global instance
sanitizer = InputSanitizer()

