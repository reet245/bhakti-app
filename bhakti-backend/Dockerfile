FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean verify

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd --system bhakti && useradd --system --gid bhakti bhakti
COPY --from=build --chown=bhakti:bhakti /app/target/*.jar app.jar
USER bhakti
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
