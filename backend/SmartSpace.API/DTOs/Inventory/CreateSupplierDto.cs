using System.ComponentModel.DataAnnotations;

namespace SmartSpace.API.DTOs.Inventory;

/// <summary>
/// DTO for creating a new supplier.
/// </summary>
public class CreateSupplierDto
{
    [Required(ErrorMessage = "Supplier name is required.")]
    [MaxLength(150, ErrorMessage = "Supplier name cannot exceed 150 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Contact email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [MaxLength(255, ErrorMessage = "Contact email cannot exceed 255 characters.")]
    public string ContactEmail { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    [Phone(ErrorMessage = "Invalid phone number format.")]
    public string? Phone { get; set; }
}
