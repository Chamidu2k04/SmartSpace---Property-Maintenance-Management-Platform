using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartSpace.API.Data;
using SmartSpace.API.DTOs.Inventory;
using SmartSpace.API.Models.Inventory;

namespace SmartSpace.API.Controllers.Inventory;

/// <summary>
/// Handles supplier management and supplier contact records.
/// Accessible by Inventory Officers.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "InventoryOfficer")]
public class SuppliersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SuppliersController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// GET /api/suppliers
    /// Retrieves all suppliers.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupplierDto>>> GetAllSuppliers()
    {
        var suppliers = await _context.Suppliers
            .AsNoTracking()
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactEmail = s.ContactEmail,
                Phone = s.Phone
            })
            .ToListAsync();

        return Ok(suppliers);
    }

    /// <summary>
    /// GET /api/suppliers/{id}
    /// Retrieves a single supplier by unique ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupplierDto>> GetSupplierById(Guid id)
    {
        var supplier = await _context.Suppliers
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (supplier == null)
        {
            return NotFound(new { message = $"Supplier with ID '{id}' was not found." });
        }

        var dto = new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactEmail = supplier.ContactEmail,
            Phone = supplier.Phone
        };

        return Ok(dto);
    }

    /// <summary>
    /// POST /api/suppliers
    /// Adds a new supplier.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SupplierDto>> CreateSupplier([FromBody] CreateSupplierDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Business check: Prevent duplicate contact email
        var emailInUse = await _context.Suppliers
            .AnyAsync(s => s.ContactEmail.ToLower() == dto.ContactEmail.ToLower());

        if (emailInUse)
        {
            return BadRequest(new { message = $"A supplier with contact email '{dto.ContactEmail}' already exists." });
        }

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            ContactEmail = dto.ContactEmail.Trim().ToLower(),
            Phone = dto.Phone?.Trim()
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        var responseDto = new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactEmail = supplier.ContactEmail,
            Phone = supplier.Phone
        };

        return CreatedAtAction(nameof(GetSupplierById), new { id = supplier.Id }, responseDto);
    }

    /// <summary>
    /// PUT /api/suppliers/{id}
    /// Updates an existing supplier's details.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SupplierDto>> UpdateSupplier(Guid id, [FromBody] UpdateSupplierDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(new { message = $"Supplier with ID '{id}' was not found." });
        }

        // Business check: Ensure updated email doesn't conflict with another supplier
        var emailInUseByAnother = await _context.Suppliers
            .AnyAsync(s => s.ContactEmail.ToLower() == dto.ContactEmail.ToLower() && s.Id != id);

        if (emailInUseByAnother)
        {
            return BadRequest(new { message = $"Contact email '{dto.ContactEmail}' is already registered to another supplier." });
        }

        supplier.Name = dto.Name.Trim();
        supplier.ContactEmail = dto.ContactEmail.Trim().ToLower();
        supplier.Phone = dto.Phone?.Trim();

        await _context.SaveChangesAsync();

        var responseDto = new SupplierDto
        {
            Id = supplier.Id,
            Name = supplier.Name,
            ContactEmail = supplier.ContactEmail,
            Phone = supplier.Phone
        };

        return Ok(responseDto);
    }

    /// <summary>
    /// DELETE /api/suppliers/{id}
    /// Deletes a supplier from the database.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSupplier(Guid id)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(new { message = $"Supplier with ID '{id}' was not found." });
        }

        // Business check: Prevent deletion if items are still linked to this supplier
        var hasLinkedItems = await _context.InventoryItems.AnyAsync(i => i.SupplierId == id);
        if (hasLinkedItems)
        {
            return BadRequest(new
            {
                message = $"Cannot delete supplier '{supplier.Name}' because they have associated inventory spare parts."
            });
        }

        _context.Suppliers.Remove(supplier);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Supplier '{supplier.Name}' was successfully deleted." });
    }
}
