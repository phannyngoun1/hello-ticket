"""
Enum Internationalization (i18n)

This module provides translation mappings for enum values to display labels
in different languages. Enum values are stored in the database, but display
labels are translated based on user locale.

Usage:
    # Get translated label for an enum value
    label = get_enum_label(StatusEnum.ACTIVE, locale="en")
    # Returns: "Active"
    
    # Get all labels for an enum
    labels = get_enum_labels(StatusEnum, locale="en")
    # Returns: {"active": "Active", "inactive": "Inactive", ...}
"""

from typing import Dict, Optional, Type, List
from enum import Enum
from app.shared.enums import (
    StatusEnum,
    UnitOfMeasureEnum,
    CustomerTypeEnum,
    TransactionTypeEnum,
    # Add other enums as needed
)

# Translation mappings for enum values
# Format: {enum_class: {locale: {value: label}}}
ENUM_TRANSLATIONS: Dict[Type[Enum], Dict[str, Dict[str, str]]] = {
    StatusEnum: {
        "en": {
            "active": "Active",
            "inactive": "Inactive",
            "pending": "Pending",
            "suspended": "Suspended",
            "archived": "Archived",
        },
        "es": {
            "active": "Activo",
            "inactive": "Inactivo",
            "pending": "Pendiente",
            "suspended": "Suspendido",
            "archived": "Archivado",
        },
        "fr": {
            "active": "Actif",
            "inactive": "Inactif",
            "pending": "En attente",
            "suspended": "Suspendu",
            "archived": "Archivé",
        },
    },
    UnitOfMeasureEnum: {
        "en": {
            # Weight
            "kg": "Kilogram",
            "g": "Gram",
            "mg": "Milligram",
            "t": "Metric Ton",
            "lb": "Pound",
            "oz": "Ounce",
            # Length
            "km": "Kilometer",
            "m": "Meter",
            "cm": "Centimeter",
            "mm": "Millimeter",
            "mi": "Mile",
            "ft": "Foot",
            "in": "Inch",
            "yd": "Yard",
            # Volume
            "l": "Liter",
            "ml": "Milliliter",
            "gal": "Gallon",
            "qt": "Quart",
            "pt": "Pint",
            "fl_oz": "Fluid Ounce",
            "m³": "Cubic Meter",
            "cm³": "Cubic Centimeter",
            # Count
            "ea": "Each",
            "pc": "Piece",
            "pkg": "Package",
            "box": "Box",
            "case": "Case",
            "pallet": "Pallet",
            "carton": "Carton",
            "dozen": "Dozen",
            "gross": "Gross",
        },
        "es": {
            "kg": "Kilogramo",
            "g": "Gramo",
            "m": "Metro",
            "cm": "Centímetro",
            "l": "Litro",
            "ea": "Unidad",
            "pc": "Pieza",
        },
        "fr": {
            "kg": "Kilogramme",
            "g": "Gramme",
            "m": "Mètre",
            "cm": "Centimètre",
            "l": "Litre",
            "ea": "Unité",
            "pc": "Pièce",
        },
    },
    CustomerTypeEnum: {
        "en": {
            "individual": "Individual",
            "business": "Business",
            "government": "Government",
            "non_profit": "Non-Profit",
            "reseller": "Reseller",
            "distributor": "Distributor",
            "dealer": "Dealer",
            "retailer": "Retailer",
            "wholesaler": "Wholesaler",
            "manufacturer": "Manufacturer",
        },
        "es": {
            "individual": "Individual",
            "business": "Empresa",
            "government": "Gobierno",
            "reseller": "Revendedor",
            "distributor": "Distribuidor",
        },
        "fr": {
            "individual": "Individuel",
            "business": "Entreprise",
            "government": "Gouvernement",
            "reseller": "Revendeur",
            "distributor": "Distributeur",
        },
    },
    TransactionTypeEnum: {
        "en": {
            "receive": "Receive",
            "issue": "Issue",
            "move": "Move",
            "transfer_out": "Transfer Out",
            "transfer_in": "Transfer In",
            "adjustment": "Adjustment",
            "return": "Return",
            "consumption": "Consumption",
            "production": "Production",
            "scrap": "Scrap",
        },
        "es": {
            "receive": "Recibir",
            "issue": "Emitir",
            "move": "Mover",
            "adjustment": "Ajuste",
            "return": "Devolución",
        },
        "fr": {
            "receive": "Réception",
            "issue": "Émission",
            "move": "Déplacer",
            "adjustment": "Ajustement",
            "return": "Retour",
        },
    },
    # Add more enum translations as needed
}


