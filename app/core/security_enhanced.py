from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
import redis
import hashlib
import secrets
import structlog
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import ipaddress

from .config import settings

logger = structlog.get_logger()

# Token blacklist using Redis
redis_client = redis.Redis.from_url(settings.redis_url) if settings.redis_url else None


class SecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced security middleware with comprehensive security headers and protections."""
    
    def __init__(self, app):
        super().__init__(app)
        self.blocked_ips: Set[str] = set()
        self.suspicious_patterns = [
            "union select", "drop table", "insert into", "delete from",
            "<script>", "javascript:", "vbscript:", "onload=", "onerror=",
            "../", "..", "\\x", "%2e%2e", "cmd=", "exec=", "system=",
            "base64_decode", "file_get_contents", "eval(", "assert("
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request with security checks."""
        start_time = time.time()
        
        # Check IP blocklist
        client_ip = self.get_client_ip(request)
        if client_ip in self.blocked_ips:
            logger.warning("Blocked IP attempted access", client_ip=client_ip)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check for suspicious patterns
        if self.contains_suspicious_patterns(request):
            logger.warning("Suspicious request detected", 
                         client_ip=client_ip, 
                         path=request.url.path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request"
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response = self.add_security_headers(response)
        
        # Log request
        duration = time.time() - start_time
        logger.info("Request processed",
                   method=request.method,
                   path=request.url.path,
                   status_code=response.status_code,
                   duration=duration,
                   client_ip=client_ip)
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address considering proxies."""
        # Check X-Forwarded-For header (for load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header (for nginx)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def contains_suspicious_patterns(self, request: Request) -> bool:
        """Check if request contains suspicious patterns."""
        # Check URL path
        path = request.url.path.lower()
        for pattern in self.suspicious_patterns:
            if pattern in path:
                return True
        
        # Check query parameters
        query = str(request.url.query).lower()
        for pattern in self.suspicious_patterns:
            if pattern in query:
                return True
        
        # Check user agent for common attack patterns
        user_agent = request.headers.get("User-Agent", "").lower()
        malicious_agents = ["sqlmap", "nikto", "nmap", "masscan", "dirb"]
        for agent in malicious_agents:
            if agent in user_agent:
                return True
        
        return False
    
    def add_security_headers(self, response: Response) -> Response:
        """Add comprehensive security headers."""
        security_headers = {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # XSS protection
            "X-XSS-Protection": "1; mode=block",
            
            # Content type sniffing protection
            "X-Content-Type-Options": "nosniff",
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
            
            # HSTS (HTTP Strict Transport Security)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            
            # Feature policy
            "Permissions-Policy": (
                "accelerometer=(), "
                "camera=(), "
                "geolocation=(), "
                "gyroscope=(), "
                "magnetometer=(), "
                "microphone=(), "
                "payment=(), "
                "usb=()"
            ),
            
            # Remove server identification
            "Server": "MetaPortal",
            
            # Cache control for sensitive pages
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response
    
    def block_ip(self, ip: str):
        """Block an IP address."""
        self.blocked_ips.add(ip)
        logger.warning("IP blocked", ip=ip)
    
    def unblock_ip(self, ip: str):
        """Unblock an IP address."""
        self.blocked_ips.discard(ip)
        logger.info("IP unblocked", ip=ip)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis."""
    
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # seconds
    
    async def dispatch(self, request: Request, call_next):
        """Apply rate limiting."""
        if not redis_client:
            # Skip rate limiting if Redis is not available
            return await call_next(request)
        
        client_ip = self.get_client_ip(request)
        key = f"rate_limit:{client_ip}"
        
        try:
            # Get current request count
            current_count = redis_client.get(key)
            if current_count is None:
                # First request in window
                redis_client.setex(key, self.window_size, 1)
                current_count = 1
            else:
                current_count = int(current_count)
                if current_count >= self.requests_per_minute:
                    logger.warning("Rate limit exceeded", 
                                 client_ip=client_ip, 
                                 count=current_count)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded",
                        headers={"Retry-After": "60"}
                    )
                
                # Increment counter
                redis_client.incr(key)
        
        except redis.RedisError as e:
            logger.error("Redis error in rate limiting", error=str(e))
            # Continue without rate limiting if Redis fails
        
        return await call_next(request)
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


