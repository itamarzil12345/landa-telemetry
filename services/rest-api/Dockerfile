FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY services/rest-api/rest-api.csproj services/rest-api/
COPY services/sql-service/Protos services/sql-service/Protos
RUN dotnet restore services/rest-api/rest-api.csproj
COPY services/rest-api/. services/rest-api/
WORKDIR /src/services/rest-api
RUN dotnet publish rest-api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "rest-api.dll"]
