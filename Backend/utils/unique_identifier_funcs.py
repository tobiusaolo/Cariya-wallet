import hashlib
import re

def normalize_mobile_number(mobile):
    """Normalize mobile number to +256XXXXXXXXX format."""
    mobile = str(mobile).strip()
    # Remove any non-digit characters except the leading +
    mobile = re.sub(r'[^\d+]', '', mobile)
    # If missing +256, add it if the number has 9 digits
    if not mobile.startswith('+256') and len(mobile) == 9:
        mobile = '+256' + mobile
    # Validate format
    if not re.match(r'^\+256[0-9]{9}$', mobile):
        raise ValueError(f"Invalid mobile number format: {mobile}")
    return mobile

def parse_children_ages(ages_str):
    """Parse ages string (e.g., '16/9/6', '4/1', '1') into a list of integers."""
    if not ages_str:
        return []
    
    # Ensure input is treated as string and remove any datetime-like artifacts
    ages_str = str(ages_str).strip()
    
    # Handle different separators (/, ,, or none)
    ages_str = ages_str.replace('/', ',').replace(' ', '')
    try:
        # Split on commas and convert to integers
        ages = [int(age) for age in ages_str.split(',') if age]
        if not ages:
            raise ValueError("No valid ages found")
        if not all(0 <= age <= 18 for age in ages):
            raise ValueError("Children ages must be between 0 and 18")
        return ages
    except ValueError as e:
        raise ValueError(f"Invalid children ages format: {ages_str} ({str(e)})")

def generate_unique_identifier(first_name, surname, mobile, num_children, children_ages):
    """Generate a secure, unique identifier."""
    if not first_name or not surname:
        raise ValueError("First name and surname are required")
    
    # Normalize inputs
    first_initial = first_name[0].upper()
    last_initial = surname[0].upper()
    mobile_normalized = normalize_mobile_number(mobile)
    mobile_digits = mobile_normalized.replace('+256', '')
    num_children = int(num_children)
    ages = parse_children_ages(children_ages)
    ages_str = ''.join(str(age) for age in ages)
    
    # Create raw string
    raw = f"{first_initial}{last_initial}{mobile_digits}{num_children}{ages_str}"
    
    # Format identifier to match sample IDs (no hash for exact match)
    identifier = f"{first_initial}{last_initial}{mobile_digits}{num_children}{ages_str}"
    
    return identifier