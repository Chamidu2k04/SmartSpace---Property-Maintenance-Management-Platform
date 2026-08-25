using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSpace.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteToTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "MaintenanceTickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "MaintenanceTickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "PasswordHash",
                value: "$2a$11$hEUrENARFGR1inxSGdDaLOoWeifD7CGYPU/EQ9pd0wgF/e7Zwd/Ra");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "PasswordHash",
                value: "$2a$11$hEUrENARFGR1inxSGdDaLOoWeifD7CGYPU/EQ9pd0wgF/e7Zwd/Ra");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "PasswordHash",
                value: "$2a$11$hEUrENARFGR1inxSGdDaLOoWeifD7CGYPU/EQ9pd0wgF/e7Zwd/Ra");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "PasswordHash",
                value: "$2a$11$hEUrENARFGR1inxSGdDaLOoWeifD7CGYPU/EQ9pd0wgF/e7Zwd/Ra");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "MaintenanceTickets");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "MaintenanceTickets");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "PasswordHash",
                value: "$2a$11$9le9153OsW743WF5Ngj1Z.g9TjZ2atCuZAgWHdVXS8reDRMRXkKOS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "PasswordHash",
                value: "$2a$11$9le9153OsW743WF5Ngj1Z.g9TjZ2atCuZAgWHdVXS8reDRMRXkKOS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "PasswordHash",
                value: "$2a$11$9le9153OsW743WF5Ngj1Z.g9TjZ2atCuZAgWHdVXS8reDRMRXkKOS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "PasswordHash",
                value: "$2a$11$9le9153OsW743WF5Ngj1Z.g9TjZ2atCuZAgWHdVXS8reDRMRXkKOS");
        }
    }
}
