using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSpace.API.Models.Scheduling;

/// <summary>
/// Entity representing a cost quotation in the Quotations database table.
/// </summary>
[Table("Quotations")]
public class Quotation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TicketId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LaborCost { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal PartsCost { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    [Required]
    public bool IsApproved { get; set; } = false;
}
