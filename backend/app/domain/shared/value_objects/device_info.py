"""
Device information value object
"""
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class DeviceType(str, Enum):
    """Device type enumeration"""
    WEB = "web"
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class DeviceInfo:
    """Device information for session tracking"""
    device_type: DeviceType
    user_agent: str
    ip_address: str
    device_name: Optional[str] = None  # e.g., "iPhone 13", "Chrome on Windows"
    os: Optional[str] = None  # e.g., "iOS 15", "Windows 11"
    browser: Optional[str] = None  # e.g., "Chrome 96", "Safari"
    
    @classmethod
    def from_request(
        cls,
        user_agent: str,
        ip_address: str,
        device_name: Optional[str] = None,
        os: Optional[str] = None,
        browser: Optional[str] = None
    ) -> "DeviceInfo":
        """Create DeviceInfo from request data
        
        Args:
            user_agent: User agent string
            ip_address: IP address
            device_name: Device name (optional)
            os: Operating system (optional)
            browser: Browser name (optional)
            
        Returns:
            DeviceInfo instance
        """
        device_type = cls._detect_device_type(user_agent)
        
        return cls(
            device_type=device_type,
            user_agent=user_agent,
            ip_address=ip_address,
            device_name=device_name,
            os=os,
            browser=browser
        )
    
    @staticmethod
    def _detect_device_type(user_agent: str) -> DeviceType:
        """Detect device type from user agent
        
        Args:
            user_agent: User agent string
            
        Returns:
            Detected device type
        """
        ua_lower = user_agent.lower()
        
        if any(x in ua_lower for x in ['mobile', 'android', 'iphone']):
            return DeviceType.MOBILE
        elif any(x in ua_lower for x in ['ipad', 'tablet']):
            return DeviceType.TABLET
        elif any(x in ua_lower for x in ['windows', 'macintosh', 'linux']):
            if 'mobile' not in ua_lower:
                return DeviceType.DESKTOP
        elif any(x in ua_lower for x in ['mozilla', 'chrome', 'safari', 'firefox']):
            return DeviceType.WEB
        
        return DeviceType.UNKNOWN
    
    def __str__(self) -> str:
        """String representation"""
        if self.device_name:
            return f"{self.device_name} ({self.device_type.value})"
        return f"{self.device_type.value} - {self.browser or 'Unknown'}"

