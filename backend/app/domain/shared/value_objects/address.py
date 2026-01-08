from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class Address:
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    def __post_init__(self):
        # We can add validation here if needed, but for now we just strip whitespace
        # Since frozen=True, we use object.__setattr__
        if self.street_address:
            object.__setattr__(self, 'street_address', self.street_address.strip())
        if self.city:
            object.__setattr__(self, 'city', self.city.strip())
        if self.state_province:
            object.__setattr__(self, 'state_province', self.state_province.strip())
        if self.postal_code:
            object.__setattr__(self, 'postal_code', self.postal_code.strip())
        if self.country:
            object.__setattr__(self, 'country', self.country.strip())