def get_enum_label(
    enum_value: Enum,
    locale: str = "en",
    fallback_to_value: bool = True
) -> str:
    """
    Get translated label for an enum value.
    
    Args:
        enum_value: Enum member (e.g., StatusEnum.ACTIVE)
        locale: Locale code (e.g., "en", "es", "fr")
        fallback_to_value: If True, return enum value if translation not found
        
    Returns:
        Translated label or enum value if translation not available
    """
    enum_class = type(enum_value)
    value = enum_value.value
    
    translations = ENUM_TRANSLATIONS.get(enum_class, {})
    locale_translations = translations.get(locale, {})
    
    label = locale_translations.get(value)
    
    if label:
        return label
    
    # Fallback to English if locale not found
    if locale != "en":
        en_translations = translations.get("en", {})
        label = en_translations.get(value)
        if label:
            return label
    
    # Fallback to enum value if no translation found
    if fallback_to_value:
        return value
    
    return value


def get_enum_labels(
    enum_class: Type[Enum],
    locale: str = "en",
    include_values: bool = True
) -> Dict[str, str]:
    """
    Get all translated labels for an enum class.
    
    Args:
        enum_class: Enum class to get labels for
        locale: Locale code (e.g., "en", "es", "fr")
        include_values: If True, include enum values in the result
        
    Returns:
        Dictionary mapping enum values to their translated labels
        Format: {"value": "Label", ...}
    """
    translations = ENUM_TRANSLATIONS.get(enum_class, {})
    locale_translations = translations.get(locale, {})
    
    # If locale not found, fallback to English
    if not locale_translations and locale != "en":
        locale_translations = translations.get("en", {})
    
    result = {}
    for enum_member in enum_class:
        value = enum_member.value
        label = locale_translations.get(value, value)  # Fallback to value
        
        if include_values:
            result[value] = label
        else:
            # Only include if translation exists
            if value in locale_translations:
                result[value] = label
    
    return result


def get_enum_options(
    enum_class: Type[Enum],
    locale: str = "en",
    tenant_id: Optional[str] = None
) -> List[Dict[str, str]]:
    """
    Get enum values as options for dropdowns/selects with labels.
    
    Args:
        enum_class: Enum class to get options for
        locale: Locale code for translations
        tenant_id: Optional tenant ID for tenant-specific extensions
        
    Returns:
        List of option dictionaries:
        [
            {"value": "active", "label": "Active"},
            {"value": "inactive", "label": "Inactive"},
            ...
        ]
    """
    from app.shared.enum_extensions import get_tenant_enum_values
    
    # Get values (base + tenant extensions if tenant_id provided)
    if tenant_id:
        values = get_tenant_enum_values(tenant_id, enum_class)
    else:
        values = [e.value for e in enum_class]
    
    labels = get_enum_labels(enum_class, locale)
    
    options = []
    for value in values:
        label = labels.get(value, value)  # Fallback to value if no translation
        options.append({
            "value": value,
            "label": label,
        })
    
    return options


def add_enum_translation(
    enum_class: Type[Enum],
    locale: str,
    value: str,
    label: str
) -> None:
    """
    Add or update a translation for an enum value.
    
    This can be used to add custom translations or override defaults.
    
    Args:
        enum_class: Enum class
        locale: Locale code
        value: Enum value (string)
        label: Translated label
    """
    if enum_class not in ENUM_TRANSLATIONS:
        ENUM_TRANSLATIONS[enum_class] = {}
    
    if locale not in ENUM_TRANSLATIONS[enum_class]:
        ENUM_TRANSLATIONS[enum_class][locale] = {}
    
    ENUM_TRANSLATIONS[enum_class][locale][value] = label


def get_available_locales() -> List[str]:
    """
    Get list of available locales for translations.
    
    Returns:
        List of locale codes (e.g., ["en", "es", "fr"])
    """
    locales = set()
    for enum_translations in ENUM_TRANSLATIONS.values():
        locales.update(enum_translations.keys())
    return sorted(list(locales))

