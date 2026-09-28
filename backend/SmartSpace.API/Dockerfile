# ==============================================================================
# Multi-Stage Production Dockerfile for SmartSpace.API (.NET 8 Web API)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Publish (SDK)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy source files from the build context
COPY . .

# Normalize directory structure if built directly from backend/SmartSpace.API/
# Ensures 'backend/SmartSpace.API/SmartSpace.API.csproj' path resolves whether
# built from the repository root or the API project directory.
RUN if [ ! -f "backend/SmartSpace.API/SmartSpace.API.csproj" ]; then \
        mkdir -p backend/SmartSpace.API && \
        find . -maxdepth 1 ! -name . ! -name .. ! -name backend -exec mv {} backend/SmartSpace.API/ \; ; \
    fi

# Restore dependencies for SmartSpace.API
RUN dotnet restore "backend/SmartSpace.API/SmartSpace.API.csproj"

# Build and publish release binaries
RUN dotnet publish "backend/SmartSpace.API/SmartSpace.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# ------------------------------------------------------------------------------
# Stage 2: Final Production Runtime (ASP.NET Core 8)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Expose port 8080 and configure ASP.NET Core default binding
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Copy published application from build stage
COPY --from=build /app/publish .

# Define entrypoint to run compiled Web API DLL
ENTRYPOINT ["dotnet", "SmartSpace.API.dll"]
