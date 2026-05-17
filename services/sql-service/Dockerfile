FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY services/sql-service/sql-service.csproj services/sql-service/
COPY services/sql-service/Protos services/sql-service/Protos
COPY services/sql-service/Services services/sql-service/Services
COPY services/sql-service/TelemetryContext.cs services/sql-service/
COPY services/sql-service/Models services/sql-service/Models
RUN dotnet restore services/sql-service/sql-service.csproj
COPY services/sql-service/. services/sql-service/
WORKDIR /src/services/sql-service
RUN dotnet publish sql-service.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "sql-service.dll"]
