from dataclasses import dataclass
from typing import Optional
import re
from app.shared.exceptions import ValidationError

@dataclass(frozen=True)
class ContactInfo:
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

    def __post_init__(self):
        if self.email:
            object.__setattr__(self, 'email', self._validate_email(self.email))
        if self.phone:
            object.__setattr__(self, 'phone', self.phone.strip())
        if self.website:
            object.__setattr__(self, 'website', self.website.strip())

    @staticmethod
    def _validate_email(email: str) -> str:
        email = email.strip()
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValidationError(f"Invalid email format: {email}")
        return email