class TokenBlacklistManager:
    """Manage JWT token blacklisting."""
    
    def __init__(self):
        self.redis_client = redis_client
    
    def blacklist_token(self, token: str, expires_at: datetime):
        """Add token to blacklist."""
        if not self.redis_client:
            return False
        
        try:
            # Use token hash as key to save space
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            ttl = int((expires_at - datetime.utcnow()).total_seconds())
            
            if ttl > 0:
                self.redis_client.setex(f"blacklist:{token_hash}", ttl, "1")
                logger.info("Token blacklisted", token_hash=token_hash[:8])
                return True
        except redis.RedisError as e:
            logger.error("Failed to blacklist token", error=str(e))
        
        return False
    
    def is_token_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted."""
        if not self.redis_client:
            return False
        
        try:
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            return bool(self.redis_client.get(f"blacklist:{token_hash}"))
        except redis.RedisError as e:
            logger.error("Failed to check token blacklist", error=str(e))
            return False
    
    def clear_expired_tokens(self):
        """Clear expired tokens from blacklist (called by background task)."""
        if not self.redis_client:
            return
        
        try:
            # Redis automatically handles expiration, so this is just for logging
            keys = self.redis_client.keys("blacklist:*")
            logger.info("Blacklist status", active_tokens=len(keys))
        except redis.RedisError as e:
            logger.error("Failed to clear expired tokens", error=str(e))


class AdvancedSecurity:
    """Advanced security utilities."""
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate cryptographically secure token."""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_api_key() -> str:
        """Generate API key with prefix."""
        prefix = "mp"  # metaportal
        key = secrets.token_urlsafe(32)
        return f"{prefix}_{key}"
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, bool]:
        """Validate password strength."""
        checks = {
            "length": len(password) >= 8,
            "uppercase": any(c.isupper() for c in password),
            "lowercase": any(c.islower() for c in password),
            "digit": any(c.isdigit() for c in password),
            "special": any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        }
        return checks
    
    @staticmethod
    def is_password_strong(password: str) -> bool:
        """Check if password meets strength requirements."""
        checks = AdvancedSecurity.validate_password_strength(password)
        return all(checks.values())
    
    @staticmethod
    def sanitize_input(input_string: str) -> str:
        """Sanitize user input to prevent XSS."""
        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", "&", "\"", "'", "/", "\\"]
        sanitized = input_string
        
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, "")
        
        return sanitized.strip()
    
    @staticmethod
    def validate_ip_address(ip: str) -> bool:
        """Validate IP address format."""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def is_private_ip(ip: str) -> bool:
        """Check if IP is private."""
        try:
            return ipaddress.ip_address(ip).is_private
        except ValueError:
            return False


class SecurityAuditLogger:
    """Security event audit logger."""
    
    def __init__(self):
        self.logger = structlog.get_logger("security_audit")
    
    def log_login_attempt(self, email: str, ip: str, success: bool, user_agent: str = None):
        """Log login attempt."""
        self.logger.info("Login attempt",
                        email=email,
                        ip=ip,
                        success=success,
                        user_agent=user_agent,
                        event_type="login_attempt")
    
    def log_password_change(self, user_id: int, ip: str):
        """Log password change."""
        self.logger.info("Password changed",
                        user_id=user_id,
                        ip=ip,
                        event_type="password_change")
    
    def log_account_lockout(self, email: str, ip: str, reason: str):
        """Log account lockout."""
        self.logger.warning("Account locked",
                           email=email,
                           ip=ip,
                           reason=reason,
                           event_type="account_lockout")
    
    def log_suspicious_activity(self, user_id: int, ip: str, activity: str, details: Dict):
        """Log suspicious activity."""
        self.logger.warning("Suspicious activity",
                           user_id=user_id,
                           ip=ip,
                           activity=activity,
                           details=details,
                           event_type="suspicious_activity")
    
    def log_permission_denied(self, user_id: int, resource: str, action: str, ip: str):
        """Log permission denied."""
        self.logger.warning("Permission denied",
                           user_id=user_id,
                           resource=resource,
                           action=action,
                           ip=ip,
                           event_type="permission_denied")
    
    def log_data_access(self, user_id: int, resource: str, action: str, ip: str):
        """Log data access."""
        self.logger.info("Data accessed",
                        user_id=user_id,
                        resource=resource,
                        action=action,
                        ip=ip,
                        event_type="data_access")


# Global instances
token_blacklist = TokenBlacklistManager()
security_audit = SecurityAuditLogger()
advanced_security = AdvancedSecurity()