# Bhakti Backend

Portable Java 17 Spring Boot backend for the Bhakti Expo React Native devotional app.

The backend is designed to run locally now and later deploy to Docker-based platforms, AWS, or Railway without rewriting business logic. Secrets are read from environment variables only.

## Run Locally

Install Java 17 and Maven, then run:

```bash
mvn spring-boot:run
```

The server starts on `http://localhost:8080` unless `PORT` is set.

## Environment Variables

```bash
DREAM_API_URL=
DREAM_API_KEY=
DREAM_API_TIMEOUT_MS=30000
ALLOWED_ORIGINS=*
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=60000
SPRING_PROFILES_ACTIVE=prod
```

`DREAM_API_KEY` is optional at startup but required if your external Dream Interpreter API requires authentication. Do not commit `.env`.

## Health Check

```bash
curl http://localhost:8080/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "service": "Bhakti Backend"
  }
}
```

## Dream Interpretation

```bash
curl -X POST http://localhost:8080/api/v1/dream/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "dreamText": "I saw Lord Shiva in a temple",
    "date": "26 May 2026",
    "time": "07:29 AM",
    "location": "Delhi",
    "language": "English"
  }'
```

Empty dream text validation:

```bash
curl -X POST http://localhost:8080/api/v1/dream/interpret \
  -H "Content-Type: application/json" \
  -d '{"dreamText": ""}'
```

Expected error format:

```json
{
  "success": false,
  "message": "Dream text is required."
}
```

## Build Jar

```bash
mvn clean package
```

Run the jar:

```bash
java -jar target/bhakti-backend-0.0.1-SNAPSHOT.jar
```

## Docker

Build:

```bash
docker build -t bhakti-backend .
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e DREAM_API_URL="https://your-dream-api.example.com/interpret" \
  -e DREAM_API_KEY="your-secret-key" \
  -e ALLOWED_ORIGINS="*" \
  bhakti-backend
```

## External Dream API Integration

`DreamApiClient` currently sends a placeholder JSON payload:

```json
{
  "prompt": "..."
}
```

Update `buildRequestBody` and `extractInterpretationText` when you know the provider's exact request and response format. The default authentication header is:

```http
Authorization: Bearer <DREAM_API_KEY>
```

Change the header constants in `DreamApiClient` if the provider requires another format, such as `x-api-key`.

## Response Cleaning

AI responses are cleaned before reaching the frontend:

```java
text.replaceAll("(?is)<think>.*?</think>", "").trim();
```

This removes internal reasoning enclosed in `<think>...</think>`.

## Rate Limiting

A simple in-memory rate limiter is enabled for `POST /api/v1/dream/interpret`.

Defaults:

- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_MAX_REQUESTS=30`
- `RATE_LIMIT_WINDOW_MS=60000`

This is safe for local and single-instance deployments, but it resets on restart and does not coordinate across multiple containers. For production on AWS or another container platform, prefer gateway/edge rate limiting or a Redis-backed limiter when multiple replicas are used.

## PostgreSQL and Flyway Later

No database dependency is included right now. When persistence is needed, add:

- PostgreSQL JDBC driver
- Spring Data JPA or JDBC, depending on the data model
- Flyway for migrations under `src/main/resources/db/migration`
- Environment variables for database URL, username, and password

Keep storage external. Do not store user files on the server disk.

## AWS Deployment Notes

The application is portable and contains no AWS-specific business logic. For AWS later:

- Build and publish the Docker image to a container registry.
- Set environment variables in the deployment service.
- Keep secrets in a managed secret store or injected environment.
- Use managed logging and metrics outside application business logic.
- Place PostgreSQL, object storage, and rate limiting behind interfaces when those features are added.
