FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY services/telemetry-service/telemetry-service.csproj services/telemetry-service/
RUN dotnet restore services/telemetry-service/telemetry-service.csproj
COPY services/telemetry-service/. services/telemetry-service/
WORKDIR /src/services/telemetry-service
RUN dotnet publish telemetry-service.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "telemetry-service.dll"]
